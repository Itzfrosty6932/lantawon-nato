"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

export interface GenreOption {
  id: string;
  name: string;
  endpoint?: string;
}

interface HeroGenreNavProps {
  title: string;
  genres: GenreOption[];
  onSelectGenre: (genre: GenreOption) => void;
  selectedGenreId?: string | null;
}

export function HeroGenreNav({
  title,
  genres,
  onSelectGenre,
  selectedGenreId,
}: HeroGenreNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedName = genres.find((g) => g.id === selectedGenreId)?.name;

  return (
    <div ref={dropdownRef} className="relative z-30 flex items-center gap-3 sm:gap-4 select-none">
      {/* Bold Category Title */}
      <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-none">
        {title}
      </h1>

      {/* Pill Genres Dropdown Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            setIsOpen((prev) => !prev);
          }}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
            isOpen
              ? "bg-[#28292d] text-white border-white/40 shadow-lg"
              : "bg-[#18191d]/90 text-zinc-200 border-white/20 hover:bg-[#28292d] hover:text-white hover:border-white/40 shadow-md backdrop-blur-md"
          }`}
        >
          <span>{selectedName ? selectedName : "Genres"}</span>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-zinc-300" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-300" />
          )}
        </button>

        {/* Multi-Column Glass Modal Dropdown (Matching 9anime & AniWave) */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-[310px] sm:w-[520px] md:w-[680px] lg:w-[760px] p-4 sm:p-5 rounded-2xl bg-[#141517]/95 border border-white/15 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
                Browse by Genre & Theme ({genres.length})
              </span>
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                Select any category to filter
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-1.5 max-h-[58vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {genres.map((g) => {
                const isSelected = g.id === selectedGenreId;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      audioFX.playPop();
                      setIsOpen(false);
                      onSelectGenre(g);
                    }}
                    className={`text-left text-xs font-medium py-1.5 px-2 rounded-lg transition-all cursor-pointer truncate ${
                      isSelected
                        ? "text-white font-bold bg-[#E50914] shadow-sm"
                        : "text-zinc-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
