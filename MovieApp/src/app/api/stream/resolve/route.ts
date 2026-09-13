import { NextRequest, NextResponse } from "next/server";
import { STREAM_SERVERS, getStreamingServersFor } from "@/lib/constants/streaming-servers";
import { getServerIdentity } from "@/lib/server/auth";
import { fetchTmdb } from "@/lib/api/tmdb";

/**
 * GET /api/stream/resolve?id=&type=&s=&e=
 *
 * AUDIT C6: The single authorized gateway for mirror playback URLs.
 *
 * Why this exists: previously the client built third-party embed URLs
 * directly from STREAM_SERVERS (client-side constant), meaning anyone —
 * including expired subscribers, banned users, or scrapers — could read
 * the mirror list out of the JS bundle and bypass the platform entirely.
 * Now the client only ever learns a mirror's URL AFTER this route has
 * verified (1) a valid session and (2) an active subscription.
 *
 * Guest trial enforcement also lands here: guests may only resolve a
 * mirror while their server-side trial has remaining time.
 */

// In-memory short-TTL cache so repeated opens of the same title don't
// refan-out to 14 upstream hosts. Multi-instance deployments should move
// this to Redis/Upstash with the same interface.
const resolveCache = new Map<
  string,
  { expires: number; payload: Record<string, unknown> }
>();
const RESOLVE_CACHE_TTL_MS = 60_000;

export async function GET(req: NextRequest) {
  const identity = await getServerIdentity();

  type DenialCode =
    | "SUBSCRIPTION_REQUIRED"
    | "PENDING_APPROVAL"
    | "EXPIRED"
    | "GUEST_TRIAL_ENDED";

  // ── Entitlement / guest-trial gate ────────────────────────────────────
  try {
    const supabase = await (await import("@/lib/supabase/server")).createServerSupabaseClient();

    let entitled = false;
    let planCode = "free";
    let denialCode: DenialCode = "SUBSCRIPTION_REQUIRED";

    if (identity.isAuthenticated && identity.userId) {
      // Staff bypass: admins/mods/editors don't need a paid subscription
      // to inspect/watch any title — otherwise moderating catalog issues
      // and validating mirrors would be impossible.
      const STAFF_ROLES: readonly string[] = [
        "admin",
        "super_admin",
        "moderator",
        "editor",
        "analyst",
      ];
      if (STAFF_ROLES.includes(identity.role)) {
        entitled = true;
        planCode = "staff";
      }

      // ── Subscription entitlement (skipped for staff) ──────────────────
      if (!entitled) {
        let accountId: string | null = null;

        const { data: memberAccount } = await supabase
          .from("account_members")
          .select("account_id")
          .eq("user_id", identity.userId)
          .maybeSingle();

        if (memberAccount?.account_id) {
          accountId = memberAccount.account_id;
        } else {
          const { data: ownerAccount } = await supabase
            .from("accounts")
            .select("id")
            .eq("owner_user_id", identity.userId)
            .maybeSingle();
          if (ownerAccount?.id) {
            accountId = ownerAccount.id;
          }
        }

        let sub: {
          id: string;
          status: string;
          current_period_end: string;
          current_package_id: string | null;
        } | null = null;

        if (accountId) {
          const { data } = await supabase
            .from("subscriptions")
            .select("id, status, current_period_end, current_package_id")
            .eq("account_id", accountId)
            .order("current_period_end", { ascending: false })
            .limit(1)
            .maybeSingle();
          sub = data ?? null;
        }

        if (
          sub &&
          ["active", "trialing"].includes(sub.status) &&
          new Date(sub.current_period_end).getTime() >= Date.now()
        ) {
          entitled = true;
          if (sub.current_package_id) {
            const { data: pkg } = await supabase
              .from("subscription_packages")
              .select("code")
              .eq("id", sub.current_package_id)
              .single();
            planCode = pkg?.code ?? "free";
          }
        } else {
          // Logged in but not entitled — classify WHY so the client can show
          // the right CTA instead of a generic error.
          if (sub?.status === "pending_payment") {
            denialCode = "PENDING_APPROVAL";
          } else if (
            !sub ||
            new Date(sub!.current_period_end).getTime() < Date.now() ||
            sub!.status === "expired"
          ) {
            denialCode = sub ? "EXPIRED" : "SUBSCRIPTION_REQUIRED";
          }

          // A pending payment submission means "under review" regardless of
          // subscription row state (covers expired users who re-submitted).
          if (denialCode !== "PENDING_APPROVAL") {
            const { data: pendingPayment } = await supabase
              .from("payment_submissions")
              .select("id")
              .eq("submitted_by_user_id", identity.userId)
              .eq("status", "pending")
              .limit(1)
              .maybeSingle();
            if (pendingPayment) denialCode = "PENDING_APPROVAL";
          }
        }
      }
    } else {
      // ── Guest path: server-side device trial (Bug 1 fix) ──────────────
      // Previously this route 401-rejected all unauthenticated visitors and
      // separately trusted an "x-lantawon-guest" header no client ever sent,
      // so guests were ALWAYS blocked. Now the httpOnly fingerprint cookie
      // set by /api/guest-device is resolved against the guest_devices
      // registry via its SECURITY DEFINER RPC.
      const fingerprint = req.cookies.get("lantawon_guest_fp")?.value;
      if (fingerprint) {
        const { createClient: createAnonClient } = await import("@supabase/supabase-js");
        const anon = createAnonClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: guestRows, error: guestError } = await anon.rpc(
          "guest_device_lookup",
          { p_fingerprint: fingerprint }
        );
        const guest = guestRows?.[0];
        if (guest && !guest.is_expired && guest.remaining_seconds > 0) {
          entitled = true;
          planCode = "guest_trial";
        } else if (guest) {
          denialCode = "GUEST_TRIAL_ENDED";
        } else {
          // No row came back. Only an actual expired row means the trial ended —
          // an RPC error or empty result is an infrastructure problem, and
          // telling a first-time visitor their trial is over is the worst
          // possible reading of it. SUBSCRIPTION_REQUIRED makes the client
          // re-register the fingerprint and retry instead of bouncing them out.
          if (guestError) {
            console.error("[stream/resolve] guest_device_lookup failed:", guestError);
          }
          denialCode = "SUBSCRIPTION_REQUIRED";
        }
      } else {
        denialCode = "SUBSCRIPTION_REQUIRED";
      }
    }

    if (!entitled) {
      const messages: Record<DenialCode, string> = {
        SUBSCRIPTION_REQUIRED: "An active subscription is required to stream.",
        PENDING_APPROVAL:
          "Your payment is under review. Streaming unlocks once an admin approves it.",
        EXPIRED: "Your subscription has expired. Renew to keep watching.",
        GUEST_TRIAL_ENDED:
          "Your free trial has ended. Create an account to keep watching.",
      };
      return NextResponse.json(
        {
          error: messages[denialCode],
          code: denialCode,
          renewUrl: denialCode === "GUEST_TRIAL_ENDED" ? "/signup" : "/pricing",
        },
        { status: denialCode === "PENDING_APPROVAL" ? 403 : 402 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get("id") || "";
    const mediaId = /^\d+$/.test(rawId) ? rawId : "";
    const rawType = (searchParams.get("type") || searchParams.get("mediaType") || "movie").toLowerCase();
    let canonicalType: "movie" | "tv" = rawType === "tv" || rawType === "anime" || rawType === "series" || rawType === "show" ? "tv" : "movie";

    const clampInt = (v: string | null, fb: number) => {
      const n = parseInt(v || "", 10);
      return Number.isFinite(n) && n >= 1 ? Math.min(n, 500) : fb;
    };
    const season = clampInt(searchParams.get("s"), 1);
    const episode = clampInt(searchParams.get("e"), 1);

    if (!mediaId) {
      return NextResponse.json({ error: "Missing or invalid media id" }, { status: 400 });
    }

    // ── Canonical TMDB Media Type Verification ──────────────────────────
    // Ensures anime movies (like Solo Leveling: ReAwakening) are NEVER requested
    // as TV series, and vice-versa, guaranteeing the exact correct title streams.
    try {
      if (canonicalType === "tv") {
        const tvData = await fetchTmdb(`/tv/${mediaId}`).catch(() => null);
        if (!tvData || (!tvData.name && !tvData.seasons)) {
          // If not a valid TV show, check if it's a Movie
          const movieData = await fetchTmdb(`/movie/${mediaId}`).catch(() => null);
          if (movieData?.title) {
            canonicalType = "movie";
          }
        }
      } else {
        const movieData = await fetchTmdb(`/movie/${mediaId}`).catch(() => null);
        if (!movieData || !movieData.title) {
          // If not a valid Movie, check if it's a TV series
          const tvData = await fetchTmdb(`/tv/${mediaId}`).catch(() => null);
          if (tvData?.name || tvData?.seasons) {
            canonicalType = "tv";
          }
        }
      }
    } catch {}

    const cacheKey = `${canonicalType}:${mediaId}:${season}:${episode}`;
    const cached = resolveCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ ...cached.payload, planCode, entitled: true });
    }

    // ── Build mirror URLs SERVER-SIDE with Dedicated Category Pools ────
    const serverPool = getStreamingServersFor(rawType === "anime" ? "anime" : canonicalType);
    const mirrors = serverPool.map((s) => ({
      id: s.id,
      name: s.name,
      badge: s.badge,
      quality: s.quality,
      tier: s.tier,
      url: s.buildUrl(mediaId, canonicalType === "tv", season, episode),
    }));

    const payload = {
      mediaId,
      mediaType: canonicalType,
      season,
      episode,
      mirrors,
    };

    resolveCache.set(cacheKey, {
      expires: Date.now() + RESOLVE_CACHE_TTL_MS,
      payload,
    });

    return NextResponse.json(
      { ...payload, planCode, entitled: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (e) {
    console.error("[stream/resolve] error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
