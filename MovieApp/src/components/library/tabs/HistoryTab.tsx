"use client";

import React from "react";
import Link from "next/link";
import { History, Play, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { audioFX } from "@/lib/audio/audio-fx";
import type { WatchHistoryRecord } from "@/types/storage";

interface HistoryTabProps {
  historyList: WatchHistoryRecord[];
  onRemoveHistoryItem: (id: string) => void;
}

export function HistoryTab({ historyList, onRemoveHistoryItem }: HistoryTabProps) {
  if (historyList.length === 0) {
    return (
      <div className="rounded-2xl bg-[#18191a]/40 p-8 text-center text-zinc-500 text-xs border border-zinc-800/80">
        <History className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-white">No Watch History Found</h3>
        <p className="mt-1 max-w-sm mx-auto text-zinc-400">
          Titles you play will appear here with your saved timestamp and resume progress.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {historyList.map((item: WatchHistoryRecord, idx: number) => {
        const epLabel = item.season && item.episode ? `S${item.season} : E${item.episode}` : "";
        const dateStr = item.lastWatchedAt ? new Date(item.lastWatchedAt).toLocaleDateString() : "";

        return (
          <div
            key={`hist_${item.id}_${idx}`}
            className="relative rounded-xl overflow-hidden bg-[#18191a] group flex flex-col justify-between border border-zinc-800/80 hover:border-zinc-600 transition-all shadow-sm"
          >
            <div className="aspect-[2/3] w-full bg-zinc-950 overflow-hidden relative">
              <SmartImage
                src={
                  item.posterPath
                    ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.posterPath.startsWith("/") ? "" : "/"}${item.posterPath}`
                    : TMDB_IMAGE_CONFIG.FALLBACK_POSTER
                }
                alt={item.title}
                fallbackType="poster"
                containerClassName="h-full w-full"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
              />

              {/* Percentage Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                <div
                  className="h-full bg-[#E50914]"
                  style={{ width: `${Math.min(100, item.percentage || 0)}%` }}
                />
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                <Link
                  href={`/watch/${item.mediaId}?type=${item.mediaType}`}
                  onClick={() => audioFX.playClick()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950 font-bold shadow-md hover:scale-105 transition-transform"
                  title="Resume Playback"
                >
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </Link>
                <button
                  onClick={() => onRemoveHistoryItem(item.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#242526] text-rose-400 hover:bg-rose-500/20 transition-colors border border-zinc-700/80"
                  title="Delete from History"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-2.5">
              <div className="font-heading text-xs font-bold text-white truncate">{item.title}</div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                <span className="text-zinc-300 font-mono font-bold">
                  {epLabel || `${item.percentage || 0}%`}
                </span>
                <span>{dateStr}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
