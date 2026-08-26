"use client";

import React, { useState } from "react";
import { Clock, Play, Calendar, Star, Check } from "lucide-react";
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
  const [episodeChunk, setEpisodeChunk] = useState<number>(0);

  if (!details || !("seasons" in details)) return null;

  return (
    <section className="rounded-2xl bg-[#18191a] p-5 space-y-4 border border-zinc-800/80">
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-zinc-800 pb-3.5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-400" />
          <h2 className="font-heading text-base font-bold text-white">Episodes</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {seasonEpisodes.length > 25 && (
            <div className="flex items-center gap-1 bg-[#242526] p-1 rounded-xl border border-zinc-700/80">
              {Array.from(
                { length: Math.ceil(seasonEpisodes.length / 25) },
                (_, i) => {
                  const start = i * 25 + 1;
                  const end = Math.min((i + 1) * 25, seasonEpisodes.length);
                  const isSelected = episodeChunk === i;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        audioFX.playClick();
                        setEpisodeChunk(i);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {start}–{end}
                    </button>
                  );
                }
              )}
            </div>
          )}

          {/* Season Dropdown */}
          <select
            value={currentSeason}
            onChange={(e) => {
              const nextSeason = parseInt(e.target.value, 10);
              onSelectSeason(nextSeason);
              onSelectEpisode(1);
              setEpisodeChunk(0);
              onScrollToPlayer();
            }}
            className="rounded-xl border border-zinc-700/80 bg-[#242526] px-3.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            {details.seasons
              ?.filter((s) => s.season_number > 0)
              .map((s) => (
                <option
                  key={s.id}
                  value={s.season_number}
                  className="bg-[#242526] text-white"
                >
                  {s.name} ({s.episode_count} Episodes)
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Episode Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {(seasonEpisodes.length > 25
          ? seasonEpisodes.slice(episodeChunk * 25, (episodeChunk + 1) * 25)
          : seasonEpisodes
        ).map((ep) => {
          const isCurrent = ep.episode_number === currentEpisode;
          const stillUrl = ep.still_path
            ? ep.still_path.startsWith("http")
              ? ep.still_path
              : `${TMDB_IMAGE_CONFIG.STILL_BASE}${ep.still_path.startsWith("/") ? "" : "/"}${ep.still_path}`
            : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;

          return (
            <div
              key={ep.id}
              onClick={() => {
                audioFX.playClick();
                onSelectEpisode(ep.episode_number);
                onScrollToPlayer();
              }}
              className={`rounded-xl overflow-hidden p-2.5 cursor-pointer transition-all border ${
                isCurrent
                  ? "border-[#E50914] bg-[#242526] ring-1 ring-[#E50914]/50 shadow-lg shadow-red-950/20"
                  : "border-zinc-700/80 bg-[#242526] hover:bg-[#3a3b3c] hover:border-zinc-500"
              }`}
            >
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black mb-2 group">
                <SmartImage
                  src={stillUrl}
                  alt={ep.name}
                  fallbackType="backdrop"
                  containerClassName="h-full w-full"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
                {isCurrent ? (
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-[#E50914] text-white px-2 py-0.5 text-[10px] font-black font-mono shadow-md flex items-center gap-1 z-10">
                    <Play className="h-2.5 w-2.5 fill-current animate-pulse" /> EP{" "}
                    {ep.episode_number} (PLAYING)
                  </span>
                ) : (
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 font-mono z-10 border border-white/10">
                    EP {ep.episode_number}
                  </span>
                )}

                {ep.runtime && (
                  <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300 z-10 border border-white/10">
                    {formatRuntime(ep.runtime)}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h4
                  className={`text-xs font-bold truncate ${
                    isCurrent ? "text-[#E50914]" : "text-white"
                  }`}
                >
                  {ep.name || `Episode ${ep.episode_number}`}
                </h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {ep.overview || "No episode synopsis available."}
                </p>
                {ep.air_date && (
                  <div className="text-[10px] text-zinc-500 font-mono pt-1">
                    Air Date: {ep.air_date}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
