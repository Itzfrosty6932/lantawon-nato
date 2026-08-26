"use client";

import React, { RefObject } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ArrowLeft,
  Clock,
  Sparkles,
  Star,
  Film,
  Tv,
  Layers,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { audioFX } from "@/lib/audio/audio-fx";
import type { SearchHistoryRecord } from "@/types/storage";

export interface AutocompleteItem {
  id: number | string;
  title: string;
  media_type?: string;
  poster_path?: string | null;
  year?: string;
  rating?: string | null;
  subtitle?: string;
}

interface SearchAutocompleteDropdownProps {
  query: string;
  setQuery: (q: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  suggestions: AutocompleteItem[];
  searchHistory: SearchHistoryRecord[];
  popularSearches: string[];
  onSelectSuggestion: (item: AutocompleteItem) => void;
  onSelectHistoryItem: (text: string) => void;
  onDeleteHistoryItem: (id: string, e: React.SyntheticEvent) => void;
  onClearAllHistory: (e: React.MouseEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function SearchAutocompleteDropdown({
  query,
  setQuery,
  inputRef,
  suggestions,
  searchHistory,
  popularSearches,
  onSelectSuggestion,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearAllHistory,
  onSubmit,
  onClose,
}: SearchAutocompleteDropdownProps) {
  return (
    <div className="fixed inset-x-2 top-2 sm:absolute sm:top-0 sm:right-0 sm:inset-x-auto w-auto sm:w-[500px] md:w-[560px] lg:w-[620px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] max-h-[85vh] sm:max-h-[75vh] rounded-2xl bg-[#242526] shadow-[0_12px_32px_0_rgba(0,0,0,0.95),0_2px_6px_0_rgba(0,0,0,0.6)] z-50 p-3 sm:p-3.5 border border-zinc-700/80 backdrop-blur-3xl animate-in fade-in zoom-in-95 flex flex-col select-auto touch-pan-y">
      {/* Search Header with Back Button */}
      <div className="flex items-center gap-2 shrink-0 pb-2.5 border-b border-zinc-700/50">
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 rounded-full hover:bg-[#3a3b3c] flex items-center justify-center text-zinc-300 hover:text-white shrink-0 transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSubmit(e);
              }
            }}
            placeholder="Search"
            className="w-full h-9 rounded-full bg-[#3a3b3c] border-none py-1.5 pl-10 pr-8 text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content 1: When Query is Empty (Recent Searches + Popular Tags) */}
      {!query.trim() && (
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-1 pt-2 space-y-3">
          {/* Recent Searches */}
          {searchHistory.length > 0 ? (
            <div>
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-sm font-semibold text-white">Recent Searches</span>
                <button
                  type="button"
                  onClick={onClearAllHistory}
                  className="text-xs font-semibold text-[#E50914] hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-[#3a3b3c]/60 transition-colors group cursor-pointer"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectHistoryItem(item.query)}
                      className="flex-1 min-w-0 truncate flex items-center gap-3 text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-[#3a3b3c] flex items-center justify-center text-zinc-300 group-hover:bg-[#4e4f50] transition-colors shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-white truncate">
                        {item.query}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => onDeleteHistoryItem(item.id, e)}
                      className="h-8 w-8 rounded-full hover:bg-[#4e4f50] flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 ml-2 cursor-pointer"
                      title="Delete from history"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-zinc-400">
              No recent searches. Search for any movie, series, anime, or person.
            </div>
          )}

          {/* Popular Searches */}
          <div className="pt-2 border-t border-zinc-700/60 pb-2">
            <div className="px-2 py-1 mb-1.5 text-sm font-semibold text-white">
              <span>Popular Searches</span>
            </div>
            <div className="flex flex-wrap gap-2 px-1">
              {popularSearches.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    audioFX.playClick();
                    onSelectHistoryItem(tag);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#3a3b3c] hover:bg-[#4e4f50] text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-[#E50914]" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Body Content 2: When Query has Text (Live Instant Autocomplete) */}
      {query.trim() && suggestions.length > 0 && (
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-1 pt-2 space-y-1">
          <div className="px-2 py-1 text-xs font-semibold text-zinc-400 flex items-center justify-between">
            <span>Instant Results</span>
            <span className="text-[11px] font-mono">{suggestions.length} matches</span>
          </div>
          {suggestions.map((item) => (
            <div
              key={`${item.media_type || "media"}_${item.id}`}
              onClick={() => onSelectSuggestion(item)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#3a3b3c] transition-colors cursor-pointer group"
            >
              <div className="relative h-12 w-9 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-700/60">
                <SmartImage
                  src={
                    item.poster_path
                      ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.poster_path.startsWith("/") ? "" : "/"}${item.poster_path}`
                      : TMDB_IMAGE_CONFIG.FALLBACK_POSTER
                  }
                  alt={item.title}
                  fallbackType={item.media_type === "person" ? "avatar" : "poster"}
                  containerClassName="h-full w-full"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                  {item.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                  {item.media_type && (
                    <span className="capitalize font-medium text-zinc-300">
                      {item.media_type}
                    </span>
                  )}
                  {item.year && <span>&bull; {item.year}</span>}
                  {item.rating && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star className="h-3 w-3 fill-current" /> {item.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* View all search results button */}
          <div className="pt-2 pb-1 border-t border-zinc-700/60 sticky bottom-0 bg-[#242526]">
            <button
              type="button"
              onClick={onSubmit}
              className="w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold text-center transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span>See all results for &ldquo;{query}&rdquo;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
