"use client";

import React from "react";
import Link from "next/link";
import { History, Play } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { audioFX } from "@/lib/audio/audio-fx";
import { LibraryCardActionsMenu } from "@/components/library/LibraryCardActionsMenu";
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
            className="relative rounded-xl overflow-visible bg-[#18191a] group flex flex-col justify-between border border-zinc-800/80 hover:border-zinc-600 transition-all shadow-sm"
          >
            <div className="aspect-[2/3] w-full bg-zinc-950 rounded-t-xl overflow-hidden relative">
              <Link
                href={`/watch/${item.mediaId}?type=${item.mediaType}`}
                onClick={() => audioFX.playClick()}
                className="block h-full w-full relative"
              >
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
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 z-10">
                  <div
                    className="h-full bg-[#E50914]"
                    style={{ width: `${Math.min(100, item.percentage || 0)}%` }}
                  />
                </div>

                {/* Desktop Hover Quick Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center pointer-events-none z-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-950 font-bold shadow-lg transform group-hover:scale-105 transition-transform">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                </div>
              </Link>

              {/* 3-Dots Mobile & Tablet Menu (Always Accessible) */}
              <div className="absolute top-2 right-2 z-20">
                <LibraryCardActionsMenu
                  item={{
                    id: item.mediaId,
                    title: item.title,
                    mediaType: item.mediaType as any,
                    posterPath: item.posterPath,
                  }}
                  onRemove={() => onRemoveHistoryItem(item.id)}
                  removeLabel="Remove from History"
                />
              </div>
            </div>

            <Link
              href={`/watch/${item.mediaId}?type=${item.mediaType}`}
              onClick={() => audioFX.playClick()}
              className="p-2.5 block hover:text-white"
            >
              <div className="font-heading text-xs font-bold text-white truncate">{item.title}</div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                <span className="text-zinc-300 font-mono font-bold">
                  {epLabel || `${item.percentage || 0}%`}
                </span>
                <span>{dateStr}</span>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
