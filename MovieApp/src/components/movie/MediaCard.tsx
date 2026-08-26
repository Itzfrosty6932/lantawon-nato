"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatYear } from "@/lib/utils/formatters";
import { audioFX } from "@/lib/audio/audio-fx";
import { SaveToPlaylistModal } from "@/components/playlist/SaveToPlaylistModal";
import { getGenreName } from "@/lib/constants/taxonomy";
import type { MediaItem } from "@/types/media";

// In-memory cache for trailer keys
const TRAILER_CACHE = new Map<string, string | null>();

interface MediaCardProps {
  item: MediaItem;
  isExpanded?: boolean;
  onOpenTrailer?: (id: number | string, type: string, title: string, year: string) => void;
}

export function MediaCard({ item, isExpanded = false }: MediaCardProps) {
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isTrailerActive, setIsTrailerActive] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayTitle = item.title || item.name || "Untitled";
  const releaseDate = item.release_date || item.first_air_date;
  const year = formatYear(releaseDate);
  const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : "7.5";
  const itemType = item.media_type || (item.title ? "movie" : "tv");
  const typeLabel = itemType === "tv" ? "Series" : "Movie";

  const primaryGenre = (item.genre_ids && item.genre_ids.length > 0)
    ? getGenreName(item.genre_ids[0])
    : (itemType === "tv" ? "Drama" : "Action");

  const formatImagePath = (base: string, path: string) => {
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const posterUrl = item.poster_path
    ? formatImagePath(TMDB_IMAGE_CONFIG.POSTER_BASE, item.poster_path)
    : item.backdrop_path
    ? formatImagePath(TMDB_IMAGE_CONFIG.BACKDROP_BASE, item.backdrop_path)
    : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;

  const backdropUrl = item.backdrop_path
    ? formatImagePath(TMDB_IMAGE_CONFIG.BACKDROP_BASE, item.backdrop_path)
    : posterUrl;

  const cacheKey = `${itemType}_${item.id}`;

  const fetchTrailer = async () => {
    if (TRAILER_CACHE.has(cacheKey)) {
      const key = TRAILER_CACHE.get(cacheKey) || null;
      setTrailerKey(key);
      if (key) setIsTrailerActive(true);
      return;
    }

    try {
      const res = await fetch(`/api/trailer?id=${item.id}&type=${itemType}`);
      if (res.ok) {
        const data = await res.json();
        const key = data.trailerKey || null;
        TRAILER_CACHE.set(cacheKey, key);
        if (isExpanded) {
          setTrailerKey(key);
          setIsTrailerActive(Boolean(key));
        }
      }
    } catch {
      TRAILER_CACHE.set(cacheKey, null);
    }
  };

  // Trigger trailer on expanded hover after 900ms
  useEffect(() => {
    if (isExpanded) {
      hoverTimerRef.current = setTimeout(() => {
        fetchTrailer();
      }, 900);
    } else {
      setIsTrailerActive(false);
      setTrailerKey(null);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    }

    return () => {
      setIsTrailerActive(false);
      setTrailerKey(null);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [isExpanded]);

  return (
    <>
      <div
        className={`relative w-full h-full ${
          isExpanded ? "aspect-auto" : "aspect-[2/3]"
        } overflow-hidden rounded-xl bg-[#141414] border select-none transition-colors duration-300 ${
          isExpanded
            ? "border-[#E31937]/50 shadow-[0_12px_32px_rgba(0,0,0,0.9),0_0_20px_rgba(227,25,55,0.25)]"
            : "border-white/5 shadow-md"
        }`}
      >
        <Link
          href={`/watch/${item.id}?type=${itemType}`}
          onClick={() => audioFX.playClick()}
          className="block h-full w-full relative"
        >
          {/* ─── 1. Background Visual: Frameless Trailer or Backdrop/Poster (100% Pantay Height) ─── */}
          {isTrailerActive && trailerKey ? (
            <div className="absolute inset-0 z-0 overflow-hidden bg-black animate-in fade-in duration-500 pointer-events-none select-none">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1`}
                title={`${displayTitle} Trailer`}
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute w-[260%] h-[260%] -left-[80%] -top-[80%] object-cover pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
              <div className="absolute inset-0 z-10 pointer-events-none" />
            </div>
          ) : (
            <SmartImage
              src={isExpanded ? backdropUrl : posterUrl}
              alt={displayTitle}
              fallbackType={isExpanded ? "backdrop" : "poster"}
              containerClassName="absolute inset-0 z-0 h-full w-full"
              className="h-full w-full object-cover transition-all duration-300"
            />
          )}

          {/* ─── 2. Cinematic Gradient Overlays ─── */}
          {isExpanded ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/90 via-[#0D0D0D]/40 to-transparent pointer-events-none z-10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/40 to-transparent pointer-events-none z-10" />
          )}

          {/* ─── 3. Top-Right Rating Badge (No Buttons) ─── */}
          <div className="absolute top-2.5 right-2.5 flex items-center z-20">
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[#FFF8E7] text-[11px] font-bold font-mono border border-white/10 shadow-sm">
              <Star className="h-3 w-3 fill-[#FFD106] text-[#FFD106]" />
              {rating}
            </div>
          </div>

          {/* ─── 4. Card Content: Expanded State vs Normal Poster State (Zero Button Overlays) ─── */}
          {isExpanded ? (
            <div className="absolute inset-0 flex flex-col justify-end p-3.5 sm:p-4 z-20 animate-in fade-in duration-300">
              <h3 className="text-[#FFF8E7] text-sm sm:text-base font-bold tracking-tight leading-tight line-clamp-1 drop-shadow-md">
                {displayTitle}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-[#A7A7A7] mt-1.5 font-medium flex-wrap">
                <span className="px-1.5 py-0.2 bg-white/10 text-zinc-300 rounded border border-white/10 font-bold">
                  18+
                </span>
                <span className="text-zinc-300 font-semibold">{primaryGenre}</span>
                <span>•</span>
                <span className="text-zinc-300">{year}</span>
                <span>•</span>
                <span className="text-zinc-400">{typeLabel}</span>
              </div>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-3 z-20">
              <h3 className="text-[#FFF8E7] text-xs font-bold tracking-tight leading-tight line-clamp-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                {displayTitle}
              </h3>
              <div className="flex items-center justify-between text-[10px] text-[#A7A7A7] mt-1 font-medium">
                <span className="truncate">{primaryGenre}</span>
                <span className="font-mono text-[#FFF8E7]/90 ml-1">{year}</span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Playlist Modal */}
      <SaveToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        item={{
          id: item.id,
          title: displayTitle,
          mediaType: itemType as any,
          posterPath: item.poster_path,
          year,
          rating: item.vote_average,
        }}
      />
    </>
  );
}
