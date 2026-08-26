"use client";

import React from "react";
import { X, RotateCcw } from "lucide-react";
import { TAXONOMY } from "@/lib/constants/taxonomy";
import { audioFX } from "@/lib/audio/audio-fx";
import { MONTHS } from "@/components/common/FacebookDateFilter";

interface ActiveFiltersBarProps {
  query?: string;
  mediaType?: string;
  genre?: string;
  country?: string;
  year?: string;
  month?: string;
  yearStart?: string;
  yearEnd?: string;
  minRating?: string;
  onRemoveQuery?: () => void;
  onRemoveMediaType?: () => void;
  onRemoveGenre?: () => void;
  onRemoveCountry?: () => void;
  onRemoveDate?: () => void;
  onRemoveYear?: () => void;
  onRemoveRating?: () => void;
  onClearAll?: () => void;
}

export function ActiveFiltersBar({
  query,
  mediaType,
  genre,
  country,
  year,
  month,
  yearStart,
  yearEnd,
  minRating,
  onRemoveQuery,
  onRemoveMediaType,
  onRemoveGenre,
  onRemoveCountry,
  onRemoveDate,
  onRemoveYear,
  onRemoveRating,
  onClearAll,
}: ActiveFiltersBarProps) {
  const genreObj = TAXONOMY.genres.find((g) => String(g.id) === String(genre));
  const countryObj = TAXONOMY.regions.find((r) => r.code === country);

  const monthObj = MONTHS.find((m) => m.id === month);
  let dateLabel = "";
  if (year && month && monthObj?.short) {
    dateLabel = `${monthObj.short} ${year}`;
  } else if (year) {
    dateLabel = year;
  } else if (month && monthObj?.label) {
    dateLabel = monthObj.label;
  }

  const hasAnyFilter =
    Boolean(query) ||
    Boolean(mediaType && mediaType !== "all") ||
    Boolean(genre) ||
    Boolean(country && country !== "ALL") ||
    Boolean(year || month || yearStart || yearEnd) ||
    Boolean(minRating);

  if (!hasAnyFilter) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-1 animate-in fade-in">
      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
        Active Filters:
      </span>

      {/* Query Pill */}
      {query && onRemoveQuery && (
        <button
          onClick={() => {
            audioFX.playPop();
            onRemoveQuery();
          }}
          className="flex items-center gap-1 rounded-md bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-xs text-zinc-200 hover:border-[#E50914]/40 transition-colors"
        >
          <span>Query: &ldquo;{query}&rdquo;</span>
          <X className="h-3 w-3 text-zinc-400" />
        </button>
      )}

      {/* Media Type Pill */}
      {mediaType && mediaType !== "all" && onRemoveMediaType && (
        <button
          onClick={() => {
            audioFX.playPop();
            onRemoveMediaType();
          }}
          className="flex items-center gap-1 rounded-md bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-xs text-zinc-200 capitalize hover:border-[#E50914]/40 transition-colors"
        >
          <span>Type: {mediaType}</span>
          <X className="h-3 w-3 text-zinc-400" />
        </button>
      )}

      {/* Genre Pill */}
      {genre && onRemoveGenre && (
        <button
          onClick={() => {
            audioFX.playPop();
            onRemoveGenre();
          }}
          className="flex items-center gap-1 rounded-md bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-xs text-zinc-200 hover:border-[#E50914]/40 transition-colors"
        >
          <span>Genre: {genreObj?.name || genre}</span>
          <X className="h-3 w-3 text-zinc-400" />
        </button>
      )}

      {/* Country Pill */}
      {country && country !== "ALL" && onRemoveCountry && (
        <button
          onClick={() => {
            audioFX.playPop();
            onRemoveCountry();
          }}
          className="flex items-center gap-1 rounded-md bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-xs text-zinc-200 hover:border-[#E50914]/40 transition-colors"
        >
          <span>Origin: {countryObj?.label || country}</span>
          <X className="h-3 w-3 text-zinc-400" />
        </button>
      )}

      {/* Facebook Date Filter Pill (Year & Month) */}
      {(year || month) && (onRemoveDate || onRemoveYear) && (
        <button
          onClick={() => {
            audioFX.playPop();
            if (onRemoveDate) onRemoveDate();
            else if (onRemoveYear) onRemoveYear();
          }}
          className="flex items-center gap-1 rounded-md bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-xs text-zinc-200 hover:border-[#E50914]/40 transition-colors"
        >
          <span>Date: {dateLabel}</span>
          <X className="h-3 w-3 text-zinc-400" />
        </button>
      )}

      {/* Year Range Pill (Legacy Fallback) */}
      {!year && !month && (yearStart || yearEnd) && onRemoveYear && (
        <button
          onClick={() => {
            audioFX.playPop();
            onRemoveYear();
          }}
          className="flex items-center gap-1 rounded-md bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-xs text-zinc-200 hover:border-[#E50914]/40 transition-colors"
        >
          <span>Year: {yearStart || "Any"}–{yearEnd || "Present"}</span>
          <X className="h-3 w-3 text-zinc-400" />
        </button>
      )}

      {/* Min Rating Pill */}
      {minRating && onRemoveRating && (
        <button
          onClick={() => {
            audioFX.playPop();
            onRemoveRating();
          }}
          className="flex items-center gap-1 rounded-md bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-xs text-amber-400 hover:border-[#E50914]/40 transition-colors"
        >
          <span>Rating: ★ {minRating}+</span>
          <X className="h-3 w-3 text-zinc-400" />
        </button>
      )}

      {/* Clear All Button */}
      {onClearAll && (
        <button
          onClick={() => {
            audioFX.playPop();
            onClearAll();
          }}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-400 ml-1 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
