"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import { db } from "@/lib/db/dexie-db";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import type { LibraryItemRecord } from "@/types/storage";

export function WatchlistShelf() {
  const [watchlist, setWatchlist] = useState<LibraryItemRecord[]>([]);

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        await db.migrateFromLocalStorage();
        const items = await db.libraryItems
          .filter((item) => item.inWatchlist === true)
          .reverse()
          .limit(30)
          .toArray();

        // Strictly deduplicate by mediaId
        const seenMediaIds = new Set<string>();
        const uniqueItems: LibraryItemRecord[] = [];

        for (const item of items) {
          const key = String(item.mediaId);
          if (!seenMediaIds.has(key)) {
            seenMediaIds.add(key);
            uniqueItems.push(item);
          }
        }

        setWatchlist(uniqueItems.slice(0, 10));
      } catch {}
    };
    loadWatchlist();
  }, []);

  if (watchlist.length === 0) return null;

  return (
    <section className="space-y-3.5 select-none">
      {/* ─── Header matching Screenshot 2 ─── */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-[#E50914] rounded-full shrink-0" />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Watchlist
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Saved for later
          </p>
        </div>
      </div>

      {/* ─── Clean 16:9 Cards Row (Screenshot 2) ─── */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
        {watchlist.map((item, idx) => {
          const posterUrl = item.posterPath
            ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.posterPath}`
            : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;

          const isTv = item.mediaType === "tv";
          const submeta = isTv ? "TV Show" : "Movie";
          const rating = item.rating ? Number(item.rating).toFixed(1) : "9.0";

          return (
            <Link
              key={`${item.id}_${idx}`}
              href={`/watch/${item.mediaId}?type=${item.mediaType}`}
              onClick={() => audioFX.playClick()}
              className="flex-none w-64 sm:w-72 group block cursor-pointer"
            >
              {/* 16:9 Aspect Video Backdrop Thumbnail */}
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-[#E50914] transition-colors">
                <SmartImage
                  src={posterUrl}
                  alt={item.title}
                  fallbackType="poster"
                  containerClassName="h-full w-full"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Hover Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="h-10 w-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title and Meta Below Card */}
              <div className="pt-2 px-1 space-y-0.5">
                <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                  {item.title}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                  <span className="flex items-center gap-0.5 text-[#E50914] font-bold">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{rating}</span>
                  </span>
                  <span>·</span>
                  <span>{submeta}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
