"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Info,
  Volume2,
  VolumeX,
} from "lucide-react";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import { SaveToPlaylistModal } from "@/components/playlist/SaveToPlaylistModal";
import { getGenreName } from "@/lib/constants/taxonomy";
import type { MediaItem } from "@/types/media";

// Cache trailer keys to avoid refetching
const TRAILER_CACHE = new Map<string, string | null>();

interface HeroSpotlightCarouselProps {
  items: MediaItem[];
  onOpenTrailer: (id: string | number, type: string, title: string, year: string) => void;
}

export function HeroSpotlightCarousel({
  items,
}: HeroSpotlightCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [activeTrailerKey, setActiveTrailerKey] = useState<string | null>(null);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trailerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spotlightList = (items || []).filter(
    (item) =>
      Boolean(item.backdrop_path || item.poster_path) &&
      Boolean(item.title || item.name) &&
      !item.title?.toLowerCase().includes("tagesschau") &&
      !item.name?.toLowerCase().includes("tagesschau")
  );

  const current = spotlightList[activeIndex] || spotlightList[0];
  const mediaType = current?.media_type || (current?.title ? "movie" : "tv");
  const year = current?.release_date?.split("-")[0] || current?.first_air_date?.split("-")[0] || "";
  const displayTitle = current?.title || current?.name || "";
  const genreName = current?.genre_ids && current.genre_ids.length > 0
    ? getGenreName(current.genre_ids[0])
    : "Cinema";

  const backdropUrl = current?.backdrop_path
    ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${current.backdrop_path}`
    : current?.poster_path
      ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${current.poster_path}`
      : TMDB_IMAGE_CONFIG.FALLBACK_BACKDROP;

  const handleNext = useCallback(() => {
    if (spotlightList.length <= 1) return;
    audioFX.playClick();
    setActiveIndex((prev) => (prev + 1) % spotlightList.length);
  }, [spotlightList.length]);

  const handlePrev = useCallback(() => {
    if (spotlightList.length <= 1) return;
    audioFX.playClick();
    setActiveIndex((prev) => (prev - 1 + spotlightList.length) % spotlightList.length);
  }, [spotlightList.length]);

  // Load trailer for current spotlight item after short idle delay (1.5s)
  useEffect(() => {
    setIsTrailerPlaying(false);
    setActiveTrailerKey(null);

    if (!current) return;

    const cacheKey = `${mediaType}_${current.id}`;
    if (trailerTimerRef.current) {
      clearTimeout(trailerTimerRef.current);
    }

    trailerTimerRef.current = setTimeout(async () => {
      if (TRAILER_CACHE.has(cacheKey)) {
        const cached = TRAILER_CACHE.get(cacheKey);
        if (cached) {
          setActiveTrailerKey(cached);
          setIsTrailerPlaying(true);
        }
        return;
      }

      try {
        const res = await fetch(`/api/trailer?id=${current.id}&type=${mediaType}`);
        if (res.ok) {
          const data = await res.json();
          const key = data.trailerKey || null;
          TRAILER_CACHE.set(cacheKey, key);
          if (key) {
            setActiveTrailerKey(key);
            setIsTrailerPlaying(true);
          }
        }
      } catch {
        TRAILER_CACHE.set(cacheKey, null);
      }
    }, 1500);

    return () => {
      if (trailerTimerRef.current) {
        clearTimeout(trailerTimerRef.current);
      }
    };
  }, [current, mediaType]);

  // Auto-advance spotlight every 18s (or when trailer has played)
  useEffect(() => {
    if (spotlightList.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % spotlightList.length);
    }, isTrailerPlaying ? 22000 : 9000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [spotlightList.length, isPaused, isTrailerPlaying]);

  if (spotlightList.length === 0) return null;

  return (
    <>
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full h-[92svh] sm:h-[100svh] min-h-[560px] sm:min-h-[620px] max-h-[900px] flex flex-col justify-end pb-16 sm:pb-28 px-4 sm:px-6 lg:px-10 overflow-hidden select-none group pt-0"
      >
        {/* ─── Backdrop Image or Seamless Frameless Trailer ─── */}
        {isTrailerPlaying && activeTrailerKey ? (
          <div className="absolute inset-0 z-0 overflow-hidden bg-black animate-in fade-in duration-700 pointer-events-none select-none flex items-center justify-center">
            {/* Scaled & Cropped Iframe to completely crop out YouTube title, controls, progress bar, & overlays */}
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeTrailerKey}?autoplay=1&mute=${
                isMuted ? "1" : "0"
              }&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=0&loop=1&playlist=${activeTrailerKey}`}
              title={`${displayTitle} Trailer`}
              className="absolute w-[320%] h-[320%] sm:w-[180%] sm:h-[180%] object-cover pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            <div className="absolute inset-0 z-10 pointer-events-none" />
          </div>
        ) : (
          <SmartImage
            key={current.id}
            src={backdropUrl}
            alt={displayTitle}
            fallbackType="backdrop"
            containerClassName="absolute inset-0 z-0 h-full w-full"
            className="h-full w-full object-cover transition-transform duration-[3s] group-hover:scale-105"
          />
        )}

        {/* ─── Cinematic Vignette Gradients (Darken edges & mask iframe borders) ─── */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-16 sm:h-24 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />

        {/* ─── Left & Right Navigation Arrows (Subtle by default, grows on hover) ─── */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 text-white/70 hover:text-white transition-all duration-300 hover:scale-125 focus:outline-none cursor-pointer drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          <ChevronLeft className="h-8 w-8 sm:h-12 sm:w-12 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 text-white/70 hover:text-white transition-all duration-300 hover:scale-125 focus:outline-none cursor-pointer drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          <ChevronRight className="h-8 w-8 sm:h-12 sm:w-12 stroke-[2.5]" />
        </button>

        {/* ─── Hero Content Info ─── */}
        <div className="relative z-20 max-w-2xl flex flex-col gap-3 items-start pl-2 sm:pl-4 pr-10 sm:pr-14">
          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#FFF8E7] tracking-tight leading-tight font-heading drop-shadow-2xl line-clamp-2">
            {displayTitle}
          </h1>

          {/* Metadata Badges */}
          <div className="flex items-center gap-2.5 text-xs text-white font-medium flex-wrap">
            <span className="text-emerald-400 font-bold">New</span>
            <span className="text-zinc-300 font-semibold">{year}</span>
            <span className="px-1.5 py-0.2 border border-zinc-500 rounded text-[10px] font-mono text-zinc-300">
              18+
            </span>
            <span className="text-zinc-300">
              {mediaType === "tv" ? "Season Series" : "Cinema Feature"}
            </span>
            <span className="px-1.5 py-0.2 border border-zinc-500 rounded text-[10px] font-mono text-zinc-300">
              4K UHD
            </span>
            <span className="text-zinc-500 font-normal">|</span>
            <span className="text-zinc-300 font-medium">{genreName}</span>
          </div>

          {/* Synopsis */}
          <p className="text-zinc-200 text-xs sm:text-sm lg:text-base max-w-xl leading-relaxed line-clamp-3 font-normal drop-shadow-md">
            {current.overview ||
              "In a world where stakes are high and loyalties are tested, heroes rise to uncover the truth and protect what matters most."}
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3.5 mt-2 flex-wrap">
            <Link
              href={`/watch/${current.id}?type=${mediaType}`}
              onClick={() => audioFX.playClick()}
              className="bg-white hover:bg-white/90 text-black font-bold text-sm sm:text-base px-7 sm:px-9 py-2.5 rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-xl"
            >
              <Play className="h-5 w-5 fill-current ml-0.5" />
              Play
            </Link>

            {/* More Info Button */}
            <Link
              href={`/watch/${current.id}?type=${mediaType}`}
              onClick={() => audioFX.playClick()}
              className="bg-[#151515]/80 hover:bg-[#202020] text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-white/15 backdrop-blur-md hover:scale-105 cursor-pointer"
            >
              <Info className="h-5 w-5" />
              More Info
            </Link>

            {/* Audio Toggle when Trailer is Playing */}
            {isTrailerPlaying && (
              <button
                type="button"
                onClick={() => {
                  audioFX.playPop();
                  setIsMuted(!isMuted);
                }}
                className="h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg backdrop-blur-md ml-1 cursor-pointer"
                title={isMuted ? "Unmute Trailer" : "Mute Trailer"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-zinc-300" />
                ) : (
                  <Volume2 className="h-4 w-4 text-[#FFD106]" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* ─── Center Hero Carousel Dots Indicator (Mobile, Tablet, Desktop) ─── */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-16 sm:bottom-24 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-2xl">
          {spotlightList.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  setActiveIndex(idx);
                }}
                aria-label={`Slide ${idx + 1}`}
                className={`transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "w-6 h-2 rounded-full bg-white shadow-md shadow-white/40"
                    : "w-2 h-2 rounded-full bg-white/35 hover:bg-white/70"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Playlist Modal */}
      <SaveToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        item={{
          id: current.id,
          title: displayTitle,
          mediaType: mediaType as any,
          posterPath: current.poster_path,
          year,
          rating: current.vote_average,
        }}
      />
    </>
  );
}
