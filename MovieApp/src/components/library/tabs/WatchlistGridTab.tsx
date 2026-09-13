"use client";

import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { audioFX } from "@/lib/audio/audio-fx";
import { LibraryCardActionsMenu } from "@/components/library/LibraryCardActionsMenu";
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

  const removeLabel = type === "watchlist" ? "Remove from Watchlist" : "Remove from Favorites";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map((item, idx) => {
        const mediaId = item.mediaId || item.id;
        return (
          <div
            key={`${type}_${item.id}_${idx}`}
            className="relative rounded-xl overflow-visible bg-[#18191a] group flex flex-col justify-between border border-zinc-800/80 hover:border-zinc-600 transition-all shadow-sm"
          >
            <div className="aspect-[2/3] w-full bg-zinc-950 rounded-t-xl overflow-hidden relative">
              <Link
                href={`/watch/${mediaId}?type=${item.mediaType}`}
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
                    id: mediaId,
                    title: item.title,
                    mediaType: item.mediaType as any,
                    posterPath: item.posterPath,
                  }}
                  onRemove={() => onRemoveItem(item.id, type)}
                  removeLabel={removeLabel}
                />
              </div>
            </div>

            <Link
              href={`/watch/${mediaId}?type=${item.mediaType}`}
              onClick={() => audioFX.playClick()}
              className="p-2.5 block hover:text-white"
            >
              <div className="font-heading text-xs font-bold text-white truncate">
                {item.title}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 capitalize">
                {item.mediaType}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
