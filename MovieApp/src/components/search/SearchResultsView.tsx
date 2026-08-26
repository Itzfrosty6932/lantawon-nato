"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  AlignJustify,
  Sparkles,
  User,
  Film,
  Tv,
  Star,
  Layers,
  ArrowRight,
  Info,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { MediaCard } from "@/components/movie/MediaCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { formatYear } from "@/lib/utils/formatters";
import { audioFX } from "@/lib/audio/audio-fx";
import type {
  UnifiedSearchResponse,
  SearchLayoutViewMode,
  SmartRelaxationSuggestion,
} from "@/features/search/engine/types";
import type { MediaItem } from "@/types/media";

interface SearchResultsViewProps {
  data: UnifiedSearchResponse | null;
  items: MediaItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  activeTab: string;
  query: string;
  onTabChange: (tab: string) => void;
  onLoadMore: () => void;
  onOpenTrailer?: (id: number | string, type: string, title: string, year: string) => void;
  onApplyRelaxation?: (suggestion: SmartRelaxationSuggestion) => void;
  onSearchOverride?: (query: string) => void;
}

export function SearchResultsView({
  data,
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  activeTab,
  query,
  onTabChange,
  onLoadMore,
  onOpenTrailer,
  onApplyRelaxation,
  onSearchOverride,
}: SearchResultsViewProps) {
  const [viewMode, setViewMode] = useState<SearchLayoutViewMode>("grid");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.removeItem("cinemind_search_view_mode");
      const stored = localStorage.getItem("lantawon_search_view_mode");
      if (stored === "list") {
        setViewMode("list");
      } else {
        setViewMode("grid");
        localStorage.setItem("lantawon_search_view_mode", "grid");
      }
    } catch {}
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  const handleViewModeChange = (mode: SearchLayoutViewMode) => {
    audioFX.playClick();
    setViewMode(mode);
    try {
      localStorage.setItem("lantawon_search_view_mode", mode);
    } catch {}
  };

  const tabCounts = data?.tabCounts || { all: 0, movie: 0, tv: 0, anime: 0, person: 0, collection: 0 };
  const ast = data?.ast;
  const people = data?.people || [];
  const collections = data?.collections || [];

  const isSearchMode = Boolean(query && query.trim().length > 0);

  const tabs = [
    { id: "all", label: "All Results", count: tabCounts.all },
    { id: "movie", label: "Movies", count: tabCounts.movie },
    { id: "tv", label: "TV Series", count: tabCounts.tv },
    { id: "anime", label: "Anime", count: tabCounts.anime },
    ...(isSearchMode ? [
      { id: "person", label: "People", count: tabCounts.person },
      { id: "collection", label: "Collections", count: tabCounts.collection },
    ] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Search Header: Result Tabs & Layout Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  audioFX.playClick();
                  onTabChange(tab.id);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-white text-zinc-950 shadow-md"
                    : "bg-[#242526] text-zinc-300 hover:text-white hover:bg-[#3a3b3c] border border-zinc-700/80"
                }`}
              >
                <span>{tab.label}</span>
                {isSearchMode && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      isActive ? "bg-black/15 text-zinc-950 font-extrabold" : "bg-white/10 text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle (Grid & List) */}
        <div className="flex items-center gap-1 bg-[#18191a] p-1 rounded-xl border border-zinc-800 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => handleViewModeChange("grid")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "grid" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleViewModeChange("list")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "list" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Did You Mean Typo Suggestion */}
      {data?.didYouMean && onSearchOverride && (
        <div className="rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 p-3 text-xs flex items-center justify-between gap-3">
          <div className="text-zinc-300">
            Showing results for <strong className="text-[#E50914] font-bold">&quot;{data.didYouMean.suggested}&quot;</strong>
          </div>
          <button
            onClick={() => onSearchOverride(data.didYouMean!.original)}
            className="text-[11px] text-zinc-400 hover:text-white underline shrink-0"
          >
            Search instead for &quot;{data.didYouMean.original}&quot;
          </button>
        </div>
      )}

      {/* Query Understanding / AST Interpretation Box */}
      {isSearchMode && ast && ast.explanation.length > 0 && (
        <div className="rounded-xl ui-surface p-3 border border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#E50914] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-[#E50914]" /> Query Understanding:
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ast.explanation.map((item, idx) => (
              <span
                key={idx}
                className="rounded bg-zinc-900 border border-white/10 px-2 py-0.5 text-[11px] text-zinc-300 font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 0 Results / Smart Relaxation Banner */}
      {!isLoading && items.length === 0 && people.length === 0 && collections.length === 0 && (
        <div className="rounded-xl ui-surface p-8 text-center space-y-4">
          <Info className="h-10 w-10 text-zinc-500 mx-auto" />
          <div>
            <h3 className="font-heading text-base font-bold text-white">
              {isSearchMode ? `No results found for "${query}"` : "No titles match your active filters"}
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Try adjusting your search query, clearing specific genre tags, or lowering your minimum rating filter.
            </p>
          </div>

          {/* Smart Relaxation Buttons */}
          {data?.relaxation && data.relaxation.length > 0 && onApplyRelaxation && (
            <div className="pt-2 space-y-2 max-w-md mx-auto">
              <div className="text-xs font-bold text-[#E50914]">Smart Suggestions:</div>
              <div className="flex flex-col gap-1.5">
                {data.relaxation.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      audioFX.playClick();
                      onApplyRelaxation(suggestion);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[#E50914]/30 bg-[#E50914]/10 hover:bg-[#E50914]/20 text-xs font-bold text-[#ff5247] transition-all text-left"
                  >
                    <span>{suggestion.label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* People Results Shelf (When in All or Person Tab) */}
      {(activeTab === "all" || activeTab === "person") && people.length > 0 && (
        <div className="rounded-xl ui-surface p-4 space-y-3">
          <div className="font-heading text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <User className="h-3.5 w-3.5 text-[#E50914]" /> Actors &amp; Creators
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(activeTab === "all" ? people.slice(0, 4) : people).map((p) => (
              <Link
                key={p.id}
                href={`/person/${p.id}`}
                onClick={() => audioFX.playClick()}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#18191a] border border-white/[0.08] hover:border-[#E50914]/50 hover:bg-[#242526] transition-all group block shadow-sm"
              >
                <SmartImage
                  src={
                    p.profile_path
                      ? `${TMDB_IMAGE_CONFIG.PROFILE_BASE}${p.profile_path}`
                      : TMDB_IMAGE_CONFIG.FALLBACK_AVATAR
                  }
                  alt={p.name}
                  fallbackType="avatar"
                  containerClassName="h-11 w-11 rounded-full overflow-hidden border border-white/15 bg-zinc-900 shrink-0 group-hover:scale-105 transition-transform"
                  className="h-full w-full object-cover rounded-full"
                />
                <div className="min-w-0">
                  <div className="font-heading text-xs font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 capitalize truncate">
                    {p.known_for_department || "Actor / Creator"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Collections Results Shelf (When in All or Collection Tab) */}
      {(activeTab === "all" || activeTab === "collection") && collections.length > 0 && (
        <div className="rounded-xl ui-surface p-4 space-y-3">
          <div className="font-heading text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-[#ff3b30]" /> Franchises &amp; Collections
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(activeTab === "all" ? collections.slice(0, 4) : collections).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#18191a] border border-white/[0.08]"
              >
                <SmartImage
                  src={
                    c.poster_path
                      ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${c.poster_path}`
                      : TMDB_IMAGE_CONFIG.FALLBACK_POSTER
                  }
                  alt={c.name}
                  fallbackType="poster"
                  containerClassName="h-12 w-9 rounded-md border border-white/10 shrink-0 bg-zinc-900"
                  className="h-full w-full object-cover"
                />
                <div className="min-w-0">
                  <div className="font-heading text-xs font-bold text-white truncate">{c.name}</div>
                  <div className="text-[10px] text-zinc-400">Franchise Collection</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Results: GRID VIEW */}
      {viewMode === "grid" && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((item, idx) => (
            <MediaCard
              key={`${item.media_type || (item.title ? "movie" : "tv")}_${item.id}_${idx}`}
              item={item}
              onOpenTrailer={onOpenTrailer}
            />
          ))}
        </div>
      )}

      {/* Media Results: LIST VIEW */}
      {viewMode === "list" && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((item, idx) => {
            const itemType = item.media_type || (item.title ? "movie" : "tv");
            const year = formatYear(item.release_date || item.first_air_date);
            const poster = item.poster_path
              ? item.poster_path.startsWith("http")
                ? item.poster_path
                : `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.poster_path.startsWith("/") ? "" : "/"}${item.poster_path}`
              : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;


            return (
              <Link
                key={`${itemType}_${item.id}_${idx}`}
                href={`/watch/${item.id}?type=${itemType}`}
                onClick={() => audioFX.playClick()}
                className="flex items-start gap-4 p-3.5 rounded-xl ui-card border border-white/[0.08] hover:border-[#E50914]/40 transition-all group"
              >
                <SmartImage
                  src={poster}
                  alt={item.title || item.name || ""}
                  fallbackType="poster"
                  containerClassName="w-16 sm:w-20 aspect-[2/3] rounded-lg bg-zinc-950 border border-white/10 shrink-0"
                  className="h-full w-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-sm font-bold text-white group-hover:text-[#E50914] transition-colors truncate">
                      {item.title || item.name}
                    </h3>
                    <span className="rounded bg-[#E50914]/15 border border-[#E50914]/30 px-1.5 py-0.2 text-[10px] font-bold text-[#E50914] uppercase">
                      {itemType}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{year}</span>
                    {item.vote_average && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Star className="h-3 w-3 fill-current" /> {item.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {item.overview || "No synopsis available."}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Trigger & Load More */}
      {items.length > 0 && hasMore && (
        <div ref={loadMoreRef} className="pt-6 pb-8 text-center">
          <button
            onClick={() => {
              audioFX.playClick();
              onLoadMore();
            }}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 hover:border-[#E50914]/40 transition-all disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#E50914]" />
                <span>Loading more titles...</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 text-[#E50914]" />
                <span>Load More Titles</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
