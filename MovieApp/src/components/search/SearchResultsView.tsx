"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  User,
  Star,
  Layers,
  Building2,
  Info,
  Loader2,
  ChevronDown,
  Play,
  Sparkles,
} from "lucide-react";
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

  const tabCounts = data?.tabCounts || {
    all: 0,
    movie: 0,
    tv: 0,
    anime: 0,
    person: 0,
    collection: 0,
    company: 0,
  };
  const people = data?.people || [];
  const collections = data?.collections || [];
  const companies = data?.companies || [];
  const isSearchMode = Boolean(query && query.trim().length > 0);

  const tabs = [
    { id: "all", label: "All", count: tabCounts.all },
    { id: "movie", label: "Movies", count: tabCounts.movie },
    { id: "tv", label: "TV Series", count: tabCounts.tv },
    { id: "anime", label: "Anime", count: tabCounts.anime },
    ...(isSearchMode
      ? [
          { id: "company", label: "Studios & Brands", count: tabCounts.company || companies.length },
          { id: "person", label: "People", count: tabCounts.person },
          { id: "collection", label: "Collections", count: tabCounts.collection },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 select-none">
      {/* ─── Search Query Heading ─── */}
      {isSearchMode && (
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
            Search results for &quot;<span className="text-[#E50914]">{query}</span>&quot;
          </h1>
        </div>
      )}

      {/* ─── Search Header: Result Tabs & Layout Toggle ─── */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 w-full">
        {/* Category Tabs */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none scroll-smooth">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  onTabChange(tab.id);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-white text-zinc-950 shadow-md"
                    : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10"
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

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              setViewMode("grid");
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "grid" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              setViewMode("list");
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "list" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
            title="List View"
          >
            <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* ─── 0 Results Banner ─── */}
      {!isLoading && items.length === 0 && people.length === 0 && collections.length === 0 && companies.length === 0 && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center space-y-4">
          <Info className="h-10 w-10 text-zinc-500 mx-auto" />
          <div>
            <h3 className="font-heading text-base font-bold text-white">
              {isSearchMode ? `No results found for "${query}"` : "No titles match your active filters"}
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Try searching by movie title, series, anime, brand studio (e.g. Marvel, A24, Ghibli), or actor.
            </p>
          </div>
        </div>
      )}

      {/* ─── Studios & Brand Results ─── */}
      {(activeTab === "all" || activeTab === "company") && companies.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Building2 className="h-3.5 w-3.5 text-[#E50914]" /> Studios &amp; Production Brands
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/discover?company=${c.id}`}
                onClick={() => audioFX.playClick()}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#E50914] hover:bg-white/10 transition-all group shadow-sm"
              >
                <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center p-1.5 shrink-0">
                  {c.logo_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${TMDB_IMAGE_CONFIG.POSTER_BASE}${c.logo_path}`}
                      alt={c.name}
                      className="max-h-full max-w-full object-contain filter invert opacity-85 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-heading text-xs font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                    {c.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {c.origin_country || "Studio"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── People Results (Actors & Creators) ─── */}
      {(activeTab === "all" || activeTab === "person") && people.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <User className="h-3.5 w-3.5 text-[#E50914]" /> Actors &amp; Creators
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {(activeTab === "all" ? people.slice(0, 6) : people).map((p) => {
              const initials = p.name
                ? p.name
                    .trim()
                    .split(/\s+/)
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "??";

              return (
                <Link
                  key={p.id}
                  href={`/person/${p.id}`}
                  onClick={() => audioFX.playClick()}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#E50914] hover:bg-white/10 transition-all group block shadow-sm"
                >
                  {p.profile_path ? (
                    <SmartImage
                      src={`${TMDB_IMAGE_CONFIG.PROFILE_BASE}${p.profile_path}`}
                      alt={p.name}
                      fallbackType="avatar"
                      containerClassName="h-11 w-11 rounded-lg overflow-hidden border border-white/15 bg-zinc-900 shrink-0 group-hover:scale-105 transition-transform"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-lg bg-zinc-900 border border-white/15 flex items-center justify-center shrink-0">
                      <span className="font-mono text-xs font-bold text-zinc-300">{initials}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-heading text-xs font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 capitalize truncate">
                      {p.known_for_department || "Actor / Creator"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Media Results: 16:9 LANDSCAPE BACKDROP GRID ─── */}
      {viewMode === "grid" && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item, idx) => {
            const itemType = item.media_type || (item.title ? "movie" : "tv");
            const title = item.title || item.name || "Untitled";
            const year = formatYear(item.release_date || item.first_air_date) || "2025";
            const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : null;

            const imgPath = item.backdrop_path || item.poster_path;
            const thumbUrl = imgPath
              ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`
              : TMDB_IMAGE_CONFIG.FALLBACK_BACKDROP;

            return (
              <Link
                key={`${itemType}_${item.id}_${idx}`}
                href={`/watch/${item.id}?type=${itemType}`}
                onClick={() => audioFX.playClick()}
                className="group relative block rounded-lg overflow-hidden transition-all duration-200 cursor-pointer"
              >
                {/* 16:9 Backdrop Thumbnail (Image scales, container doesn't) */}
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-[#E50914] transition-colors">
                  <SmartImage
                    src={thumbUrl}
                    alt={title}
                    fallbackType="backdrop"
                    containerClassName="h-full w-full"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="h-10 w-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Card Title & Info Below Image */}
                <div className="pt-2 px-1 space-y-0.5">
                  <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                    {title}
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
                    <span className="font-mono">{year}</span>
                    <span>·</span>
                    <span className="capitalize">{itemType === "tv" ? "TV Show" : "Movie"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ─── Media Results: LIST VIEW ─── */}
      {viewMode === "list" && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((item, idx) => {
            const itemType = item.media_type || (item.title ? "movie" : "tv");
            const title = item.title || item.name || "Untitled";
            const year = formatYear(item.release_date || item.first_air_date);
            const poster = item.poster_path
              ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.poster_path.startsWith("/") ? "" : "/"}${item.poster_path}`
              : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;

            return (
              <Link
                key={`${itemType}_${item.id}_${idx}`}
                href={`/watch/${item.id}?type=${itemType}`}
                onClick={() => audioFX.playClick()}
                className="flex items-start gap-4 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#E50914] transition-all group"
              >
                <SmartImage
                  src={poster}
                  alt={title}
                  fallbackType="poster"
                  containerClassName="w-16 sm:w-20 aspect-[2/3] rounded-lg bg-zinc-950 border border-white/10 shrink-0"
                  className="h-full w-full object-cover"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-zinc-200 transition-colors truncate">
                      {title}
                    </h3>
                    <span className="rounded bg-white/10 border border-white/10 px-1.5 py-0.2 text-[10px] font-bold text-white uppercase">
                      {itemType}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{year}</span>
                    {item.vote_average && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                        <Star className="h-3 w-3 fill-current" /> {item.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.overview || "No synopsis available."}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ─── No More Results Indicator ─── */}
      {items.length > 0 && !hasMore && (
        <div className="py-10 text-center text-xs font-medium text-zinc-500 font-mono">
          No more results
        </div>
      )}

      {/* ─── Infinite Scroll Trigger & Load More ─── */}
      {items.length > 0 && hasMore && (
        <div ref={loadMoreRef} className="pt-6 pb-8 text-center">
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              onLoadMore();
            }}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Loading more titles...</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Load More Titles</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
