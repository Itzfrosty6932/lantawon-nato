"use client";

import React, { RefObject } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Film,
  RotateCcw,
  Star,
  Play,
  ChevronDown,
} from "lucide-react";
import { MediaCard } from "@/components/movie/MediaCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import type { MediaItem } from "@/types/media";
import type { CatalogViewMode } from "@/components/catalog/DomainCatalogView";

interface CatalogMediaListProps {
  isLoading: boolean;
  isLoadingMore: boolean;
  items: MediaItem[];
  viewMode: CatalogViewMode;
  title: string;
  defaultMediaType: string;
  currentPage: number;
  totalPages: number;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  onReset: () => void;
  onLoadMore: () => void;
  onOpenTrailer: (mediaId: number | string, mediaType?: string, title?: string, year?: string) => void;
}

export function CatalogMediaList({
  isLoading,
  isLoadingMore,
  items,
  viewMode,
  title,
  defaultMediaType,
  currentPage,
  totalPages,
  loadMoreRef,
  onReset,
  onLoadMore,
  onOpenTrailer,
}: CatalogMediaListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <span className="text-xs">Loading {title.toLowerCase()}...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-zinc-900/30 border border-white/[0.06] text-center p-6 space-y-3">
        <Film className="h-10 w-10 text-zinc-600" />
        <h3 className="text-base font-bold text-white">No titles match your active filters</h3>
        <p className="text-xs text-zinc-400 max-w-sm">
          Try adjusting or resetting your genre, decade, origin, or minimum score criteria.
        </p>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 shadow-md hover:bg-zinc-200 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset All Filters</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Grid Mode */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((item, idx) => (
            <MediaCard
              key={`${item.media_type}_${item.id}_${idx}`}
              item={item}
              onOpenTrailer={onOpenTrailer}
            />
          ))}
        </div>
      )}

      {/* Compact Mode */}
      {viewMode === "compact" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {items.map((item, idx) => (
            <MediaCard
              key={`${item.media_type}_${item.id}_${idx}`}
              item={item}
              onOpenTrailer={onOpenTrailer}
            />
          ))}
        </div>
      )}

      {/* List Mode */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const itemTitle = item.title || item.name || "Untitled";
            const year = (item.release_date || item.first_air_date)?.split("-")[0] || "N/A";
            const type = item.media_type || defaultMediaType;
            const poster = item.poster_path
              ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
              : "/placeholder.png";

            return (
              <div
                key={`${item.media_type}_${item.id}_${idx}`}
                onClick={() => {
                  audioFX.playClick();
                  router.push(`/watch/${item.id}?type=${type}`);
                }}
                className="flex items-center gap-3.5 p-2.5 rounded-xl bg-zinc-900/50 border border-white/[0.06] hover:bg-white/[0.04] hover:border-zinc-500 cursor-pointer transition-all group"
              >
                <SmartImage
                  src={poster}
                  alt={itemTitle}
                  fallbackType="poster"
                  containerClassName="h-14 w-10 rounded-lg border border-white/10 shrink-0 bg-zinc-800"
                  className="h-full w-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-bold text-white group-hover:text-white truncate transition-colors">
                      {itemTitle}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">({year})</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                    {item.overview || "No overview available."}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.vote_average ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {Number(item.vote_average).toFixed(1)}
                    </span>
                  ) : null}
                  <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-zinc-950 transition-colors">
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Trigger / Loader / Load More Button */}
      <div ref={loadMoreRef} className="py-8 flex flex-col items-center justify-center gap-3">
        {isLoadingMore ? (
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold bg-zinc-900/80 border border-white/10 px-4 py-2 rounded-xl">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            <span>Fetching next batch of titles...</span>
          </div>
        ) : currentPage < totalPages ? (
          <button
            onClick={() => onLoadMore()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all shadow-sm"
          >
            <span>
              Load More Titles (Page {currentPage} of {totalPages})
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        ) : (
          <div className="text-[11px] text-zinc-600 font-mono">
            End of catalog reached ({items.length} titles)
          </div>
        )}
      </div>
    </>
  );
}
