"use client";

import React from "react";
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
  ActivePill,
} from "@/components/catalog/CatalogFilterBar";
import {
  FacebookDateFilter,
  MONTHS,
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

interface DiscoverFilterBarProps {
  query: string;
  setQuery: (q: string) => void;
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
}: DiscoverFilterBarProps) {
  const mediaLabel = MEDIA_TYPES.find((m) => m.id === mediaType)?.label ?? "Media Type";
  const countryLabel = TAXONOMY.regions.find((r) => r.code === country)?.flag
    ? `${TAXONOMY.regions.find((r) => r.code === country)?.flag} ${TAXONOMY.regions.find((r) => r.code === country)?.label}`
    : "Origin";
  const ratingLabel = minRating ? `★ ${minRating}+` : "Min Rating";
  const sortLabel = SORT_OPTIONS.find((s) => s.id === sortBy)?.label ?? "Sort";
  const statusLabel = tvStatus || "Series Status";
  const genreLabel =
    genres.length === 0
      ? "Genres"
      : genres.length === 1
      ? getGenreName(genres[0])
      : `${getGenreName(genres[0])} +${genres.length - 1}`;

  const monthObj = MONTHS.find((m) => m.id === selectedMonth);
  let datePillLabel = "";
  if (selectedYear && selectedMonth && monthObj?.short) {
    datePillLabel = `${monthObj.short} ${selectedYear}`;
  } else if (selectedYear) {
    datePillLabel = selectedYear;
  } else if (selectedMonth && monthObj?.label) {
    datePillLabel = monthObj.label;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {/* 1. Media Type */}
        <FilterDropdown
          label={mediaLabel}
          active={mediaType !== "all"}
          onClear={() => setMediaType("all")}
          width="w-44"
        >
          <div className="py-1">
            {MEDIA_TYPES.map(({ id, label }) => (
              <OptionItem
                key={id}
                label={label}
                active={mediaType === id}
                onClick={() => setMediaType(id)}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* 2. Genre Toggle Button */}
        <button
          onClick={() => {
            audioFX.playClick();
            setIsGenreOpen((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all ${
            genres.length > 0
              ? "bg-white text-zinc-950 border-white shadow-sm"
              : isGenreOpen
              ? "bg-[#3a3b3c] text-white border-zinc-500"
              : "bg-[#242526] text-zinc-200 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
          }`}
        >
          <span>{genreLabel}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              isGenreOpen ? "rotate-180" : ""
            }`}
          />
          {genres.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                audioFX.playPop();
                setGenres([]);
              }}
              className="ml-0.5 flex items-center justify-center h-3.5 w-3.5 rounded-full bg-black/20 hover:bg-black/40 text-zinc-900"
            >
              <X className="h-2 w-2" />
            </span>
          )}
        </button>

        {/* 3. Facebook-style Date Filter (Year & Month) */}
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

        {/* 4. Rating */}
        <FilterDropdown
          label={ratingLabel}
          active={Boolean(minRating)}
          onClear={() => setMinRating("")}
          width="w-52"
        >
          <div className="py-1 max-h-64 overflow-y-auto scrollbar-none">
            {RATING_OPTIONS.map((r) => (
              <OptionItem
                key={r.id}
                label={r.label}
                active={minRating === r.id}
                onClick={() => setMinRating(r.id)}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* 5. Origin Country */}
        <FilterDropdown
          label={countryLabel}
          active={country !== "ALL"}
          onClear={() => setCountry("ALL")}
          width="w-52"
        >
          <div className="py-1">
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

        {/* 6. Sort By */}
        <FilterDropdown
          label={sortLabel}
          active={sortBy !== "best_match"}
          onClear={() => setSortBy("best_match")}
          width="w-60"
        >
          <div className="py-1">
            {SORT_OPTIONS.map((s) => (
              <OptionItem
                key={s.id}
                label={s.label}
                active={sortBy === s.id}
                onClick={() => setSortBy(s.id)}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* 7. TV Status */}
        <FilterDropdown
          label={statusLabel}
          active={Boolean(tvStatus)}
          onClear={() => setTvStatus("")}
          width="w-52"
        >
          <div className="py-1">
            {TV_STATUS.map((s) => (
              <OptionItem
                key={s.id}
                label={s.label}
                active={tvStatus === s.id}
                onClick={() => setTvStatus(s.id)}
              />
            ))}
          </div>
        </FilterDropdown>

        {/* Reset All */}
        {activeCount > 0 && (
          <button
            onClick={() => {
              audioFX.playPop();
              handleReset();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-400/20 bg-rose-400/5 px-3 py-2 text-[11px] font-bold text-rose-400 hover:bg-rose-400/10 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        )}
      </div>

      {/* Full-Width Genre Filter Panel */}
      {isGenreOpen && (
        <div className="w-full rounded-2xl border border-zinc-700/80 bg-[#18191a] p-4 sm:p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Select Genres
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

      {/* Active Filter Pills */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {query && <ActivePill label={`"${query}"`} onRemove={() => setQuery("")} />}
          {mediaType !== "all" && (
            <ActivePill
              label={MEDIA_TYPES.find((m) => m.id === mediaType)?.label ?? mediaType}
              onRemove={() => setMediaType("all")}
            />
          )}
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
          {sortBy !== "best_match" && (
            <ActivePill
              label={`Sort: ${SORT_OPTIONS.find((s) => s.id === sortBy)?.label ?? sortBy}`}
              onRemove={() => setSortBy("best_match")}
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
  );
}
