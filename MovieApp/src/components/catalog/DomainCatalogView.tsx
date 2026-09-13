"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  RotateCcw,
  LayoutGrid,
  List,
  Grid2X2,
} from "lucide-react";
import { useAppModals } from "@/components/layout/AppShell";
import { TAXONOMY, ALL_GENRES_ORDERED, getGenreName } from "@/lib/constants/taxonomy";
import { audioFX } from "@/lib/audio/audio-fx";
import { DiscoverFilterBar } from "@/components/discover/DiscoverFilterBar";
import { CatalogMediaList } from "@/components/catalog/CatalogMediaList";
import type { MediaItem } from "@/types/media";

export type CatalogViewMode = "grid" | "list" | "compact";

export interface DomainCatalogConfig {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  defaultMediaType: "movie" | "tv" | "anime" | "documentary" | "all" | string;
  forcedGenre?: string;
  forcedCountry?: string;
  showMediaTypeFilter?: boolean;
  showGenreFilter?: boolean;
  showEraFilter?: boolean;
  showDateFilter?: boolean;
  showCountryFilter?: boolean;
  showRatingFilter?: boolean;
  showStatusFilter?: boolean;
  isAnimeDomain?: boolean;
  customSortOptions?: Array<{ id: string; label: string }>;
}

const DEFAULT_SORTS = [
  { id: "popularity.desc", label: "Popularity (High → Low)" },
  { id: "vote_average.desc", label: "Rating (Highest First)" },
  { id: "primary_release_date.desc", label: "Date: Newest First" },
  { id: "primary_release_date.asc", label: "Date: Oldest First" },
  { id: "title.asc", label: "Title: A → Z" },
  { id: "vote_count.desc", label: "Most Votes" },
];

const RATING_STEPS = [
  { id: "", label: "Any Rating" },
  ...Array.from({ length: 19 }, (_, i) => {
    const val = (1 + i * 0.5).toFixed(1);
    return { id: val, label: `${val} and above` };
  }),
];

const STATUS_OPTIONS = [
  { id: "", label: "Any Status" },
  { id: "Returning Series", label: "Returning Series" },
  { id: "Ended", label: "Ended" },
  { id: "In Production", label: "In Production" },
  { id: "Canceled", label: "Canceled" },
];

export function DomainCatalogView({ config }: { config: DomainCatalogConfig }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openTrailer } = useAppModals();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [genres, setGenres] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<string>(config.defaultMediaType);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [country, setCountry] = useState<string>("ALL");
  const [minRating, setMinRating] = useState<string>("");
  const [tvStatus, setTvStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popularity.desc");
  const [viewMode, setViewMode] = useState<CatalogViewMode>("grid");
  const [isGenreOpen, setIsGenreOpen] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const sortOptions = config.customSortOptions || DEFAULT_SORTS;

  // Sync state from URL on every searchParams change.
  //
  // BUG FIX (2026-08-27): previously each setter was guarded with `if (param)`,
  // so navigating `/trending?media_type=tv` → `/trending` left `mediaType`
  // stuck on `tv`. Always call setters so absent params reset to defaults.
  // Also accept `media_type` alias — Home/Shows shelves link with that key
  // (see src/app/(platform)/home/page.tsx and shows/page.tsx endpoints).
  useEffect(() => {
    const genreParam = searchParams.get("genre") || searchParams.get("with_genres") || "";
    setGenres(genreParam ? genreParam.split(",").filter(Boolean) : []);

    setMediaType(
      searchParams.get("type") ||
        searchParams.get("mediaType") ||
        searchParams.get("media_type") ||
        config.defaultMediaType
    );

    setSelectedYear(
      searchParams.get("year") || searchParams.get("primary_release_year") || ""
    );

    setSelectedMonth(searchParams.get("month") || "");

    setCountry(
      searchParams.get("country") || searchParams.get("origin_country") || "ALL"
    );

    setMinRating(searchParams.get("rating") || searchParams.get("minRating") || "");

    setTvStatus(searchParams.get("status") || "");

    setSortBy(
      searchParams.get("sort_by") || searchParams.get("sort") || "popularity.desc"
    );
  }, [searchParams, config.defaultMediaType]);

  // Fetch catalog data
  const fetchCatalog = useCallback(
    async (page: number, append = false) => {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("page", String(page));
        queryParams.set("sort_by", sortBy);

        if (mediaType && mediaType !== "all") queryParams.set("type", mediaType);

        if (config.forcedGenre) {
          const combined = Array.from(new Set([config.forcedGenre, ...genres])).join(",");
          queryParams.set("genre", combined);
        } else if (genres.length > 0) {
          queryParams.set("genre", genres.join(","));
        }

        if (selectedYear) queryParams.set("year", selectedYear);
        if (selectedMonth) queryParams.set("month", selectedMonth);

        if (country && country !== "ALL") {
          queryParams.set("country", country);
        } else if (config.forcedCountry) {
          queryParams.set("country", config.forcedCountry);
        }

        if (minRating) queryParams.set("rating", minRating);
        if (tvStatus) queryParams.set("status", tvStatus);

        const res = await fetch(`/api/catalog/discover?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (append) {
            setItems((prev) => [...prev, ...(data.results || [])]);
          } else {
            setItems(data.results || []);
          }
          setTotalPages(data.total_pages || 1);
          setTotalResults(data.total_results || 0);
          setCurrentPage(page);
        }
      } catch (e) {
        console.error("Failed to fetch catalog", e);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [sortBy, mediaType, genres, selectedYear, selectedMonth, country, minRating, tvStatus]
  );

  // Reload when filters change
  useEffect(() => {
    fetchCatalog(1, false);
  }, [fetchCatalog]);

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchCatalog(currentPage + 1, true);
    }
  };

  // Intersection observer for auto-scroll loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !isLoadingMore && currentPage < totalPages) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, isLoadingMore, currentPage, totalPages]);

  const toggleGenre = (genreId: string) => {
    audioFX.playClick();
    setGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };

  const handleReset = () => {
    setGenres([]);
    setSelectedYear("");
    setSelectedMonth("");
    setCountry("ALL");
    setMinRating("");
    setTvStatus("");
    setSortBy("popularity.desc");
    setMediaType(config.defaultMediaType);
  };

  const activeCount =
    genres.length +
    (selectedYear || selectedMonth ? 1 : 0) +
    (country !== "ALL" ? 1 : 0) +
    (minRating ? 1 : 0) +
    (tvStatus ? 1 : 0) +
    (sortBy !== "popularity.desc" ? 1 : 0);

  const Icon = config.icon;

  return (
    <div className="space-y-6 pt-2 pb-24 animate-in fade-in">
      {/* ─── Domain Header Hero ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#242526] border border-zinc-700/80 text-white shadow-sm shrink-0">
            <Icon className="h-5 w-5 text-[#E50914]" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-black text-white tracking-tight">
              {config.title}
            </h1>
            <p className="text-xs text-zinc-400 font-medium">{config.subtitle}</p>
          </div>
        </div>

        {/* View Mode & Total Count */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <span className="text-xs font-mono text-zinc-400">
            {totalResults.toLocaleString()} Titles
          </span>

          <div className="flex items-center rounded-xl bg-[#242526] border border-zinc-700/80 p-0.5">
            <button
              onClick={() => {
                audioFX.playClick();
                setViewMode("grid");
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Standard Poster Grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                audioFX.playClick();
                setViewMode("compact");
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "compact"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Dense Compact Grid"
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                audioFX.playClick();
                setViewMode("list");
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Detailed List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Unified Responsive Filter Bar (Identical to Explore) ─── */}
      <DiscoverFilterBar
        mediaType={mediaType}
        setMediaType={setMediaType}
        genres={genres}
        setGenres={setGenres}
        toggleGenre={toggleGenre}
        isGenreOpen={isGenreOpen}
        setIsGenreOpen={setIsGenreOpen}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        country={country}
        setCountry={setCountry}
        minRating={minRating}
        setMinRating={setMinRating}
        tvStatus={tvStatus}
        setTvStatus={setTvStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        activeCount={activeCount}
        handleReset={handleReset}
        resultCount={totalResults > 0 ? totalResults : null}
        showMediaTypeFilter={config.showMediaTypeFilter}
        showCountryFilter={config.showCountryFilter}
        showRatingFilter={config.showRatingFilter}
        showStatusFilter={config.showStatusFilter}
        showDateFilter={config.showDateFilter}
        customSortOptions={config.customSortOptions || sortOptions}
      />

      {/* ─── Media Results List ─── */}
      <CatalogMediaList
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        items={items}
        viewMode={viewMode}
        title={config.title}
        defaultMediaType={config.defaultMediaType}
        currentPage={currentPage}
        totalPages={totalPages}
        loadMoreRef={loadMoreRef}
        onReset={handleReset}
        onLoadMore={handleLoadMore}
        onOpenTrailer={(id, type, title, year) =>
          openTrailer(id, type || "movie", title || "", year || "")
        }
      />
    </div>
  );
}
