"use client";

import React, { useState } from "react";
import {
  Server,
  X,
  Zap,
  RefreshCw,
  Sparkles,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { STREAM_SERVERS } from "@/lib/constants/streaming-servers";
import { audioFX } from "@/lib/audio/audio-fx";

interface ServerPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeServer: string;
  onSelectServer: (serverId: string) => void;
  localId?: string | null;
  serverHealth: Record<
    string,
    {
      status: "online" | "degraded" | "offline" | "probing";
      latencyMs?: number;
      isPlayable?: boolean;
    }
  >;
  isProbing: boolean;
  onProbeServers: () => void;
  onAutoSelectBest: () => void;
  playableCount: number;
}

export function ServerPickerDrawer({
  isOpen,
  onClose,
  activeServer,
  onSelectServer,
  localId,
  serverHealth,
  isProbing,
  onProbeServers,
  onAutoSelectBest,
  playableCount,
}: ServerPickerDrawerProps) {
  const [serverFilter, setServerFilter] = useState<"all" | "clean">("all");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0D0D0D] sm:bg-black/80 sm:backdrop-blur-sm flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-2xl bg-[#0D0D0D] sm:bg-[#18191a] border-0 sm:border sm:border-zinc-800 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-[#141414] sm:bg-transparent">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Server className="h-4 w-4 text-[#E50914] shrink-0" />
            <h3 className="font-heading text-xs sm:text-sm font-bold text-white truncate">
              Streaming Mirrors &amp; Failover CDN
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {playableCount}/{STREAM_SERVERS.length} Online
            </span>
            <button
              onClick={() => {
                audioFX.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
              aria-label="Close Mirrors Menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Actions & Filter Tabs */}
        <div className="p-4 sm:p-3.5 border-b border-zinc-800/80 bg-[#161616] sm:bg-[#242526] shrink-0 space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAutoSelectBest();
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#E50914] text-white font-bold text-xs shadow-md hover:bg-red-600 transition-all"
            >
              <Zap className="h-3.5 w-3.5 fill-current" /> Auto-Pick Direct Cloud HD Mirror
            </button>
            <button
              onClick={onProbeServers}
              disabled={isProbing}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#18191a] text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isProbing ? "animate-spin" : ""}`} />
              <span>{isProbing ? "Probing..." : "Scan"}</span>
            </button>
          </div>

          {/* Direct Cloud HD vs All Mirrors Toggle */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => setServerFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                serverFilter === "all"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "bg-[#18191a] text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              All Mirrors ({STREAM_SERVERS.length})
            </button>
            <button
              onClick={() => setServerFilter("clean")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                serverFilter === "clean"
                  ? "bg-emerald-500 text-zinc-950 shadow-sm font-black"
                  : "bg-[#18191a] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Direct Cloud HD ({STREAM_SERVERS.filter((s) => s.isCleanHd).length})</span>
            </button>
          </div>
        </div>

        {/* Server List */}
        <div className="p-4 sm:p-3.5 overflow-y-auto space-y-2.5 flex-1 scrollbar-none pb-28 sm:pb-3.5">
          {/* Direct Cloud HD Advisory Tip */}
          <div className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/20 text-[11px] text-zinc-300 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Direct Cloud HD:</strong> Servers marked with <span className="text-emerald-400 font-bold">💎</span> stream high-quality 1080p/4K copies (watermarks may vary).
            </p>
          </div>

          {localId && (
            <button
              onClick={() => {
                audioFX.playClick();
                onSelectServer("local");
                onClose();
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                activeServer === "local"
                  ? "bg-white text-zinc-950 shadow-md"
                  : "bg-[#242526] text-zinc-300 border border-zinc-700/80 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" /> Local Offline File
              </span>
              <span className="text-[10px] font-mono">1080p</span>
            </button>
          )}

          {STREAM_SERVERS.filter((s) => (serverFilter === "clean" ? s.isCleanHd : true))
            .sort((a, b) => {
              const getWeight = (id: string) => {
                if (activeServer === id) return 0;
                const status = serverHealth[id]?.status;
                if (status === "online") return 1;
                if (status === "degraded") return 2;
                if (status === "probing") return 3;
                if (status === "offline") return 5;
                return 4; // unknown
              };
              return getWeight(a.id) - getWeight(b.id);
            })
            .map((server) => {
            const isActive = activeServer === server.id;
            const serverNumber = STREAM_SERVERS.findIndex((s) => s.id === server.id) + 1;
            const health = serverHealth[server.id];
            const isOffline = health?.status === "offline";
            const isProbingThis = health?.status === "probing" || isProbing;
            const isOnline = health?.status === "online";
            const isDegraded = health?.status === "degraded";

            return (
              <button
                key={server.id}
                onClick={() => {
                  audioFX.playClick();
                  onSelectServer(server.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-zinc-950 shadow-md font-bold"
                    : isOffline
                    ? "bg-[#18191a] text-zinc-600 border border-zinc-800/80 hover:bg-[#242526] hover:text-zinc-400"
                    : "bg-[#242526] text-zinc-200 border border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-[10px] font-mono shrink-0 ${isActive ? "text-zinc-600" : "text-zinc-500"}`}>
                    #{serverNumber}
                  </span>
                  <div className="text-left min-w-0">
                    <div className="truncate font-bold flex items-center gap-1.5">
                      <span className="truncate">Server {serverNumber}</span>
                      {server.isCleanHd && (
                        <span className={`text-[9px] font-mono font-bold shrink-0 ${
                          isActive ? "text-emerald-900" : "text-emerald-400"
                        }`}>
                          💎 HD
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Real-time Health / Playable Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  {isProbingThis ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                      Testing
                    </span>
                  ) : isOnline ? (
                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                      isActive
                        ? "bg-zinc-950 text-emerald-400"
                        : "bg-emerald-950/50 border border-emerald-500/30 text-emerald-400"
                    }`}>
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {health.latencyMs ? `${health.latencyMs}ms` : "READY"}
                    </span>
                  ) : isDegraded ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/50 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-400">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      SLOW
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-950/50 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-rose-400">
                      <XCircle className="h-2.5 w-2.5" />
                      OFFLINE
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
