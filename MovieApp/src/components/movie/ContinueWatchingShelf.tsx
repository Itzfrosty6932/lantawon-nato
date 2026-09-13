"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { db } from "@/lib/db/dexie-db";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import { useAuth } from "@/context/AuthContext";
import type { WatchHistoryRecord } from "@/types/storage";

function formatSecondsToTimestamp(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ContinueWatchingShelf() {
  const { user, isLoading } = useAuth();
  const isGuest = !user || !user.isLoggedIn || user.role === "guest";
  const [history, setHistory] = useState<WatchHistoryRecord[]>([]);

  useEffect(() => {
    if (isGuest) {
      setHistory([]);
      return;
    }

    const loadHistory = async () => {
      try {
        await db.migrateFromLocalStorage();
        const items = await db.watchHistory.orderBy("lastWatchedAt").reverse().limit(30).toArray();
        
        // Strictly deduplicate by mediaId (keep most recent)
        const seenMediaIds = new Set<string>();
        const uniqueItems: WatchHistoryRecord[] = [];

        for (const item of items) {
          const key = String(item.mediaId);
          if (!seenMediaIds.has(key)) {
            seenMediaIds.add(key);
            uniqueItems.push(item);
          }
        }

        setHistory(uniqueItems.slice(0, 10));
      } catch {}
    };
    loadHistory();
  }, [isGuest]);

  if (isLoading || isGuest || history.length === 0) return null;

  return (
    <section className="space-y-3.5 select-none">
      {/* ─── Header matching Screenshot 2 ─── */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-[#E50914] rounded-full shrink-0" />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Continue watching
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Pick up where you left off
          </p>
        </div>
      </div>

      {/* ─── Clean 16:9 Cards Row (Screenshot 2) ─── */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
        {history.map((item, idx) => {
          const posterUrl = item.posterPath
            ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.posterPath}`
            : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;
          const thumbUrl = item.backdropPath
            ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${item.backdropPath}`
            : posterUrl;

          const isTv = item.mediaType === "tv";
          const submeta = isTv && item.season && item.episode
            ? `S${item.season} E${item.episode}`
            : "Movie";

          const timestamp = formatSecondsToTimestamp(item.currentTime || 60);

          return (
            <Link
              key={`${item.id}_${idx}`}
              href={`/watch/${item.mediaId}?type=${item.mediaType}&season=${item.season || 1}&episode=${item.episode || 1}`}
              onClick={() => audioFX.playClick()}
              className="flex-none w-64 sm:w-72 group block cursor-pointer"
            >
              {/* 16:9 Aspect Video Backdrop Thumbnail */}
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-[#E50914] transition-colors">
                <SmartImage
                  src={thumbUrl}
                  alt={item.title}
                  fallbackType="backdrop"
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

                {/* Remaining / Current Time Badge (Bottom Right) */}
                <div className="absolute bottom-2 right-2 rounded-md bg-black/75 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-mono font-bold text-white border border-white/10">
                  {timestamp}
                </div>

                {/* Progress Bar (Bottom Line) */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-[#E50914]"
                    style={{ width: `${Math.min(Math.max(item.percentage || 15, 5), 100)}%` }}
                  />
                </div>
              </div>

              {/* Title and Meta Below Card */}
              <div className="pt-2 px-1 space-y-0.5">
                <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                  {item.title}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                  <span>2024</span>
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
