"use client";

import React, { useEffect, RefObject } from "react";
import { Search, X, ArrowLeft, Clock, Sparkles, Star } from "lucide-react";
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
  onSubmit: (e?: React.FormEvent | React.MouseEvent) => void;
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
  // Mobile scroll lock & Escape dismiss without polluting window.history
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <>
      {/* Mobile backdrop. The panel used to float as a card over a still-live
          page, so taps meant for "dismiss" hit the catalog underneath and
          navigated somewhere unexpected. */}
      <div
        className="lg:hidden fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 lg:absolute lg:inset-auto lg:top-0 lg:right-0 w-auto lg:w-[620px] lg:max-w-[calc(100vw-2rem)] h-screen-safe lg:h-auto lg:max-h-[75vh] rounded-none lg:rounded-2xl bg-[#242526] shadow-[0_12px_32px_0_rgba(0,0,0,0.95),0_2px_6px_0_rgba(0,0,0,0.6)] z-50 p-0 lg:p-3.5 border-0 lg:border border-zinc-700/80 animate-in fade-in lg:zoom-in-95 flex flex-col select-auto touch-pan-y">
        {/* Search Header with Back Button */}
        <div className="flex items-center gap-1 lg:gap-2 shrink-0 safe-area-pt px-2 lg:px-0 py-2 lg:py-0 lg:pb-2.5 border-b border-zinc-700/50 bg-[#242526]">
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-11 lg:h-9 lg:w-9 rounded-full active:bg-[#3a3b3c] hover:bg-[#3a3b3c] flex items-center justify-center text-white lg:text-zinc-300 shrink-0 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              placeholder="Search movies, series, anime…"
              className="w-full h-11 lg:h-9 rounded-full bg-[#3a3b3c] border-none py-1.5 pl-10 pr-10 text-base lg:text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all [appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 active:bg-zinc-600 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body Content 1: When Query is Empty (Recent Searches + Popular Tags) */}
        {!query.trim() && (
          <div className="flex-1 scroll-lock-y touch-pan-y px-2 lg:px-0 lg:pr-1 pt-2 pb-[env(safe-area-inset-bottom)] space-y-3">
            {/* Recent Searches */}
            {searchHistory.length > 0 ? (
              <div>
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-sm font-semibold text-white">Recent Searches</span>
                  <button
                    type="button"
                    onClick={onClearAllHistory}
                    className="px-2 py-1 text-xs font-semibold text-[#E50914] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-0.5">
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-2 rounded-xl active:bg-[#3a3b3c]/60 hover:bg-[#3a3b3c]/60 transition-colors group cursor-pointer"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectHistoryItem(item.query)}
                        className="flex-1 min-w-0 truncate flex items-center gap-3 text-left py-2.5 cursor-pointer"
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
                        className="h-10 w-10 rounded-full active:bg-[#4e4f50] hover:bg-[#4e4f50] flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 ml-1 cursor-pointer"
                        aria-label="Delete from history"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-zinc-400 px-4">
                No recent searches. Type any title, series, anime, or creator.
              </div>
            )}
          </div>
        )}

        {/* Body Content 2: When Query has Text (Live Instant Autocomplete) */}
        {query.trim() && suggestions.length > 0 && (
          <div className="flex-1 scroll-lock-y touch-pan-y px-2 lg:px-0 lg:pr-1 pt-2 space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <span>Instant Results</span>
              <span className="text-[11px] font-mono">{suggestions.length} matches</span>
            </div>
            {suggestions.map((item) => {
              return (
                <button
                  key={`${item.media_type || "media"}_${item.id}`}
                  type="button"
                  onClick={() => onSelectSuggestion(item)}
                  className="w-full text-left flex items-center gap-3 p-2 rounded-xl active:bg-[#3a3b3c] hover:bg-[#3a3b3c] transition-colors cursor-pointer group"
                >
                  <div className="relative h-14 w-10 lg:h-12 lg:w-9 rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-700/60">
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
                </button>
              );
            })}

            {/* View all search results button */}
            <div className="pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] border-t border-zinc-700/60 sticky bottom-0 bg-[#242526]">
              <button
                type="button"
                onClick={(e) => onSubmit(e)}
                className="w-full py-3 rounded-xl bg-[#E50914] active:bg-[#b80710] hover:bg-[#b80710] text-white text-[13px] font-bold text-center transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="truncate">See all results for &ldquo;{query}&rdquo;</span>
              </button>
            </div>
          </div>
        )}

        {/* Body Content 3: Query typed but nothing matched. */}
        {query.trim() && suggestions.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <Search className="h-7 w-7 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              No instant matches for &ldquo;{query}&rdquo;.
            </p>
            <button
              type="button"
              onClick={(e) => onSubmit(e)}
              className="px-4 py-2.5 rounded-xl bg-[#E50914] active:bg-[#b80710] text-white text-[13px] font-bold transition-colors cursor-pointer"
            >
              Search anyway
            </button>
          </div>
        )}
      </div>
    </>
  );
}
