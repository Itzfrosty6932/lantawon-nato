"use client";

import React, { useState, useMemo } from "react";
import { Play, Search, ArrowUpDown, Sparkles, Check } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { formatRuntime } from "@/lib/utils/formatters";
import { audioFX } from "@/lib/audio/audio-fx";
import type { TvDetails, Episode } from "@/types/media";

interface EpisodeSelectorDrawerProps {
  details: TvDetails;
  currentSeason: number;
  currentEpisode: number;
  seasonEpisodes: Episode[];
  onSelectSeason: (seasonNumber: number) => void;
  onSelectEpisode: (episodeNumber: number) => void;
  onScrollToPlayer: () => void;
}

export function EpisodeSelectorDrawer({
  details,
  currentSeason,
  currentEpisode,
  seasonEpisodes,
  onSelectSeason,
  onSelectEpisode,
  onScrollToPlayer,
}: EpisodeSelectorDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAscending, setIsAscending] = useState(true);

  if (!details || !("seasons" in details)) return null;

  const validSeasons = details.seasons?.filter((s) => s.season_number > 0) || [];

  // Filter & sort episodes
  const filteredEpisodes = useMemo(() => {
    let list = [...seasonEpisodes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ep) =>
          ep.name?.toLowerCase().includes(q) ||
          ep.overview?.toLowerCase().includes(q) ||
          String(ep.episode_number).includes(q)
      );
    }
    if (!isAscending) {
      list.reverse();
    }
    return list;
  }, [seasonEpisodes, searchQuery, isAscending]);

  return (
    <section className="space-y-5 select-none">
      {/* ─── HEADER: Red Accent Line + Title + Season Selector + Search ─── */}
      <div className="space-y-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-[#E50914] rounded-full shrink-0" />
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
              Episodes
            </h2>
            <p className="text-xs text-zinc-400">Pick a season and jump in</p>
          </div>
        </div>

        {/* Season Selector & Search Bar Row */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full">
          {/* Season Dropdown */}
          {validSeasons.length > 1 && (
            <select
              value={currentSeason}
              onChange={(e) => {
                const nextSeason = parseInt(e.target.value, 10);
                audioFX.playClick();
                onSelectSeason(nextSeason);
                onSelectEpisode(1);
                onScrollToPlayer();
              }}
              className="rounded-xl border border-white/10 bg-zinc-900/90 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-white/30 cursor-pointer shadow-sm shrink-0 max-w-[120px] xs:max-w-none"
            >
              {validSeasons.map((s) => (
                <option
                  key={s.id}
                  value={s.season_number}
                  className="bg-zinc-900 text-white"
                >
                  {s.name || `Season ${s.season_number}`} ({s.episode_count} Episodes)
                </option>
              ))}
            </select>
          )}

          {/* Search Episode Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search episode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-zinc-900/90 border border-white/10 pl-8 sm:pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors shadow-sm"
            />
          </div>

          {/* Sort Order Toggle */}
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              setIsAscending(!isAscending);
            }}
            className="p-2 sm:p-2.5 rounded-xl border border-white/10 bg-zinc-900/90 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center"
            title={isAscending ? "Sort: Oldest First" : "Sort: Newest First"}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── STREAMLINED EPISODE ROWS (Divided Spacing, Images 1 & 2) ─── */}
      <div className="space-y-2 sm:space-y-3">
        {filteredEpisodes.map((ep) => {
          const isCurrent = ep.episode_number === currentEpisode;
          const stillUrl = ep.still_path
            ? ep.still_path.startsWith("http")
              ? ep.still_path
              : `${TMDB_IMAGE_CONFIG.STILL_BASE}${ep.still_path.startsWith("/") ? "" : "/"}${ep.still_path}`
            : TMDB_IMAGE_CONFIG.FALLBACK_BACKDROP;

          const runtimeStr = ep.runtime ? formatRuntime(ep.runtime) : "24 min";

          return (
            <div
              key={ep.id}
              onClick={() => {
                audioFX.playPop();
                onSelectEpisode(ep.episode_number);
                onScrollToPlayer();
              }}
              className={`group flex items-center justify-between gap-3 sm:gap-5 p-3 sm:p-4 rounded-2xl transition-all cursor-pointer border ${
                isCurrent
                  ? "bg-white/10 border-white/20 shadow-lg ring-1 ring-white/20"
                  : "bg-zinc-900/40 hover:bg-zinc-900/80 border-white/5 hover:border-white/15"
              }`}
            >
              {/* Left: Thumbnail with Number Badge + Details */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                {/* 16:9 Thumbnail with Number Badge in bottom-left corner */}
                <div className="relative aspect-video w-24 sm:w-36 md:w-44 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                  <SmartImage
                    src={stillUrl}
                    alt={ep.name}
                    fallbackType="backdrop"
                    containerClassName="h-full w-full"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Hover Play Circle */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-8 w-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                  {/* Episode Number Badge in bottom-left */}
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold font-mono text-zinc-300">
                    {ep.episode_number}
                  </span>
                </div>

                {/* Episode Text Info */}
                <div className="min-w-0 space-y-0.5 sm:space-y-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-xs sm:text-sm md:text-base font-bold truncate transition-colors ${
                        isCurrent ? "text-white font-extrabold" : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {ep.name || `Episode ${ep.episode_number}`}
                    </h3>
                  </div>

                  <div className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                    {runtimeStr}
                  </div>

                  {ep.overview && (
                    <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 sm:line-clamp-2 leading-relaxed hidden xs:block">
                      {ep.overview}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: SUB & DUB Badges (for Anime/TV Shows) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-zinc-300 uppercase">
                  SUB
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-zinc-300 uppercase">
                  DUB
                </span>
              </div>
            </div>
          );
        })}

        {filteredEpisodes.length === 0 && (
          <div className="py-8 text-center text-xs text-zinc-500">
            No matching episodes found in Season {currentSeason}.
          </div>
        )}
      </div>
    </section>
  );
}
