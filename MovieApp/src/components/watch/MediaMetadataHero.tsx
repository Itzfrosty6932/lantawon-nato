"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Play,
  Bookmark,
  ListPlus,
  ChevronLeft,
  Volume2,
  VolumeX,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import type { MovieDetails, TvDetails } from "@/types/media";

interface MediaMetadataHeroProps {
  displayTitle: string;
  year?: string;
  mediaType: "movie" | "tv";
  currentSeason: number;
  currentEpisode: number;
  details: MovieDetails | TvDetails | null;
  trailerKey?: string | null;
  isFavorited: boolean;
  isInWatchlist?: boolean;
  onPlay: () => void;
  onOpenPlaylistModal: () => void;
  onToggleFavorite: () => void;
  onToggleWatchlist?: () => void;
  onShare?: () => void;
  onBack?: () => void;
}

export function MediaMetadataHero({
  displayTitle,
  year,
  mediaType,
  currentSeason,
  currentEpisode,
  details,
  trailerKey,
  isFavorited,
  isInWatchlist = false,
  onPlay,
  onOpenPlaylistModal,
  onToggleFavorite,
  onToggleWatchlist,
  onShare,
  onBack,
}: MediaMetadataHeroProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const [activeTrailerKey, setActiveTrailerKey] = useState<string | null>(trailerKey || null);
  const [isTrailerReady, setIsTrailerReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch trailer if not provided
  useEffect(() => {
    if (trailerKey) {
      setActiveTrailerKey(trailerKey);
      return;
    }
    if (details?.id) {
      fetch(`/api/trailer?id=${details.id}&type=${mediaType}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.trailerKey) {
            setActiveTrailerKey(data.trailerKey);
          }
        })
        .catch(() => {});
    }
  }, [details?.id, mediaType, trailerKey]);

  // Backdrop image URL
  const backdropUrl = details?.backdrop_path
    ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${details.backdrop_path.startsWith("/") ? "" : "/"}${details.backdrop_path}`
    : details?.poster_path
    ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${details.poster_path.startsWith("/") ? "" : "/"}${details.poster_path}`
    : null;

  // Runtime calculation (e.g. "0h 27m" or "2h 15m")
  const runtimeMin =
    details && "runtime" in details && typeof details.runtime === "number" && details.runtime > 0
      ? details.runtime
      : details && "episode_run_time" in details && Array.isArray(details.episode_run_time) && details.episode_run_time[0]
      ? details.episode_run_time[0]
      : null;

  const formattedRuntime = runtimeMin
    ? `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60}m`
    : mediaType === "tv"
    ? `${details && "number_of_seasons" in details ? details.number_of_seasons : 1} Season`
    : "1h 45m";

  // Rating e.g. "9.0"
  const rating = details?.vote_average ? Number(details.vote_average).toFixed(1) : "8.8";

  // Age rating badge
  const ageRating = details?.adult ? "NC-17" : "TV-MA";

  return (
    <section className="relative w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[90vh] bg-black text-white flex flex-col justify-between p-4 sm:p-12 lg:p-16 select-none overflow-hidden">
      {/* ─── 1. BASE BACKDROP IMAGE (ALWAYS RENDERED FIRST AS HIGH-RES BASE) ─── */}
      {backdropUrl && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backdropUrl}
            alt={displayTitle}
            className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.05]"
          />
        </div>
      )}

      {/* ─── 2. LIVE AMBIENT TRAILER VIDEO OVERLAY (FADES IN SMOOTHLY) ─── */}
      {activeTrailerKey && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <iframe
            ref={iframeRef}
            key={isMuted ? "muted" : "unmuted"}
            src={`https://www.youtube.com/embed/${activeTrailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${activeTrailerKey}&enablejsapi=1`}
            title={`${displayTitle} Trailer`}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            onLoad={() => setIsTrailerReady(true)}
            className={`absolute w-[180%] h-[180%] -left-[40%] -top-[40%] object-cover filter brightness-[0.75] contrast-[1.05] transition-opacity duration-1000 ${
              isTrailerReady ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      )}

      {/* ─── 3. CINEMATIC GRADIENT VIGNETTES ─── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111112] via-[#111112]/50 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#111112]/90 via-[#111112]/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none z-10" />

      {/* ─── 4. TOP BAR: MINIMALIST BACK BUTTON & SOUND TOGGLE ─── */}
      <div className="relative z-30 flex items-center justify-between pt-[max(env(safe-area-inset-top),0.5rem)] pl-[max(env(safe-area-inset-left),0.25rem)] pr-[max(env(safe-area-inset-right),0.25rem)] pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            if (onBack) {
              onBack();
            } else if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/home");
            }
          }}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-xl transition-all cursor-pointer shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center pointer-events-auto"
          title="Back to Previous Page"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Mute / Unmute Trailer Audio Toggle (Icon Only) */}
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            setIsMuted((prev) => !prev);
          }}
          className="p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/15 backdrop-blur-xl transition-all cursor-pointer shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center"
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
          aria-label="Toggle Sound"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-zinc-300" />
          ) : (
            <Volume2 className="h-5 w-5 text-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ─── 5. BOTTOM/CONTENT OVERLAY: TITLE, META, SYNOPSIS & ACTIONS ─── */}
      <div className="relative z-20 max-w-3xl space-y-3.5 pt-8 sm:pt-12">
        {/* Title Typography */}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] uppercase">
            {displayTitle}
          </h1>
          {details && "tagline" in details && details.tagline && (
            <p className="text-xs sm:text-sm font-mono text-zinc-300 font-semibold tracking-wider uppercase drop-shadow">
              {details.tagline}
            </p>
          )}
        </div>

        {/* Metadata Line (Rating, Year, Runtime, 4K, Genres, Age Rating) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap text-xs sm:text-sm font-semibold text-zinc-200">
          {/* Star Rating */}
          <span className="flex items-center gap-1 text-[#E50914] font-bold">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{rating}</span>
          </span>

          <span className="text-zinc-500">•</span>

          {/* Release Year */}
          {year && <span className="font-mono text-zinc-200">{year}</span>}

          <span className="text-zinc-500">•</span>

          {/* Runtime / Seasons */}
          <span className="font-mono text-zinc-300">{formattedRuntime}</span>

          <span className="text-zinc-500">•</span>

          {/* 1080p Full HD Badge */}
          <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] sm:text-xs font-mono font-bold text-zinc-200 uppercase">
            1080p
          </span>

          <span className="text-zinc-500">•</span>

          {/* Genres */}
          {details?.genres && details.genres.length > 0 && (
            <span className="text-zinc-300">
              {details.genres
                .slice(0, 3)
                .map((g) => g.name)
                .join(" • ")}
            </span>
          )}

          <span className="text-zinc-500">•</span>

          {/* Age Rating Badge */}
          <span className="px-1.5 py-0.5 rounded bg-black/60 border border-zinc-600 text-[10px] sm:text-xs font-mono font-bold text-zinc-300 uppercase">
            {ageRating}
          </span>
        </div>

        {/* Rich Synopsis Overview */}
        <p className="text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-2xl drop-shadow">
          {details?.overview || "No synopsis available for this title."}
        </p>

        {/* ─── ACTION BUTTONS ROW (Strictly 1 Single Row) ─── */}
        <div className="flex items-center gap-2.5 sm:gap-3 pt-2 sm:pt-3 flex-nowrap">
          {/* 1. Play Button (Solid White Pill) */}
          <button
            type="button"
            onClick={() => {
              audioFX.playPop();
              onPlay();
            }}
            className="flex items-center justify-center gap-2 px-6 sm:px-9 py-2.5 sm:py-3 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm sm:text-base transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            <span>Play</span>
          </button>

          {/* 2. Add to Watchlist Button (Icon Only Round Button) */}
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              if (onToggleWatchlist) onToggleWatchlist();
            }}
            title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            className={`flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full border transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-lg ${
              isInWatchlist
                ? "bg-[#E50914] border-[#E50914] text-white shadow-[#E50914]/30"
                : "bg-white/10 hover:bg-white/20 border-white/15 backdrop-blur-md text-white"
            }`}
          >
            <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${isInWatchlist ? "fill-white" : ""}`} />
          </button>

          {/* 3. Add to Playlist Button (Icon Only Round Button) */}
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              onOpenPlaylistModal();
            }}
            title="Add to playlist"
            aria-label="Add to playlist"
            className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-lg"
          >
            <ListPlus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}
