"use client";

import React from "react";
import Link from "next/link";
import { Play, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { audioFX } from "@/lib/audio/audio-fx";
import type { LibraryItemRecord } from "@/types/storage";

interface WatchlistGridTabProps {
  items: LibraryItemRecord[];
  type: "watchlist" | "favorite";
  emptyMessage: string;
  onRemoveItem: (id: string, type: "watchlist" | "favorite" | "local") => void;
}

export function WatchlistGridTab({
  items,
  type,
  emptyMessage,
  onRemoveItem,
}: WatchlistGridTabProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-500 text-xs rounded-2xl bg-[#18191a]/40 p-6 border border-zinc-800/80">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map((item, idx) => (
        <div
          key={`${type}_${item.id}_${idx}`}
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
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
              <Link
                href={`/watch/${item.mediaId || item.id}?type=${item.mediaType}`}
                onClick={() => audioFX.playClick()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950 font-bold shadow-md hover:scale-105 transition-transform"
              >
                <Play className="h-4 w-4 fill-current ml-0.5" />
              </Link>
              <button
                onClick={() => onRemoveItem(item.id, type)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#242526] text-rose-400 hover:bg-rose-500/20 transition-colors border border-zinc-700/80"
                title={`Remove from ${type === "watchlist" ? "Watchlist" : "Favorites"}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-2.5">
            <div className="font-heading text-xs font-bold text-white truncate">
              {item.title}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 capitalize">
              {item.mediaType}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
