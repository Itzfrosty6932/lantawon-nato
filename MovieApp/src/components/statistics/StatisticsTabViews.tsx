"use client";

import React from "react";
import {
  Clock,
  Bookmark,
  Heart,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import type {
  WatchHistoryRecord,
  LibraryItemRecord,
  LocalScannedMediaRecord,
} from "@/types/storage";

interface StatisticsTabViewsProps {
  activeTab: "history" | "library" | "local";
  history: WatchHistoryRecord[];
  library: LibraryItemRecord[];
  local: LocalScannedMediaRecord[];
  watchlistCount: number;
  favCount: number;
}

export function StatisticsTabViews({
  activeTab,
  history,
  library,
  local,
  watchlistCount,
  favCount,
}: StatisticsTabViewsProps) {
  if (activeTab === "history") {
    return (
      <div className="rounded-2xl bg-[#18191a] border border-zinc-800/80 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span>Watch History Log ({history.length})</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">
            No watch history yet. Start watching to track your stats!
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-none pr-1">
            {history.map((h, idx) => (
              <div
                key={`${h.id}_${idx}`}
                className="flex items-center gap-3 rounded-xl bg-[#242526] border border-zinc-700/80 p-3 hover:border-zinc-500 transition-colors"
              >
                <SmartImage
                  src={
                    h.posterPath
                      ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${h.posterPath.startsWith("/") ? "" : "/"}${h.posterPath}`
                      : TMDB_IMAGE_CONFIG.FALLBACK_POSTER
                  }
                  alt={h.title}
                  fallbackType="poster"
                  containerClassName="h-12 w-9 rounded-lg border border-white/10 shrink-0 bg-zinc-800"
                  className="h-full w-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{h.title}</div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                    <span className="capitalize text-cyan-400 font-semibold">{h.mediaType}</span>
                    {h.season && (
                      <span>
                        S{h.season}E{h.episode}
                      </span>
                    )}
                    <span>{new Date(h.lastWatchedAt).toLocaleDateString()}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden w-full max-w-[200px]">
                    <div
                      className={`h-full rounded-full ${
                        h.completed || h.percentage > 85 ? "bg-emerald-400" : "bg-cyan-400"
                      }`}
                      style={{ width: `${Math.min(h.percentage || 0, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] text-zinc-400 font-mono font-bold">
                    {h.percentage?.toFixed(0) || 0}%
                  </div>
                  {(h.completed || h.percentage > 85) && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "library") {
    const unifiedList = library.filter((l) => l.inWatchlist || l.isFavorite);
    return (
      <div className="space-y-4">
        {/* Watchlist */}
        <div className="rounded-2xl bg-[#18191a] border border-zinc-800/80 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
            <Bookmark className="h-4 w-4 text-amber-400" />
            <span>Saved Watchlist ({unifiedList.length})</span>
          </div>

          {unifiedList.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-sm">
              Nothing in your watchlist yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {unifiedList.map((l, idx) => (
                <div key={`stat_wl_${l.id}_${idx}`} className="space-y-1">
                  <SmartImage
                    src={
                      l.posterPath
                        ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${l.posterPath.startsWith("/") ? "" : "/"}${l.posterPath}`
                        : TMDB_IMAGE_CONFIG.FALLBACK_POSTER
                    }
                    alt={l.title}
                    fallbackType="poster"
                    containerClassName="w-full aspect-[2/3] rounded-lg border border-white/10 bg-zinc-800"
                    className="h-full w-full object-cover"
                  />
                  <div className="text-[9px] text-zinc-300 truncate">{l.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === "local") {
    return (
      <div className="rounded-2xl bg-[#18191a] border border-zinc-800/80 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
          <HardDrive className="h-4 w-4 text-emerald-400" />
          <span>Local Vault Files ({local.length})</span>
        </div>

        {local.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-sm">
            No local files indexed yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-none pr-1">
            {local.map((f, idx) => (
              <div
                key={`stat_local_${f.downloadId}_${idx}`}
                className="flex items-center gap-3 rounded-xl bg-[#242526] border border-zinc-700/80 p-3 hover:border-zinc-500 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-[#18191a] border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                  <HardDrive className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{f.title}</div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                    <span className="text-emerald-400 font-semibold uppercase">{f.quality}</span>
                    <span>{f.sizeFormatted}</span>
                    <span className="capitalize">{f.mediaType}</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 truncate mt-0.5">{f.fileName}</div>
                </div>
                <div
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                    f.status === "completed"
                      ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                      : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                  }`}
                >
                  {f.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
