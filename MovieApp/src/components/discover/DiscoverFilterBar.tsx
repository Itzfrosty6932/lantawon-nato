"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  X,
  RotateCcw,
  Film,
  Tv,
  Clapperboard,
  Smile,
  BookOpen,
  SlidersHorizontal,
} from "lucide-react";
import {
  FilterDropdown,
  OptionItem,
  MultiChip,
} from "@/components/catalog/CatalogFilterBar";
import {
  FacebookDateFilter,
} from "@/components/common/FacebookDateFilter";
import { TAXONOMY, ALL_GENRES_ORDERED, getGenreName } from "@/lib/constants/taxonomy";
import { audioFX } from "@/lib/audio/audio-fx";

export const SORT_OPTIONS = [
  { id: "best_match", label: "Best Match" },
  { id: "popularity.desc", label: "Popularity (High → Low)" },
  { id: "popularity.asc", label: "Popularity (Low → High)" },
  { id: "vote_average.desc", label: "Rating (High → Low)" },
  { id: "vote_average.asc", label: "Rating (Low → High)" },
  { id: "primary_release_date.desc", label: "Date: Newest First" },
  { id: "primary_release_date.asc", label: "Date: Oldest First" },
  { id: "title.asc", label: "Title: A → Z" },
  { id: "title.desc", label: "Title: Z → A" },
  { id: "revenue.desc", label: "Revenue (Highest)" },
  { id: "vote_count.desc", label: "Most Votes" },
];

export const RATING_OPTIONS = [
  { id: "", label: "Any Rating" },
  ...Array.from({ length: 19 }, (_, i) => {
    const val = (1 + i * 0.5).toFixed(1);
    return { id: val, label: `${val} and above` };
  }),
];

export const MEDIA_TYPES = [
  { id: "all", label: "All", icon: SlidersHorizontal },
  { id: "movie", label: "Movies", icon: Film },
  { id: "tv", label: "Series", icon: Tv },
  { id: "anime", label: "Anime", icon: Clapperboard },
  { id: "animation", label: "Cartoons", icon: Smile },
  { id: "documentary", label: "Docs", icon: BookOpen },
];

export const TV_STATUS = [
  { id: "", label: "Any Status" },
  { id: "Returning Series", label: "Returning Series" },
  { id: "Ended", label: "Ended" },
  { id: "In Production", label: "In Production" },
  { id: "Canceled", label: "Canceled" },
];

type ActiveDropdownType = "media" | "genre" | "date" | "rating" | "country" | "sort" | "status" | null;

interface DiscoverFilterBarProps {
  query?: string;
  setQuery?: (q: string) => void;
  mediaType: string;
  setMediaType: (m: string) => void;
  genres: string[];
  setGenres: (g: string[]) => void;
  toggleGenre: (gId: string) => void;
  isGenreOpen: boolean;
  setIsGenreOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  country: string;
  setCountry: (c: string) => void;
  minRating: string;
  setMinRating: (r: string) => void;
  tvStatus: string;
  setTvStatus: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  activeCount: number;
  handleReset: () => void;
  resultCount?: number | null;
  showMediaTypeFilter?: boolean;
  showCountryFilter?: boolean;
  showRatingFilter?: boolean;
  showStatusFilter?: boolean;
  showDateFilter?: boolean;
  customSortOptions?: Array<{ id: string; label: string }>;
}

export function DiscoverFilterBar({
  query,
  setQuery,
  mediaType,
  setMediaType,
  genres,
  setGenres,
  toggleGenre,
  isGenreOpen,
  setIsGenreOpen,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  country,
  setCountry,
  minRating,
  setMinRating,
  tvStatus,
  setTvStatus,
  sortBy,
  setSortBy,
  activeCount,
  handleReset,
  resultCount = null,
  showMediaTypeFilter = true,
  showCountryFilter = true,
  showRatingFilter = true,
  showStatusFilter = true,
  showDateFilter = true,
  customSortOptions,
}: DiscoverFilterBarProps) {
  // Single active dropdown manager to prevent visual collisions/overlaps
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdownType>(null);

  // Sync isGenreOpen with activeDropdown
  useEffect(() => {
    if (isGenreOpen && activeDropdown !== "genre") {
      setActiveDropdown("genre");
    } else if (!isGenreOpen && activeDropdown === "genre") {
      setActiveDropdown(null);
    }
  }, [isGenreOpen]);

  const handleToggleDropdown = (name: ActiveDropdownType, open: boolean) => {
    if (open) {
      setActiveDropdown(name);
      setIsGenreOpen(name === "genre");
    } else {
      if (activeDropdown === name) {
        setActiveDropdown(null);
        if (name === "genre") setIsGenreOpen(false);
      }
    }
  };

  const activeSortList = customSortOptions || SORT_OPTIONS;
  const mediaLabel = MEDIA_TYPES.find((m) => m.id === mediaType)?.label ?? "Media Type";
  const countryLabel = TAXONOMY.regions.find((r) => r.code === country)?.flag
    ? `${TAXONOMY.regions.find((r) => r.code === country)?.flag} ${TAXONOMY.regions.find((r) => r.code === country)?.label}`
    : "Origin";
  const ratingLabel = minRating ? `★ ${minRating}+` : "Min Rating";
  const sortLabel = activeSortList.find((s) => s.id === sortBy)?.label ?? "Sort";
  const statusLabel = tvStatus || "Series Status";
  const genreLabel =
    genres.length === 0
      ? "Genres"
      : genres.length === 1
      ? getGenreName(genres[0])
      : `${getGenreName(genres[0])} +${genres.length - 1}`;

  return (
    <div className="space-y-3 w-full select-none relative z-30">
      {/* ─── Responsive Filter Chips Row (Tablet, Mobile & 320px Safe) ─── */}
      <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 w-full relative ${activeDropdown ? "z-50" : "z-20"}`}>
        {/* 1. Media Type */}
        {showMediaTypeFilter && (
          <FilterDropdown
            label={mediaLabel}
            active={mediaType !== "all"}
            onClear={() => setMediaType("all")}
            width="w-44"
            isOpen={activeDropdown === "media"}
            onToggle={(open) => handleToggleDropdown("media", open)}
          >
            <div className="py-1">
              {MEDIA_TYPES.map(({ id, label }) => (
                <OptionItem
                  key={id}
                  label={label}
                  active={mediaType === id}
                  onClick={() => {
                    setMediaType(id);
                    handleToggleDropdown("media", false);
                  }}
                />
              ))}
            </div>
          </FilterDropdown>
        )}

        {/* 2. Genre Toggle Button */}
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            const nextOpen = activeDropdown !== "genre";
            handleToggleDropdown("genre", nextOpen);
          }}
          className={`flex items-center gap-1.5 rounded-full border px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
            genres.length > 0
              ? "bg-white text-zinc-950 border-white shadow-sm"
              : activeDropdown === "genre"
              ? "bg-[#3a3b3c] text-white border-zinc-500"
              : "bg-[#1c1d22] text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
          }`}
        >
          <span className="truncate max-w-[130px] sm:max-w-none">{genreLabel}</span>
          <ChevronDown
            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200 shrink-0 ${
              activeDropdown === "genre" ? "rotate-180" : ""
            }`}
          />
          {genres.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                audioFX.playPop();
                setGenres([]);
              }}
              className="ml-0.5 flex items-center justify-center h-3.5 w-3.5 rounded-full bg-black/20 hover:bg-black/40 text-zinc-900 cursor-pointer shrink-0"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          )}
        </button>

        {/* 3. Facebook-style Date Filter (Year & Month) */}
        {showDateFilter && (
          <FacebookDateFilter
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            isOpen={activeDropdown === "date"}
            onToggle={(open) => handleToggleDropdown("date", open)}
            onSelectDate={(y, m) => {
              setSelectedYear(y);
              setSelectedMonth(m);
              handleToggleDropdown("date", false);
            }}
            onClear={() => {
              setSelectedYear("");
              setSelectedMonth("");
              handleToggleDropdown("date", false);
            }}
          />
        )}

        {/* 4. Rating */}
        {showRatingFilter && (
          <FilterDropdown
            label={ratingLabel}
            active={Boolean(minRating)}
            onClear={() => setMinRating("")}
            width="w-48 sm:w-52"
            isOpen={activeDropdown === "rating"}
            onToggle={(open) => handleToggleDropdown("rating", open)}
          >
            <div className="py-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
              {RATING_OPTIONS.map((r) => (
                <OptionItem
                  key={r.id}
                  label={r.label}
                  active={minRating === r.id}
                  onClick={() => {
                    setMinRating(r.id);
                    handleToggleDropdown("rating", false);
                  }}
                />
              ))}
            </div>
          </FilterDropdown>
        )}

        {/* 5. Origin Country */}
        {showCountryFilter && (
          <FilterDropdown
            label={countryLabel}
            active={country !== "ALL"}
            onClear={() => setCountry("ALL")}
            width="w-48 sm:w-52"
            isOpen={activeDropdown === "country"}
            onToggle={(open) => handleToggleDropdown("country", open)}
          >
            <div className="py-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
              {TAXONOMY.regions.map((r) => (
                <OptionItem
                  key={r.code}
                  label={`${r.flag} ${r.label}`}
                  active={country === r.code}
                  onClick={() => {
                    setCountry(r.code);
                    handleToggleDropdown("country", false);
                  }}
                />
              ))}
            </div>
          </FilterDropdown>
        )}

        {/* 6. Sort By */}
        <FilterDropdown
          label={sortLabel}
          active={sortBy !== (activeSortList[0]?.id ?? "popularity.desc")}
          onClear={() => setSortBy(activeSortList[0]?.id ?? "popularity.desc")}
          width="w-52 sm:w-60"
          isOpen={activeDropdown === "sort"}
          onToggle={(open) => handleToggleDropdown("sort", open)}
        >
          <div className="py-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {activeSortList.map((s) => (
              <OptionItem
                key={s.id}
                label={s.label}
                active={sortBy === s.id}
                onClick={() => {
                  setSortBy(s.id);
                  handleToggleDropdown("sort", false);
                }}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* 7. TV Status */}
        {showStatusFilter && (
          <FilterDropdown
            label={statusLabel}
            active={Boolean(tvStatus)}
            onClear={() => setTvStatus("")}
            width="w-48 sm:w-52"
            isOpen={activeDropdown === "status"}
            onToggle={(open) => handleToggleDropdown("status", open)}
          >
            <div className="py-1">
              {TV_STATUS.map((s) => (
                <OptionItem
                  key={s.id}
                  label={s.label}
                  active={tvStatus === s.id}
                  onClick={() => {
                    setTvStatus(s.id);
                    handleToggleDropdown("status", false);
                  }}
                />
              ))}
            </div>
          </FilterDropdown>
        )}

        {/* Reset All */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              audioFX.playPop();
              handleReset();
            }}
            className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 shrink-0" />
            <span>Reset ({activeCount})</span>
          </button>
        )}
      </div>

      {/* ─── Full-Width Genre Filter Panel ─── */}
      {activeDropdown === "genre" && (
        <div className="w-full rounded-2xl border border-white/10 bg-[#141518]/95 p-3.5 sm:p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-200">
                Select Genres
              </span>
              {genres.length > 0 ? (
                <span className="rounded-lg bg-white/10 border border-white/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-white font-mono">
                  {genres.length} Selected
                </span>
              ) : (
                <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium truncate max-w-[140px] sm:max-w-none">
                  All Shown ({ALL_GENRES_ORDERED.length})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {genres.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    audioFX.playPop();
                    setGenres([]);
                  }}
                  className="text-xs text-[#E50914] hover:underline font-bold px-1.5 sm:px-2 py-1 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  handleToggleDropdown("genre", false);
                }}
                className="rounded-xl bg-white px-3 sm:px-3.5 py-1 text-xs font-bold text-zinc-950 shadow-sm hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 sm:gap-1.5 max-h-52 sm:max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 pr-1">
            {ALL_GENRES_ORDERED.map((genre) => (
              <MultiChip
                key={genre.id}
                label={genre.name}
                active={genres.includes(String(genre.id))}
                onClick={() => toggleGenre(String(genre.id))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
