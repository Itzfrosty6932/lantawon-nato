"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Play, Star, Calendar } from "lucide-react";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import type { MediaItem } from "@/types/media";

interface SectionCatalogViewProps {
  title: string;
  subtitle?: string;
  endpoint: string;
  backHref: string;
  backLabel: string;
  onOpenTrailer?: (id: number | string, type: string, title: string, year: string) => void;
}

export function SectionCatalogView({
  title,
  subtitle,
  endpoint,
  backHref,
  backLabel,
  onOpenTrailer,
}: SectionCatalogViewProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchSectionPage = useCallback(
    async (page: number, append = false) => {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const separator = endpoint.includes("?") ? "&" : "?";
        const url = `${endpoint}${separator}page=${page}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load section");
        const data = await res.json();

        const results: MediaItem[] = data.results || data.items || [];
        const total = data.total_results ?? data.totalResults ?? results.length;
        const totalP = data.total_pages ?? data.totalPages ?? Math.ceil(total / 20);

        setItems((prev) => (append ? [...prev, ...results] : results));
        setTotalResults(total);
        setTotalPages(totalP);
        setCurrentPage(page);
      } catch (err) {
        console.error("Section load error:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    fetchSectionPage(1, false);
  }, [fetchSectionPage]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          !isLoadingMore &&
          currentPage < totalPages
        ) {
          fetchSectionPage(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [isLoading, isLoadingMore, currentPage, totalPages, fetchSectionPage]);

  return (
    <div className="space-y-6 pt-4 sm:pt-6 px-4 sm:px-8 lg:px-12 pb-24 animate-in fade-in select-none">
      {/* ── Circular Back Button (Top) ── */}
      <div className="flex items-center">
        <Link
          href={backHref}
          onClick={() => audioFX.playClick()}
          title="Back"
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black/60 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl transition-all flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 active:scale-95 shrink-0"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>
      </div>

      {/* ── Section Title & Accent Line (Below Back Button) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-[#E50914] rounded-full shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {totalResults > 0 && (
          <span className="text-xs font-mono text-zinc-400 self-start sm:self-center">
            {totalResults.toLocaleString()} Titles
          </span>
        )}
      </div>

      {/* ── Content Grid ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin text-[#E50914]" />
          <span className="text-xs">Loading {title}...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-zinc-400 text-sm">
          No titles found for this section.
        </div>
      ) : (
        <div className="space-y-8">
          {/* 16:9 Landscape Backdrop Grid (1 column on mobile matching Explore) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item, idx) => {
              const displayTitle = item.title || item.name || "Untitled";
              const rawYear =
                item.release_date || item.first_air_date || (item as any).year || "";
              const year = rawYear ? String(rawYear).substring(0, 4) : "";
              const rating =
                typeof item.vote_average === "number" && item.vote_average > 0
                  ? item.vote_average.toFixed(1)
                  : (item as any).rating
                  ? String((item as any).rating)
                  : null;
              const itemType =
                item.media_type === "tv"
                  ? "tv"
                  : item.media_type === "movie"
                  ? "movie"
                  : item.name
                  ? "tv"
                  : "movie";

              const backdropUrl = item.backdrop_path
                ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${item.backdrop_path}`
                : item.poster_path
                ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.poster_path}`
                : TMDB_IMAGE_CONFIG.FALLBACK_BACKDROP;

              const itemCategory = endpoint.includes("media_type=anime")
                ? "anime"
                : itemType;

              return (
                <Link
                  key={`${item.id}_${item.media_type || "m"}_${idx}`}
                  href={`/watch/${item.id}?type=${itemCategory}`}
                  onClick={() => audioFX.playClick()}
                  className="group relative block rounded-xl overflow-hidden transition-all duration-200 cursor-pointer"
                >
                  {/* 16:9 Backdrop Thumbnail */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-[#E50914] transition-colors">
                    <SmartImage
                      src={backdropUrl}
                      alt={displayTitle}
                      fallbackType="backdrop"
                      containerClassName="h-full w-full"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                    {/* Hover Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="h-11 w-11 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Title & Info Below Image */}
                  <div className="pt-2 px-1 space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                      {displayTitle}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                      {rating && (
                        <>
                          <span className="flex items-center gap-0.5 text-[#E50914] font-bold">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{rating}</span>
                          </span>
                          <span>·</span>
                        </>
                      )}
                      {year && <span className="font-mono">{year}</span>}
                      <span>·</span>
                      <span className="capitalize">{itemType === "tv" ? "TV Show" : "Movie"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-6 gap-2 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
              <span className="text-xs">Loading more titles...</span>
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          <div ref={loadMoreRef} className="h-8" />
        </div>
      )}
    </div>
  );
}
