import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, UnauthorizedError } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * /api/admin/users   (ADMIN ONLY, service-role)
 *
 * Real user management for the admin portal.
 * Reads/writes go through the service-role client.
 *
 * GET    ?query=&page=&limit=      -> list users + subscription tier + device counts
 * GET    ?userId=xxx&details=true  -> deep-track user details (profile, sub, payments, refunds, tickets, watch time)
 * PATCH  { userId, role?, banned? } -> change role / ban / unban (enable/disable)
 * DELETE ?userId=                  -> delete auth user + cascading data
 */

export const dynamic = "force-dynamic";

const VALID_ROLES = ["user", "admin"] as const;

type AdminRole = (typeof VALID_ROLES)[number];

interface AdminUserRow {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
  role: string;
  is_premium: boolean;
  xp_total: number;
  current_level: number;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  subscription_status: string | null;
  package_name: string | null;
  period_start?: string | null;
  period_end: string | null;
  device_count: number;
}

async function writeAudit(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  actorId: string,
  action: string,
  entityId: string,
  newData: Record<string, unknown>
) {
  await admin.from("audit_logs").insert({
    actor_user_id: actorId,
    action,
    entity_type: "profile",
    entity_id: entityId,
    new_data: newData,
  });
}

// ── GET: list users or deep-track single user details ──────────────────────
export async function GET(req: NextRequest) {
  try {
    const identity = await requireAdmin();
    const admin = createAdminSupabaseClient();

    const targetUserId = req.nextUrl.searchParams.get("userId");
    const isDetails = req.nextUrl.searchParams.get("details") === "true";

    // ── Single User Deep Inspection ──
    if (targetUserId && isDetails) {
      const [
        { data: profile },
        { data: authUserRes },
        { data: accounts },
        { data: payments },
        { data: refunds },
        { data: tickets },
        { data: watchSessions },
        { data: watchProgress },
        { data: devices },
      ] = await Promise.all([
        admin.from("profiles").select("*").eq("id", targetUserId).single(),
        admin.auth.admin.getUserById(targetUserId),
        admin.from("accounts").select("id").eq("owner_user_id", targetUserId),
        admin
          .from("payment_submissions")
          .select("*, package:subscription_packages(name, price_php, promo_percent)")
          .eq("submitted_by_user_id", targetUserId)
          .order("submitted_at", { ascending: false }),
        admin
          .from("refund_requests")
          .select("*")
          .eq("requested_by_user_id", targetUserId)
          .order("created_at", { ascending: false }),
        admin
          .from("support_tickets")
          .select("*")
          .eq("created_by_user_id", targetUserId)
          .order("created_at", { ascending: false }),
        admin
          .from("watch_sessions")
          .select("*")
          .eq("user_id", targetUserId)
          .order("started_at", { ascending: false })
          .limit(50),
        admin
          .from("watch_progress")
          .select("*")
          .eq("user_id", targetUserId)
          .order("last_watched_at", { ascending: false })
          .limit(50),
        admin
          .from("user_devices")
          .select("*")
          .eq("user_id", targetUserId)
          .order("last_active_at", { ascending: false }),
      ]);

      if (!profile && !authUserRes?.user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Fetch active subscription if account exists
      let subscriptionData: any = null;
      if (accounts && accounts.length > 0) {
        const accountIds = accounts.map((a: { id: string }) => a.id);
        const { data: sub } = await admin
          .from("subscriptions")
          .select("*, package:subscription_packages!current_package_id(name, price_php, billing_interval)")
          .in("account_id", accountIds)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        subscriptionData = sub;
      }

      // Compute total watch time in seconds
      const totalWatchSeconds = (watchSessions || []).reduce(
        (sum: number, s: { watch_duration_seconds?: number }) => sum + (s.watch_duration_seconds || 0),
        0
      );

      const nonTrailerCount = (watchSessions || []).filter(
        (s: { is_trailer?: boolean }) => !s.is_trailer
      ).length;

      const authUser = authUserRes?.user;
      const banned =
        authUser && "banned_until" in authUser
          ? Boolean(authUser.banned_until && new Date(authUser.banned_until) > new Date())
          : false;

      return NextResponse.json({
        user: {
          id: targetUserId,
          email: authUser?.email ?? profile?.email ?? null,
          username: profile?.username ?? null,
          display_name: profile?.display_name ?? null,
          avatar_emoji: profile?.avatar_emoji ?? null,
          role: profile?.role ?? "user",
          created_at: profile?.created_at ?? authUser?.created_at ?? new Date().toISOString(),
          last_sign_in_at: authUser?.last_sign_in_at ?? null,
          banned: banned,
          subscription: subscriptionData,
          payments: payments || [],
          refunds: refunds || [],
          tickets: tickets || [],
          devices: devices || [],
          watchTelemetry: {
            totalWatchSeconds,
            nonTrailerCount,
            totalProgressItems: watchProgress?.length || 0,
            recentProgress: watchProgress || [],
            recentSessions: watchSessions || [],
          },
        },
      });
    }

    // ── List Users (Paginated & Filtered) ──
    const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10) || 100,
      500
    );

    let profileQuery = admin
      .from("profiles")
      .select("*")
      .neq("role", "admin") // Hide admin accounts from regular list
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query) {
      profileQuery = profileQuery.or(
        `username.ilike.%${query}%,display_name.ilike.%${query}%`
      );
    }

    const { data: profiles, error: profilesError } = await profileQuery;
    if (profilesError) throw profilesError;

    const ids = (profiles || []).map((p: { id: string }) => p.id);
    const idSet = new Set(ids);

    const { data: usersList } = await admin.auth.admin.listUsers({
      perPage: 500,
    });
    const authById = new Map(
      (usersList?.users || [])
        .filter((u) => idSet.has(u.id))
        .map((u) => [
          u.id,
          {
            email: u.email ?? null,
            lastSignIn: u.last_sign_in_at ?? null,
            banned:
              "banned_until" in u && typeof (u as { banned_until?: unknown }).banned_until === "string"
                ? Boolean(new Date((u as { banned_until: string }).banned_until) > new Date())
                : false,
          },
        ])
    );

    const { data: subRowData, error: subError } = await admin
      .from("subscriptions")
      .select(
        `status, current_period_start, current_period_end, account:accounts(owner_user_id), package:subscription_packages!current_package_id(name)`
      )
      .in("status", ["active", "pending_payment"]);
    if (subError) throw subError;

    const subByOwner = new Map<
      string,
      { status: string; packageName: string | null; periodStart: string | null; periodEnd: string | null }
    >();
    for (const row of (subRowData ?? []) as unknown as Array<{
      status: string;
      current_period_start: string | null;
      current_period_end: string | null;
      account: { owner_user_id: string }[] | { owner_user_id: string } | null;
      package: { name: string }[] | { name: string } | null;
    }>) {
      const acct = Array.isArray(row.account) ? row.account[0] : row.account;
      if (!acct || !idSet.has(acct.owner_user_id)) continue;
      if (!subByOwner.has(acct.owner_user_id)) {
        const pkg = Array.isArray(row.package) ? row.package[0] : row.package;
        subByOwner.set(acct.owner_user_id, {
          status: row.status,
          packageName: pkg?.name ?? null,
          periodStart: row.current_period_start ?? null,
          periodEnd: row.current_period_end ?? null,
        });
      }
    }

    const { data: sessionRows } = await admin
      .from("member_sessions")
      .select("user_id");
    const deviceCounts = new Map<string, number>();
    for (const s of sessionRows || []) {
      deviceCounts.set(s.user_id, (deviceCounts.get(s.user_id) ?? 0) + 1);
    }

    const rows: AdminUserRow[] = (profiles || []).map(
      (p: Record<string, unknown>) => {
        const pid = p.id as string;
        const auth = authById.get(pid);
        const sub = subByOwner.get(pid);
        return {
          id: pid,
          email: auth?.email ?? null,
          username: (p.username as string) ?? null,
          display_name: (p.display_name as string) ?? null,
          avatar_emoji: (p.avatar_emoji as string) ?? null,
          role: p.role as string,
          is_premium: !!p.is_premium,
          xp_total: (p.xp_total as number) ?? 0,
          current_level: (p.current_level as number) ?? 1,
          created_at: p.created_at as string,
          last_sign_in_at: auth?.lastSignIn ?? null,
          banned: auth?.banned ?? false,
          subscription_status: sub?.status ?? null,
          package_name: sub?.packageName ?? null,
          period_start: sub?.periodStart ?? null,
          period_end: sub?.periodEnd ?? null,
          device_count: deviceCounts.get(pid) ?? 0,
        };
      }
    );

    return NextResponse.json({ users: rows, total: rows.length });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: err.message },
        {
          status: err.message.includes("Authentication") ? 401 : 403,
        }
      );
    }
    console.error("[admin/users GET] unexpected error:", JSON.stringify(err));
    return NextResponse.json(
      { error: "Failed to load users." },
      { status: 500 }
    );
  }
}

// ── PATCH: change role or ban/unban (enable/disable) ────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const identity = await requireAdmin();
    const admin = createAdminSupabaseClient();

    const body = (await req.json()) as {
      userId?: string;
      role?: AdminRole;
      banned?: boolean;
    };

    if (!body.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (
      body.role !== undefined &&
      !VALID_ROLES.includes(body.role)
    ) {
      return NextResponse.json(
        { error: `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    if (body.userId === identity.userId && body.role && body.role !== "admin") {
      return NextResponse.json(
        { error: "You cannot demote your own admin account." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    let auditAction: string | null = null;

    if (body.role !== undefined) {
      updates.role = body.role;
      auditAction = "admin.user_role_changed";
    }
    if (body.banned !== undefined) {
      updates.banned = body.banned;
      auditAction = auditAction
        ? "admin.user_role_and_ban_changed"
        : body.banned
          ? "admin.user_disabled"
          : "admin.user_enabled";
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update — provide role and/or banned." },
        { status: 400 }
      );
    }

    if (body.role !== undefined) {
      const { error } = await admin
        .from("profiles")
        .update({ role: body.role })
        .eq("id", body.userId);
      if (error) throw error;
    }

    if (body.banned !== undefined) {
      const { error } = await admin.auth.admin.updateUserById(body.userId, {
        ban_duration: body.banned ? "876000h" : "none",
      });
      if (error) throw error;

      if (body.banned) {
        await admin
          .from("member_sessions")
          .update({ revoked_at: new Date().toISOString() })
          .eq("user_id", body.userId)
          .is("revoked_at", null);
      }
    }

    await writeAudit(admin, identity.userId, auditAction!, body.userId, updates);

    return NextResponse.json({ ok: true, banned: body.banned });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: err.message },
        {
          status: err.message.includes("Authentication") ? 401 : 403,
        }
      );
    }
    console.error("[admin/users PATCH] unexpected error:", JSON.stringify(err));
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

// ── DELETE: remove a user entirely ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const identity = await requireAdmin();
    const admin = createAdminSupabaseClient();

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (userId === identity.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const { data: accounts } = await admin
      .from("accounts")
      .select("id")
      .eq("owner_user_id", userId);

    for (const acc of accounts || []) {
      await admin.from("subscriptions").delete().eq("account_id", acc.id);
      await admin.from("accounts").delete().eq("id", acc.id);
    }

    await admin.from("payment_submissions").delete().eq("submitted_by_user_id", userId);
    await admin.from("refund_requests").delete().eq("requested_by_user_id", userId);
    await admin.from("user_devices").delete().eq("user_id", userId);
    await admin.from("member_sessions").delete().eq("user_id", userId);

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    await writeAudit(admin, identity.userId, "admin.user_deleted", userId, {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: err.message },
        {
          status: err.message.includes("Authentication") ? 401 : 403,
        }
      );
    }
    console.error("[admin/users DELETE] unexpected error:", JSON.stringify(err));
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}
