"use client";

import React, { useState } from "react";
import { ChevronDown, Search, ArrowUpDown, Play } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { audioFX } from "@/lib/audio/audio-fx";
import type { Episode, TvDetails } from "@/types/media";

interface DetailsEpisodesSectionProps {
  details: TvDetails | null;
  currentSeason: number;
  currentEpisode: number;
  episodes: Episode[];
  onSelectSeason: (seasonNumber: number) => void;
  onPlayEpisode: (seasonNumber: number, episodeNumber: number) => void;
}

export function DetailsEpisodesSection({
  details,
  currentSeason,
  currentEpisode,
  episodes,
  onSelectSeason,
  onPlayEpisode,
}: DetailsEpisodesSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSortDesc, setIsSortDesc] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);

  // Available seasons
  const seasons = details?.seasons?.filter((s) => s.season_number > 0) || [
    { id: 1, season_number: 1, name: "Season 1", episode_count: episodes.length },
  ];

  // Filter & Sort Episodes
  const filteredEpisodes = episodes
    .filter((ep) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        ep.name?.toLowerCase().includes(query) ||
        ep.overview?.toLowerCase().includes(query) ||
        String(ep.episode_number).includes(query)
      );
    })
    .sort((a, b) =>
      isSortDesc
        ? b.episode_number - a.episode_number
        : a.episode_number - b.episode_number
    );

  const currentSeasonName =
    seasons.find((s) => s.season_number === currentSeason)?.name ||
    `Season ${currentSeason}`;

  return (
    <section className="space-y-5 select-none">
      {/* ─── Header: Title & Subtitle ─── */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-[#E50914] rounded-full shrink-0" />
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Episodes
          </h2>
          <p className="text-xs text-zinc-400 font-medium">
            Pick a season and jump in
          </p>
        </div>
      </div>

      {/* ─── Controls Bar: Season Picker, Search Input & Sort on 1 Row ─── */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        {/* Season Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              setIsSeasonDropdownOpen((p) => !p);
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#1c1d22] hover:bg-[#25262c] border border-white/10 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md shrink-0"
          >
            <span className="truncate max-w-[85px] xs:max-w-none">{currentSeasonName}</span>
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400 shrink-0" />
          </button>

          {isSeasonDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-48 py-1.5 rounded-xl bg-[#18191d] border border-white/15 shadow-2xl backdrop-blur-xl z-30 animate-in fade-in zoom-in-95 duration-150">
              {seasons.map((s) => (
                <button
                  key={s.id || s.season_number}
                  type="button"
                  onClick={() => {
                    audioFX.playPop();
                    onSelectSeason(s.season_number);
                    setIsSeasonDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                    s.season_number === currentSeason
                      ? "text-white bg-[#E50914] font-bold"
                      : "text-zinc-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{s.name || `Season ${s.season_number}`}</span>
                  {s.episode_count ? (
                    <span className="text-[10px] opacity-70">
                      {s.episode_count} eps
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Episode Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search episode..."
            className="w-full pl-8 sm:pl-9 pr-3 py-2 rounded-xl bg-[#1c1d22] border border-white/10 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#E50914] transition-colors"
          />
        </div>

        {/* Sort Toggle Button */}
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            setIsSortDesc((p) => !p);
          }}
          title={isSortDesc ? "Sort Ascending (1-N)" : "Sort Descending (N-1)"}
          className="p-2 sm:p-2.5 rounded-xl bg-[#1c1d22] hover:bg-[#25262c] border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md shrink-0 flex items-center justify-center"
        >
          <ArrowUpDown className="h-4 w-4" />
        </button>
      </div>

      {/* ─── Episode List Cards (Screenshot 1 Style) ─── */}
      <div className="space-y-3">
        {filteredEpisodes.map((ep) => {
          const isSelected =
            ep.season_number === currentSeason &&
            ep.episode_number === currentEpisode;

          const stillUrl = ep.still_path
            ? `${TMDB_IMAGE_CONFIG.STILL_BASE}${ep.still_path.startsWith("/") ? "" : "/"}${ep.still_path}`
            : null;

          const durationText = ep.runtime ? `${ep.runtime} min` : "45 min";

          return (
            <div
              key={`${ep.season_number}_${ep.episode_number}`}
              onClick={() => {
                audioFX.playClick();
                onPlayEpisode(ep.season_number || currentSeason, ep.episode_number);
              }}
              className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#202127]/90 border-[#E50914]/60 shadow-lg"
                  : "bg-[#141518]/80 hover:bg-[#1c1d22] border-white/5 hover:border-white/20 shadow-md"
              }`}
            >
              {/* Left: Thumbnail with Number Badge + Details */}
              <div className="flex items-start gap-4 flex-1">
                {/* Thumbnail Image */}
                <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                  {stillUrl ? (
                    <SmartImage
                      src={stillUrl}
                      alt={ep.name || `Episode ${ep.episode_number}`}
                      fallbackType="backdrop"
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                      <Play className="h-6 w-6 fill-current opacity-40" />
                    </div>
                  )}

                  {/* Episode Number Badge (Bottom Left) */}
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white">
                    {ep.episode_number}
                  </div>

                  {/* Hover Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="h-8 w-8 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Text Metadata */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#E50914] transition-colors truncate">
                      {ep.name || `Episode ${ep.episode_number}`}
                    </h3>
                  </div>

                  <div className="text-xs font-mono font-medium text-zinc-400">
                    {durationText}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-normal">
                    {ep.overview ||
                      "Stream this episode now in high definition on Lantawon."}
                  </p>
                </div>
              </div>

              {/* Right: Play / Action Icon */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  title="Play Episode"
                  className="p-2.5 rounded-full bg-white/5 group-hover:bg-[#E50914] text-zinc-300 group-hover:text-white transition-colors"
                >
                  <Play className="h-4 w-4 fill-current" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
