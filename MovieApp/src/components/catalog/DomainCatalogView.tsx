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
import {
  FilterDropdown,
  OptionItem,
  MultiChip,
  ActivePill,
} from "@/components/catalog/CatalogFilterBar";
import {
  FacebookDateFilter,
  MONTHS,
} from "@/components/common/FacebookDateFilter";
import { CatalogMediaList } from "@/components/catalog/CatalogMediaList";
import type { MediaItem } from "@/types/media";

export type CatalogViewMode = "grid" | "list" | "compact";

export interface DomainCatalogConfig {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  defaultMediaType: "movie" | "tv" | "anime" | "documentary" | "all";
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

  // Initialize from URL params
  useEffect(() => {
    const genreParam = searchParams.get("genre") || searchParams.get("with_genres");
    if (genreParam) setGenres(genreParam.split(",").filter(Boolean));

    const typeParam = searchParams.get("type") || searchParams.get("mediaType");
    if (typeParam) setMediaType(typeParam);

    const yearParam = searchParams.get("year") || searchParams.get("primary_release_year");
    if (yearParam) setSelectedYear(yearParam);

    const monthParam = searchParams.get("month");
    if (monthParam) setSelectedMonth(monthParam);

    const countryParam = searchParams.get("country") || searchParams.get("origin_country");
    if (countryParam) setCountry(countryParam);

    const ratingParam = searchParams.get("rating") || searchParams.get("minRating");
    if (ratingParam) setMinRating(ratingParam);

    const statusParam = searchParams.get("status");
    if (statusParam) setTvStatus(statusParam);

    const sortParam = searchParams.get("sort_by") || searchParams.get("sort");
    if (sortParam) setSortBy(sortParam);
  }, [searchParams]);

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
        if (genres.length > 0) queryParams.set("genre", genres.join(","));
        if (selectedYear) queryParams.set("year", selectedYear);
        if (selectedMonth) queryParams.set("month", selectedMonth);
        if (country && country !== "ALL") queryParams.set("country", country);
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

  const countryLabel = TAXONOMY.regions.find((r) => r.code === country)?.label ?? "All Origins";
  const sortLabel = sortOptions.find((s) => s.id === sortBy)?.label.split("(")[0].trim() ?? sortBy;

  const monthObj = MONTHS.find((m) => m.id === selectedMonth);
  let datePillLabel = "";
  if (selectedYear && selectedMonth && monthObj?.short) {
    datePillLabel = `${monthObj.short} ${selectedYear}`;
  } else if (selectedYear) {
    datePillLabel = selectedYear;
  } else if (selectedMonth && monthObj?.label) {
    datePillLabel = monthObj.label;
  }

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

      {/* ─── Filter Bar Dropdowns ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Media Type Selector */}
          {config.showMediaTypeFilter && (
            <div className="flex items-center rounded-xl bg-[#242526] border border-zinc-700/80 p-0.5 shrink-0">
              {[
                { id: "all", label: "All" },
                { id: "movie", label: "Movies" },
                { id: "tv", label: "Series" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    audioFX.playClick();
                    setMediaType(t.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    mediaType === t.id
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Genre Button */}
          {config.showGenreFilter !== false && (
            <button
              type="button"
              onClick={() => {
                audioFX.playClick();
                setIsGenreOpen(!isGenreOpen);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all border shrink-0 ${
                genres.length > 0 || isGenreOpen
                  ? "bg-white text-zinc-950 border-white shadow-sm font-black"
                  : "bg-[#242526] text-zinc-200 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
              }`}
            >
              <span>Genres {genres.length > 0 ? `(${genres.length})` : ""}</span>
            </button>
          )}

          {/* Facebook-style Date Filter (Year & Month) */}
          {(config.showDateFilter !== false && config.showEraFilter !== false) && (
            <FacebookDateFilter
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onSelectDate={(y, m) => {
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
              onClear={() => {
                setSelectedYear("");
                setSelectedMonth("");
              }}
            />
          )}

          {/* Origin Country */}
          {config.showCountryFilter !== false && (
            <FilterDropdown
              label={`Origin: ${countryLabel}`}
              active={country !== "ALL"}
              onClear={() => setCountry("ALL")}
              width="w-60"
            >
              <div className="py-1 max-h-72 overflow-y-auto scrollbar-none">
                {TAXONOMY.regions.map((r) => (
                  <OptionItem
                    key={r.code}
                    label={`${r.flag} ${r.label}`}
                    active={country === r.code}
                    onClick={() => setCountry(r.code)}
                  />
                ))}
              </div>
            </FilterDropdown>
          )}

          {/* Min Rating */}
          {config.showRatingFilter !== false && (
            <FilterDropdown
              label={minRating ? `Rating: ★ ${minRating}+` : "Min Rating"}
              active={Boolean(minRating)}
              onClear={() => setMinRating("")}
              width="w-48"
            >
              <div className="py-1 max-h-64 overflow-y-auto scrollbar-none">
                {RATING_STEPS.map((r) => (
                  <OptionItem
                    key={r.id}
                    label={r.label}
                    active={minRating === r.id}
                    onClick={() => setMinRating(r.id)}
                  />
                ))}
              </div>
            </FilterDropdown>
          )}

          {/* TV Status */}
          {config.showStatusFilter && (
            <FilterDropdown
              label={tvStatus ? `Status: ${tvStatus}` : "Series Status"}
              active={Boolean(tvStatus)}
              onClear={() => setTvStatus("")}
              width="w-52"
            >
              <div className="py-1">
                {STATUS_OPTIONS.map((s) => (
                  <OptionItem
                    key={s.id}
                    label={s.label}
                    active={tvStatus === s.id}
                    onClick={() => setTvStatus(s.id)}
                  />
                ))}
              </div>
            </FilterDropdown>
          )}

          {/* Sort By Dropdown */}
          <FilterDropdown
            label={`Sort: ${sortLabel}`}
            active={sortBy !== "popularity.desc"}
            onClear={() => setSortBy("popularity.desc")}
            width="w-60"
          >
            <div className="py-1">
              {sortOptions.map((s) => (
                <OptionItem
                  key={s.id}
                  label={s.label}
                  active={sortBy === s.id}
                  onClick={() => setSortBy(s.id)}
                />
              ))}
            </div>
          </FilterDropdown>

          {/* Reset Filters */}
          {activeCount > 0 && (
            <button
              onClick={() => {
                audioFX.playPop();
                handleReset();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-400/20 bg-rose-400/5 px-3 py-2 text-[11px] font-bold text-rose-400 hover:bg-rose-400/10 transition-all shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset ({activeCount})
            </button>
          )}
        </div>

        {/* Full-Width Genre Filter Panel */}
        {isGenreOpen && (
          <div className="w-full rounded-2xl border border-zinc-700/80 bg-[#18191a] p-4 sm:p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Select Genres &amp; Themes
                </span>
                {genres.length > 0 ? (
                  <span className="rounded-lg bg-white/10 border border-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white font-mono">
                    {genres.length} Selected
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-400 font-medium">
                    All Genres Shown ({ALL_GENRES_ORDERED.length})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {genres.length > 0 && (
                  <button
                    onClick={() => {
                      audioFX.playPop();
                      setGenres([]);
                    }}
                    className="text-xs text-[#E50914] hover:underline font-bold px-2 py-1 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => {
                    audioFX.playClick();
                    setIsGenreOpen(false);
                  }}
                  className="rounded-xl bg-white px-3.5 py-1 text-xs font-bold text-zinc-950 shadow-sm hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {ALL_GENRES_ORDERED.map((g) => (
                <MultiChip
                  key={g.id}
                  label={g.name}
                  active={genres.includes(String(g.id))}
                  onClick={() => toggleGenre(String(g.id))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Filter Pills Row */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center pt-1">
            {genres.map((gId) => {
              const name = getGenreName(gId);
              return <ActivePill key={gId} label={name} onRemove={() => toggleGenre(gId)} />;
            })}
            {(selectedYear || selectedMonth) && (
              <ActivePill
                label={`Date: ${datePillLabel}`}
                onRemove={() => {
                  setSelectedYear("");
                  setSelectedMonth("");
                }}
              />
            )}
            {country !== "ALL" && (
              <ActivePill
                label={`${TAXONOMY.regions.find((r) => r.code === country)?.flag ?? ""} ${
                  TAXONOMY.regions.find((r) => r.code === country)?.label ?? country
                }`}
                onRemove={() => setCountry("ALL")}
              />
            )}
            {minRating && (
              <ActivePill label={`Rating ≥ ${minRating}`} onRemove={() => setMinRating("")} />
            )}
            {sortBy !== "popularity.desc" && (
              <ActivePill
                label={`Sort: ${sortOptions.find((s) => s.id === sortBy)?.label.split("(")[0].trim() ?? sortBy}`}
                onRemove={() => setSortBy("popularity.desc")}
              />
            )}
            {tvStatus && <ActivePill label={tvStatus} onRemove={() => setTvStatus("")} />}
            <button
              onClick={() => {
                audioFX.playPop();
                handleReset();
              }}
              className="text-[10px] text-zinc-500 hover:text-rose-400 font-semibold ml-1 transition-colors cursor-pointer"
            >
              Clear All ×
            </button>
          </div>
        )}
      </div>

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
