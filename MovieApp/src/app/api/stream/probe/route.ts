import { NextRequest, NextResponse } from "next/server";
import { STREAM_SERVERS } from "@/lib/constants/streaming-servers";
import { getServerIdentity } from "@/lib/server/auth";

export interface ServerHealthStatus {
  id: string;
  name: string;
  badge: string;
  quality: string;
  status: "online" | "degraded" | "offline";
  latencyMs: number;
  statusCode?: number;
  isPlayable: boolean;
}

/**
 * Simple in-memory rate limiter (audit M3). Per-IP sliding window.
 * For multi-instance deployments replace with Upstash/Redis — the
 * interface stays the same.
 */
const probeHits = new Map<string, number[]>();
const PROBE_WINDOW_MS = 60_000;
const PROBE_MAX_PER_MINUTE = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (probeHits.get(ip) || []).filter((t) => now - t < PROBE_WINDOW_MS);
  hits.push(now);
  probeHits.set(ip, hits);
  // Opportunistic cleanup to avoid unbounded growth
  if (probeHits.size > 5000) {
    for (const [k, v] of probeHits) {
      if (v.every((t) => now - t >= PROBE_WINDOW_MS)) probeHits.delete(k);
    }
  }
  return hits.length > PROBE_MAX_PER_MINUTE;
}

export async function GET(req: NextRequest) {
  // AUDIT C6/M3: require a valid session before revealing mirror health.
  const identity = await getServerIdentity();
  if (!identity.isAuthenticated) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // AUDIT M3: per-IP throttle — each probe fans out ~14 upstream requests.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);

  // AUDIT M3: strict input validation — these values are interpolated into
  // third-party URLs both here and in the client iframe. Only digits pass.
  const rawId = searchParams.get("id") || searchParams.get("tmdbId") || "";
  const mediaId = /^\d+$/.test(rawId) ? rawId : "";
  const typeParam = searchParams.get("type") || searchParams.get("mediaType") || "movie";
  const mediaType = typeParam === "tv" ? "tv" : "movie";

  const clampInt = (v: string | null, fallback: number) => {
    const n = parseInt(v || "", 10);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(n, 500);
  };
  const season = clampInt(searchParams.get("s") || searchParams.get("season"), 1);
  const episode = clampInt(searchParams.get("e") || searchParams.get("episode"), 1);

  if (!mediaId) {
    return NextResponse.json({ error: "Missing or invalid media id" }, { status: 400 });
  }

  // Probe all 14 stream mirrors concurrently with resilient GET requests
  // AUDIT C6 (hardening pass): probe results NEVER include the embed URL.
  // Health data alone is enough for ranking; the URL is only ever handed out
  // by /api/stream/resolve after its auth + subscription gate. Previously
  // this route leaked every mirror's URL to any authenticated user —
  // including expired subscribers — defeating resolve's entitlement gate.
  const probePromises = STREAM_SERVERS.map(async (server): Promise<ServerHealthStatus> => {
    const url = server.buildUrl(mediaId, mediaType === "tv", season, episode);
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          Referer: "https://google.com",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;
      const statusCode = res.status;
      const body = await res.text().catch(() => "");
      const bodyLower = body.toLowerCase();
      const hasMissingContent =
        bodyLower.includes("couldn't find this content") ||
        bodyLower.includes("check back another time") ||
        bodyLower.includes("video not found") ||
        bodyLower.includes("content is not available");

      // Status classification
      let status: "online" | "degraded" | "offline" = "offline";
      let isPlayable = false;

      if (hasMissingContent) {
        status = "degraded";
        isPlayable = false;
      } else if (statusCode >= 200 && statusCode < 400) {
        status = "online";
        isPlayable = true;
      } else if (statusCode === 403 || statusCode === 429) {
        // AUDIT M3: a block/rate-limit is NOT proof of playability.
        // Mark unknown-but-possible so ranking prefers verified mirrors
        // but users aren't stranded when only guarded servers remain.
        status = "degraded";
        isPlayable = true;
      } else if (statusCode === 404 || statusCode === 410) {
        status = "offline";
        isPlayable = false;
      } else if (statusCode >= 500) {
        status = "degraded";
        isPlayable = false;
      } else {
        status = "degraded";
        isPlayable = true;
      }

      return {
        id: server.id,
        name: server.name,
        badge: server.badge,
        quality: server.quality,
        status,
        latencyMs,
        statusCode,
        isPlayable,
      };
    } catch {
      // If network aborted or timed out
      const latencyMs = Date.now() - start;
      return {
        id: server.id,
        name: server.name,
        badge: server.badge,
        quality: server.quality,
        status: latencyMs >= 3500 ? "degraded" : "offline",
        latencyMs,
        statusCode: 0,
        isPlayable: false,
      };
    }
  });

  const results = await Promise.all(probePromises);

  // Intelligent weighted ranking:
  // 1. Playable & Online Status (Must be verified active)
  // 2. Clean HD & Zero Gambling Watermarks (VidLink Pro, Embed.su, MultiEmbed get high priority)
  // 3. Low network latency
  const serverDefMap = new Map(STREAM_SERVERS.map((s) => [s.id, s]));

  const scoredServers = results.map((r) => {
    const def = serverDefMap.get(r.id);
    const tierBonus = def?.tier === 1 ? 500 : def?.tier === 2 ? 200 : 0;
    const cleanBonus = def?.isCleanHd ? 400 : 0;
    const noWatermarkBonus = def?.noWatermark ? 300 : 0;
    const playableBonus = r.isPlayable ? 1000 : -10000;
    const onlineBonus = r.status === "online" ? 500 : r.status === "degraded" ? 100 : -5000;
    const latencyPenalty = Math.min(r.latencyMs, 3000) * 0.2;
    const totalScore = playableBonus + onlineBonus + tierBonus + cleanBonus + noWatermarkBonus - latencyPenalty;

    return {
      ...r,
      totalScore,
      tier: def?.tier || 3,
      isCleanHd: Boolean(def?.isCleanHd),
      noWatermark: Boolean(def?.noWatermark),
      multiAudio: Boolean(def?.multiAudio),
    };
  });

  const bestServer = scoredServers.slice().sort((a, b) => b.totalScore - a.totalScore)[0] || scoredServers[0];

  const resultsMap: Record<string, typeof scoredServers[0]> = {};
  scoredServers.forEach((s) => {
    resultsMap[s.id] = s;
  });

  return NextResponse.json({
    mediaId,
    mediaType,
    season,
    episode,
    timestamp: new Date().toISOString(),
    totalServers: results.length,
    playableCount: results.filter((r) => r.isPlayable).length,
    bestServer: bestServer.id,
    cleanHdCount: results.filter((r) => r.isPlayable && serverDefMap.get(r.id)?.isCleanHd).length,
    servers: scoredServers,
    results: resultsMap,
  });
}
