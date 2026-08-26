"use client";

import React from "react";
import { Star, ListPlus, Heart, Share2 } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import type { MovieDetails, TvDetails } from "@/types/media";

interface MediaMetadataHeroProps {
  displayTitle: string;
  year?: string;
  mediaType: "movie" | "tv";
  currentSeason: number;
  currentEpisode: number;
  details: MovieDetails | TvDetails | null;
  isFavorited: boolean;
  onOpenPlaylistModal: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}

export function MediaMetadataHero({
  displayTitle,
  year,
  mediaType,
  currentSeason,
  currentEpisode,
  details,
  isFavorited,
  onOpenPlaylistModal,
  onToggleFavorite,
  onShare,
}: MediaMetadataHeroProps) {
  return (
    <section className="rounded-2xl bg-[#18191a] p-5 border border-zinc-800/80 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Title & Metadata Badges */}
        <div className="space-y-2 max-w-4xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {displayTitle}
            </h1>

            {year && (
              <span className="rounded-lg bg-[#242526] border border-zinc-700/80 px-2.5 py-0.5 text-xs text-zinc-300 font-mono font-semibold">
                {year}
              </span>
            )}

            {mediaType === "tv" && (
              <span className="rounded-lg bg-[#E50914]/15 text-[#ff4d4d] border border-[#E50914]/30 px-2.5 py-0.5 text-xs font-bold font-mono">
                S{currentSeason} : E{currentEpisode}
              </span>
            )}

            {details?.vote_average ? (
              <span className="flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                {Number(details.vote_average).toFixed(1)}
              </span>
            ) : null}

            {/* Tech Specs */}
            <span className="rounded-lg bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300 font-bold uppercase">
              4K UHD
            </span>
            <span className="rounded-lg bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300 font-bold uppercase">
              5.1 Audio
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
            {details?.overview || "No synopsis available."}
          </p>

          {/* Genres */}
          {details?.genres && details.genres.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {details.genres.map((g) => (
                <span
                  key={g.id}
                  className="rounded-lg bg-[#242526] border border-zinc-700/80 px-2.5 py-0.5 text-[11px] text-zinc-300 font-medium"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Buttons (Strictly 1 Row) */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1">
          {/* 1. Save to Playlist / Watchlist */}
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              onOpenPlaylistModal();
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 transition-colors font-bold text-xs shadow-sm whitespace-nowrap cursor-pointer"
            title="Save to Playlist or Watch Later"
          >
            <ListPlus className="h-4 w-4 shrink-0" />
            <span>Save to List</span>
          </button>

          {/* 2. Add to Favorites */}
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              isFavorited
                ? "bg-[#E50914] text-white border-[#E50914] font-bold"
                : "bg-[#242526] text-zinc-300 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
            }`}
            title={isFavorited ? "In Favorites" : "Add to Favorites"}
          >
            <Heart className={`h-4 w-4 shrink-0 ${isFavorited ? "fill-current" : ""}`} />
            <span>{isFavorited ? "Favorited" : "Favorite"}</span>
          </button>

          {/* 3. Share */}
          <button
            type="button"
            onClick={onShare}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#242526] text-zinc-300 border border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white transition-colors text-xs font-semibold whitespace-nowrap cursor-pointer"
            title="Share this Title"
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </section>
  );
}
