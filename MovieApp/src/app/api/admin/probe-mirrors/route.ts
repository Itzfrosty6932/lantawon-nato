import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, UnauthorizedError } from "@/lib/server/auth";
import { STREAM_SERVERS } from "@/lib/constants/streaming-servers";

/**
 * POST /api/admin/probe-mirrors   (ADMIN ONLY)
 *
 * Real health probe for every configured stream mirror. Browsers can't do
 * this directly (third-party embeds are CORS-blocked), so it runs
 * server-side: a lightweight GET against each mirror's origin measures
 * reachability and response latency.
 *
 * A 4xx from the embed host (bot checks, missing IDs) still proves the
 * edge answered — only network failures / timeouts count as offline.
 */

interface ProbeResult {
  id: string;
  ok: boolean;
  latencyMs: number | null;
  httpStatus: number | null;
  error: string | null;
}

const PROBE_TIMEOUT_MS = 6_000;

async function probeMirror(id: string, url: string): Promise<ProbeResult> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // Plain UA — we only care about reachability, not bot-bypass.
        "User-Agent": "Mozilla/5.0 (compatible; LantawonHealthProbe/1.0)",
        Accept: "text/html",
      },
      cache: "no-store",
    });
    return {
      id,
      ok: true,
      latencyMs: Date.now() - startedAt,
      httpStatus: res.status,
      error: null,
    };
  } catch (err) {
    const isAbort =
      err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
    return {
      id,
      ok: false,
      latencyMs: null,
      httpStatus: null,
      error: isAbort ? `timeout after ${PROBE_TIMEOUT_MS}ms` : "network unreachable",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(_req: NextRequest) {
  try {
    await requireAdmin();

    // Probe all mirrors concurrently; each has its own timeout so one dead
    // host doesn't stall the whole sweep.
    const results = await Promise.all(
      STREAM_SERVERS.map((server) =>
        probeMirror(server.id, server.buildUrl("0", false, 1, 1))
      )
    );

    return NextResponse.json({ probedAt: new Date().toISOString(), results });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: err.message.includes("Authentication") ? 401 : 403 });
    }
    console.error("[admin/probe-mirrors] unexpected error:", JSON.stringify(err));
    return NextResponse.json({ error: "Probe failed." }, { status: 500 });
  }
}
