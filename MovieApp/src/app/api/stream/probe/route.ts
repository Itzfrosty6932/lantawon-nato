import { NextRequest, NextResponse } from "next/server";
import { STREAM_SERVERS, getStreamingServersFor } from "@/lib/constants/streaming-servers";
import { getServerIdentity } from "@/lib/server/auth";
import { fetchTmdb } from "@/lib/api/tmdb";

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

const probeHits = new Map<string, number[]>();
const PROBE_WINDOW_MS = 60_000;
const PROBE_MAX_PER_MINUTE = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (probeHits.get(ip) || []).filter((t) => now - t < PROBE_WINDOW_MS);
  hits.push(now);
  probeHits.set(ip, hits);
  if (probeHits.size > 5000) {
    for (const [k, v] of probeHits) {
      if (v.every((t) => now - t >= PROBE_WINDOW_MS)) probeHits.delete(k);
    }
  }
  return hits.length > PROBE_MAX_PER_MINUTE;
}

export async function GET(req: NextRequest) {
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
  const rawId = searchParams.get("id") || searchParams.get("tmdbId") || "";
  const mediaId = /^\d+$/.test(rawId) ? rawId : "";
  const rawType = (searchParams.get("type") || searchParams.get("mediaType") || "movie").toLowerCase();
  let canonicalType: "movie" | "tv" = rawType === "tv" || rawType === "anime" || rawType === "series" || rawType === "show" ? "tv" : "movie";

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

  // Canonical TMDB Media Type Verification
  try {
    if (canonicalType === "tv") {
      const tvData = await fetchTmdb(`/tv/${mediaId}`).catch(() => null);
      if (!tvData || (!tvData.name && !tvData.seasons)) {
        const movieData = await fetchTmdb(`/movie/${mediaId}`).catch(() => null);
        if (movieData?.title) {
          canonicalType = "movie";
        }
      }
    } else {
      const movieData = await fetchTmdb(`/movie/${mediaId}`).catch(() => null);
      if (!movieData || !movieData.title) {
        const tvData = await fetchTmdb(`/tv/${mediaId}`).catch(() => null);
        if (tvData?.name || tvData?.seasons) {
          canonicalType = "tv";
        }
      }
    }
  } catch {}

  const serverPool = getStreamingServersFor(rawType === "anime" ? "anime" : canonicalType);

  // Probe stream mirrors with resilient requests
  const probePromises = serverPool.map(async (server): Promise<ServerHealthStatus> => {
    const url = server.buildUrl(mediaId, canonicalType === "tv", season, episode);
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

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
      const xFrameOptions = res.headers.get("x-frame-options")?.toLowerCase() || "";
      const isFrameBlocked = xFrameOptions === "deny" || xFrameOptions === "sameorigin";

      const body = await res.text().catch(() => "");
      const bodyLower = body.toLowerCase();
      const hasMissingContent =
        bodyLower.includes("couldn't find this content") ||
        bodyLower.includes("could not find this content") ||
        bodyLower.includes("video not found") ||
        bodyLower.includes("content is not available") ||
        bodyLower.includes("media not found") ||
        bodyLower.includes("file not found") ||
        bodyLower.includes("video unavailable") ||
        bodyLower.includes("not found");

      let status: "online" | "degraded" | "offline" = "online";
      let isPlayable = true;

      if (isFrameBlocked || statusCode >= 400 || statusCode < 200 || hasMissingContent) {
        status = "offline";
        isPlayable = false;
      } else if (latencyMs > 2500) {
        status = "degraded";
        isPlayable = true;
      } else {
        status = "online";
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
      // Server is unreachable, connection refused, or timed out — mark accurately as OFFLINE
      return {
        id: server.id,
        name: server.name,
        badge: server.badge,
        quality: server.quality,
        status: "offline",
        latencyMs: 9999,
        statusCode: 504,
        isPlayable: false,
      };
    }
  });

  const results = await Promise.all(probePromises);
  const serverDefMap = new Map(serverPool.map((s) => [s.id, s]));

  const scoredServers = results.map((r) => {
    const def = serverDefMap.get(r.id);
    const tierBonus = def?.tier === 1 ? 800 : def?.tier === 2 ? 400 : 100;
    const cleanBonus = def?.isCleanHd ? 400 : 0;
    const noWatermarkBonus = def?.noWatermark ? 300 : 0;
    const playableBonus = r.isPlayable ? 1000 : -10000;
    const onlineBonus = r.status === "online" ? 500 : r.status === "degraded" ? 100 : -5000;
    const latencyPenalty = Math.min(r.latencyMs, 3000) * 0.1;
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
    mediaType: canonicalType,
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
