"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Play, Trash2 } from "lucide-react";
import { db } from "@/lib/db/dexie-db";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import type { WatchHistoryRecord } from "@/types/storage";

export function ContinueWatchingShelf() {
  const { showToast } = useToast();
  const [history, setHistory] = useState<WatchHistoryRecord[]>([]);

  const loadHistory = async () => {
    try {
      await db.migrateFromLocalStorage();
      const items = await db.watchHistory.orderBy("lastWatchedAt").reverse().limit(10).toArray();
      setHistory(items);
    } catch {}
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = async (e: React.MouseEvent) => {
    e.preventDefault();
    audioFX.playPop();
    await db.clearAllHistory();
    setHistory([]);
    showToast("Watch history cleared", "info");
  };

  if (history.length === 0) return null;

  return (
    <section className="rounded-xl ui-surface p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#E50914]" />
          <h2 className="font-heading text-sm font-bold text-white">Continue Watching</h2>
          <span className="rounded bg-[#E50914]/15 px-1.5 py-0.2 text-[10px] font-bold text-white border border-[#E50914]/30 font-mono">
            {history.length} active
          </span>
        </div>
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400 hover:text-rose-400 hover:border-rose-500/20 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x">
        {history.map((item, idx) => {
          const posterUrl = item.posterPath
            ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.posterPath}`
            : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;
          const isTv = item.mediaType === "tv";
          const subtitle = isTv && item.season && item.episode ? `S${item.season} : E${item.episode}` : "Movie";

          return (
            <Link
              key={`${item.id}_${idx}`}
              href={`/watch/${item.mediaId}?type=${item.mediaType}&season=${item.season || 1}&episode=${item.episode || 1}`}
              onClick={() => audioFX.playClick()}
              className="flex-none w-48 rounded-lg ui-card overflow-hidden group snap-start block"
            >
              <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
                <SmartImage
                  src={item.backdropPath ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${item.backdropPath}` : posterUrl}
                  alt={item.title}
                  fallbackType="backdrop"
                  containerClassName="h-full w-full"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <span className="absolute top-1.5 left-1.5 rounded bg-zinc-950/85 px-1.5 py-0.5 text-[9px] font-bold text-white border border-white/10 z-10">
                  {subtitle}
                </span>

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E50914] text-white font-bold shadow-md">
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-[#E50914]"
                    style={{ width: `${item.percentage || 25}%` }}
                  />
                </div>
              </div>

              <div className="p-2">
                <h4 className="font-heading text-xs font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                  <span>{item.percentage ? `${Math.round(item.percentage)}% watched` : "Resume"}</span>
                  <span className="text-[#E50914] font-semibold flex items-center gap-0.5">
                    <Play className="h-2.5 w-2.5 fill-current" /> Play
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
