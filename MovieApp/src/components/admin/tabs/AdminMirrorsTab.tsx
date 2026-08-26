"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Zap,
  Sparkles,
  RefreshCw,
  Power,
  AlertTriangle,
  Loader2,
  Wifi,
  ShieldCheck,
} from "lucide-react";
import { STREAM_SERVERS } from "@/lib/constants/streaming-servers";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";

interface ProbeResult {
  id: string;
  ok: boolean;
  latencyMs: number | null;
  httpStatus: number | null;
  error: string | null;
}

interface MirrorState {
  id: string;
  name: string;
  status: "online" | "offline" | "unknown";
  latencyMs: number | null;
  httpStatus: number | null;
  error: string | null;
  adRating: string;
  isCleanHd?: boolean;
  tier: number;
  probedAt: string | null;
}

const INITIAL_MIRRORS: MirrorState[] = STREAM_SERVERS.map((server) => ({
  id: server.id,
  name: server.name,
  // No fabricated health — every mirror starts "unknown" until a real
  // probe runs against it.
  status: "unknown",
  latencyMs: null,
  httpStatus: null,
  error: null,
  adRating: server.isCleanHd ? "Zero Ads" : "Low Ad Density",
  isCleanHd: server.isCleanHd,
  tier: server.tier,
  probedAt: null,
}));

export function AdminMirrorsTab() {
  const { showToast } = useToast();
  const [isProbing, setIsProbing] = useState(false);
  const [mirrors, setMirrors] = useState<MirrorState[]>(INITIAL_MIRRORS);
  const [lastProbeAt, setLastProbeAt] = useState<string | null>(null);
  const didAutoProbe = useRef(false);

  const runProbe = useCallback(
    async (mode: "auto" | "manual") => {
      setIsProbing(true);
      if (mode === "manual") audioFX.playClick();

      try {
        const res = await fetch("/api/admin/probe-mirrors", { method: "POST" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { probedAt: string; results: ProbeResult[] };

        const byId = new Map(data.results.map((r) => [r.id, r]));
        setMirrors((prev) =>
          prev.map((m) => {
            const r = byId.get(m.id);
            if (!r) return m;
            return {
              ...m,
              status: r.ok ? "online" : "offline",
              latencyMs: r.latencyMs,
              httpStatus: r.httpStatus,
              error: r.error,
              probedAt: data.probedAt,
            };
          })
        );
        setLastProbeAt(data.probedAt);

        // Silent on the automatic mount probe — only the manual button
        // surfaces a toast so passive health checks don't spam the admin.
        if (mode === "manual") {
          const onlineCount = data.results.filter((r) => r.ok).length;
          showToast(
            `⚡ Probe complete — ${onlineCount}/${data.results.length} mirrors responding.`,
            onlineCount === data.results.length ? "success" : "info"
          );
        }
      } catch (err) {
        console.error("Mirror probe failed:", JSON.stringify(err));
        if (mode === "manual") {
          showToast(
            `❌ Probe failed: ${err instanceof Error ? err.message : "unknown error"}`,
            "error"
          );
        }
      } finally {
        setIsProbing(false);
      }
    },
    [showToast]
  );

  // Passive health: probe automatically once when the tab opens so mirror
  // status is known without the admin clicking anything. The probe is a
  // read-only server-side reachability check — it never touches any viewer's
  // active playback (see isolation note below).
  useEffect(() => {
    if (didAutoProbe.current) return;
    didAutoProbe.current = true;
    runProbe("auto");
  }, [runProbe]);

  const handleProbeAll = () => runProbe("manual");

  const probedMirrors = mirrors.filter((m) => m.status !== "unknown");
  const onlineCount = probedMirrors.filter((m) => m.status === "online").length;
  const latencies = probedMirrors
    .map((m) => m.latencyMs)
    .filter((v): v is number => typeof v === "number");
  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading">
            Streaming Mirror Engine &amp; Health Probe
          </h3>
          <p className="text-xs text-zinc-400">
            {lastProbeAt
              ? "Health checked automatically when you opened this tab. Refresh any time."
              : "Checking mirror health automatically…"}
          </p>
        </div>

        <button
          onClick={handleProbeAll}
          disabled={isProbing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-60 text-white text-xs font-bold transition-all shadow-md self-start sm:self-auto"
        >
          {isProbing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span>{isProbing ? "Checking…" : "Refresh Health"}</span>
        </button>
      </div>

      {/* Isolation reassurance — the probe is a read-only reachability check
          run from the server; it does not refresh or interrupt anyone's stream. */}
      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-200/80 leading-relaxed">
          <strong className="text-emerald-300">Safe to check anytime.</strong> This
          is a read-only reachability probe run from the server — it never refreshes
          mirrors or interrupts anyone who is currently watching. Viewers keep
          choosing mirrors by their own preference; this panel is just your private
          health view.
        </p>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-1">
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Responding Mirrors</div>
          <div className="text-2xl font-black font-mono">
            {probedMirrors.length === 0 ? (
              <span className="text-zinc-600">—</span>
            ) : (
              <span
                className={
                  onlineCount === probedMirrors.length ? "text-emerald-400" : "text-amber-400"
                }
              >
                {onlineCount} / {probedMirrors.length} Online
              </span>
            )}
          </div>
          {!lastProbeAt && (
            <div className="text-[10px] text-zinc-500 font-mono">checking automatically…</div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-1">
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Avg Response Latency</div>
          <div className="text-2xl font-black font-mono">
            {avgLatency === null ? (
              <span className="text-zinc-600">—</span>
            ) : (
              <span className="text-cyan-400">{avgLatency} ms</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-1">
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Auto-Failover Policy</div>
          <div className="text-sm font-bold text-white flex items-center gap-1.5 pt-1">
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span>Tier order (1 → 3)</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            player falls through mirrors in priority order
          </div>
        </div>
      </div>

      {/* Mirrors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {mirrors.map((m) => (
          <MirrorCard key={m.id} mirror={m} />
        ))}
      </div>
    </div>
  );
}

function MirrorCard({ mirror }: { mirror: MirrorState }) {
  const isOnline = mirror.status === "online";
  const isUnknown = mirror.status === "unknown";

  const statusDot = isUnknown ? (
    <span className="h-2 w-2 rounded-full bg-zinc-600" />
  ) : isOnline ? (
    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
  ) : (
    <span className="h-2 w-2 rounded-full bg-rose-500" />
  );

  const statusLabel = isUnknown
    ? "Not probed"
    : isOnline
      ? `HTTP ${mirror.httpStatus ?? "?"}`
      : (mirror.error ?? "unreachable");

  return (
    <div
      className={`p-4 rounded-2xl border transition-all space-y-3 ${
        isUnknown
          ? "bg-zinc-950/90 border-zinc-800/60 opacity-75"
          : isOnline
            ? "bg-zinc-900/90 border-zinc-800/80 hover:border-zinc-700"
            : "bg-zinc-950/90 border-rose-900/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            {statusDot}
            <span className="text-xs font-bold text-white font-heading truncate">
              {mirror.name}
            </span>
          </div>
          <div className="text-[10px] font-mono text-zinc-500">ID: {mirror.id}</div>
        </div>

        <span
          className={`px-2 py-0.5 shrink-0 rounded-lg border text-[9px] font-mono font-bold ${
            mirror.tier === 1
              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
              : mirror.tier === 2
                ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/5"
                : "border-zinc-700 text-zinc-400"
          }`}
        >
          TIER {mirror.tier}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
          <div className="text-zinc-500 text-[10px] flex items-center gap-1">
            <Wifi className="h-3 w-3" /> Latency
          </div>
          <div
            className={`font-bold ${
              mirror.latencyMs == null
                ? "text-zinc-600"
                : mirror.latencyMs < 800
                  ? "text-emerald-400"
                  : "text-amber-400"
            }`}
          >
            {mirror.latencyMs == null ? "—" : `${mirror.latencyMs} ms`}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
          <div className="text-zinc-500 text-[10px]">Status</div>
          <div
            className={`font-bold truncate ${
              isUnknown ? "text-zinc-600" : isOnline ? "text-emerald-400" : "text-rose-400"
            }`}
            title={statusLabel}
          >
            {isUnknown ? "—" : statusLabel}
          </div>
        </div>
      </div>

      {!isUnknown && !isOnline && (
        <div className="flex items-center gap-1.5 text-[10px] text-rose-300 font-mono">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span className="truncate">{statusLabel}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-zinc-800/60">
        {mirror.isCleanHd ? (
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <Sparkles className="h-3 w-3" /> Clean HD · Ad-Free
          </span>
        ) : (
          <span className="text-zinc-400">{mirror.adRating}</span>
        )}
        {isUnknown ? (
          <Power className="h-3 w-3 text-zinc-600" aria-hidden />
        ) : (
          <span className="text-zinc-500 font-mono">
            {new Date(mirror.probedAt!).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
