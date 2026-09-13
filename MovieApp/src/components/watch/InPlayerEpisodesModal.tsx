"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  Check,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { formatRuntime } from "@/lib/utils/formatters";
import { audioFX } from "@/lib/audio/audio-fx";
import type { TvDetails, Episode } from "@/types/media";

interface InPlayerEpisodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: TvDetails | null;
  currentSeason: number;
  currentEpisode: number;
  seasonEpisodes: Episode[];
  onSelectSeason: (seasonNumber: number) => void;
  onSelectEpisode: (episodeNumber: number) => void;
  isAutoNext?: boolean;
  onToggleAutoNext?: () => void;
}

export function InPlayerEpisodesModal({
  isOpen,
  onClose,
  details,
  currentSeason,
  currentEpisode,
  seasonEpisodes,
  onSelectSeason,
  onSelectEpisode,
  isAutoNext = true,
  onToggleAutoNext,
}: InPlayerEpisodesModalProps) {
  const [selectedSeasonTab, setSelectedSeasonTab] = useState(currentSeason);

  if (!isOpen || !details || !("seasons" in details)) return null;

  const validSeasons = details.seasons?.filter((s) => s.season_number > 0) || [];
  const displayTitle = details.name || details.title || "Episodes";

  return (
    <div
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─── TOP HEADER ─── */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Episodes
          </h2>
          <p className="text-xs text-zinc-400 font-medium">{displayTitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto Next Toggle */}
          {onToggleAutoNext && (
            <button
              type="button"
              onClick={() => {
                audioFX.playClick();
                onToggleAutoNext();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            >
              <span>Auto next</span>
              {isAutoNext ? (
                <div className="w-8 h-4 bg-emerald-500 rounded-full flex items-center justify-end px-0.5 transition-colors">
                  <div className="w-3 h-3 bg-white rounded-full shadow" />
                </div>
              ) : (
                <div className="w-8 h-4 bg-zinc-600 rounded-full flex items-center justify-start px-0.5 transition-colors">
                  <div className="w-3 h-3 bg-zinc-300 rounded-full shadow" />
                </div>
              )}
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close Episodes"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      </div>

      {/* ─── BODY: SEASONS COLUMN + EPISODES LIST ─── */}
      <div className="flex-1 flex flex-col sm:flex-row gap-6 pt-5 min-h-0 overflow-hidden">
        {/* Left: Season Pills */}
        <div className="w-full sm:w-48 shrink-0 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto scrollbar-none pb-2 sm:pb-0">
          {validSeasons.map((s) => {
            const isSelected = selectedSeasonTab === s.season_number;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  setSelectedSeasonTab(s.season_number);
                  if (s.season_number !== currentSeason) {
                    onSelectSeason(s.season_number);
                  }
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left whitespace-nowrap ${
                  isSelected
                    ? "bg-white text-zinc-950 font-bold shadow-lg shadow-white/10"
                    : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                }`}
              >
                <span>{s.name || `Season ${s.season_number}`}</span>
                <span className={`text-[10px] font-mono ml-2 ${isSelected ? "text-zinc-600" : "text-zinc-500"}`}>
                  {s.episode_count} Eps
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Episode List Rows (Image 4 Style) */}
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
          {seasonEpisodes.map((ep) => {
            const isCurrent =
              currentSeason === selectedSeasonTab && ep.episode_number === currentEpisode;

            const stillUrl = ep.still_path
              ? ep.still_path.startsWith("http")
                ? ep.still_path
                : `${TMDB_IMAGE_CONFIG.STILL_BASE}${ep.still_path.startsWith("/") ? "" : "/"}${ep.still_path}`
              : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;

            return (
              <div
                key={ep.id}
                onClick={() => {
                  audioFX.playPop();
                  onSelectEpisode(ep.episode_number);
                  onClose();
                }}
                className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 sm:p-4 rounded-2xl transition-all cursor-pointer border ${
                  isCurrent
                    ? "bg-white/15 border-white/30 shadow-lg"
                    : "bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/15"
                }`}
              >
                {/* Episode Thumbnail */}
                <div className="relative aspect-video w-full sm:w-44 sm:min-w-44 rounded-xl overflow-hidden bg-zinc-900 shrink-0">
                  <SmartImage
                    src={stillUrl}
                    alt={ep.name}
                    fallbackType="backdrop"
                    containerClassName="h-full w-full"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-9 w-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold font-mono text-zinc-300">
                    {ep.episode_number}
                  </span>
                </div>

                {/* Episode Metadata */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-zinc-200">
                      {ep.name || `Episode ${ep.episode_number}`}
                    </h4>

                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-white text-zinc-950 font-bold text-[10px] uppercase font-mono tracking-wider shrink-0">
                        Watching
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                    <span>
                      S{selectedSeasonTab} E{ep.episode_number}
                    </span>
                    {ep.runtime && <span>· {formatRuntime(ep.runtime)}</span>}
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {ep.overview || "No synopsis available for this episode."}
                  </p>
                </div>
              </div>
            );
          })}

          {seasonEpisodes.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-sm">
              Loading episodes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
