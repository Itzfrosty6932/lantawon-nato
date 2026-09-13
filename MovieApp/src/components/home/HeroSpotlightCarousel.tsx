"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Info,
  Star,
  Megaphone,
  MessageSquareQuote,
  Sparkles,
  Tv,
  Clapperboard,
} from "lucide-react";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import { getGenreName } from "@/lib/constants/taxonomy";
import type { MediaItem } from "@/types/media";

interface HeroSpotlightCarouselProps {
  items: MediaItem[];
  onOpenTrailer: (id: string | number, type: string, title: string, year: string) => void;
}

const SEQUENTIAL_BADGES = [
  {
    icon: MessageSquareQuote,
    label: "People are talking about",
    gradient: "from-pink-500 to-indigo-500",
  },
  {
    icon: Sparkles,
    label: "Top 1 Movie",
    gradient: "from-amber-500 to-red-500",
  },
  {
    icon: Tv,
    label: "Top 1 TV Show",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Clapperboard,
    label: "Top 1 Anime",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Megaphone,
    label: "Recently added",
    gradient: "from-[#E50914] to-pink-500",
  },
];

export function HeroSpotlightCarousel({
  items,
  onOpenTrailer,
}: HeroSpotlightCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drag / Swipe State
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDistance, setDragDistance] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Exactly 5 items for the 5 dash lines
  const spotlightList = (items || [])
    .filter(
      (item) =>
        Boolean(item.backdrop_path || item.poster_path) &&
        Boolean(item.title || item.name) &&
        !item.title?.toLowerCase().includes("tagesschau") &&
        !item.name?.toLowerCase().includes("tagesschau")
    )
    .slice(0, 5);

  const current = spotlightList[activeIndex] || spotlightList[0];
  const mediaType = current?.media_type || (current?.title ? "movie" : "tv");
  const year =
    current?.release_date?.split("-")[0] ||
    current?.first_air_date?.split("-")[0] ||
    "2026";
  const displayTitle = current?.title || current?.name || "";
  const rating =
    typeof current?.vote_average === "number" && current.vote_average > 0
      ? current.vote_average.toFixed(1)
      : "8.8";
  const genreName =
    current?.genre_ids && current.genre_ids.length > 0
      ? getGenreName(current.genre_ids[0])
      : "Action & Drama";

  const isAnime =
    current?.genre_ids?.includes(16) ||
    (current as any)?.origin_country?.includes("JP") ||
    (current as any)?.media_type === "anime";

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

  // Touch Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
    setDragDistance(0);
    setIsDragging(true);
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (dragStartX === null) return;
    const diff = e.touches[0].clientX - dragStartX;
    setDragDistance(diff);
  };

  const onTouchEnd = () => {
    if (dragStartX !== null) {
      if (dragDistance < -40) {
        handleNext();
      } else if (dragDistance > 40) {
        handlePrev();
      }
    }
    setDragStartX(null);
    setDragDistance(0);
    setIsDragging(false);
    setIsPaused(false);
  };

  // Mouse Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking background or canvas (not buttons/links)
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;

    setDragStartX(e.clientX);
    setDragDistance(0);
    setIsDragging(true);
    setIsPaused(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragStartX === null || !isDragging) return;
    const diff = e.clientX - dragStartX;
    setDragDistance(diff);
  };

  const onMouseUp = () => {
    if (dragStartX !== null && isDragging) {
      if (dragDistance < -40) {
        handleNext();
      } else if (dragDistance > 40) {
        handlePrev();
      }
    }
    setDragStartX(null);
    setDragDistance(0);
    setIsDragging(false);
    setIsPaused(false);
  };

  // Auto-advance spotlight every 8 seconds (clean slide without video autoplay)
  useEffect(() => {
    if (spotlightList.length <= 1 || isPaused || isDragging) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % spotlightList.length);
    }, 8000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [spotlightList.length, isPaused, isDragging]);

  if (spotlightList.length === 0 || !current) return null;

  const currentBadge = SEQUENTIAL_BADGES[activeIndex % SEQUENTIAL_BADGES.length];
  const BadgeIcon = currentBadge.icon;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        if (isDragging) onMouseUp();
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`relative w-full h-[88svh] sm:h-[90svh] min-h-[560px] sm:min-h-[600px] max-h-[880px] flex flex-col justify-end pb-12 sm:pb-20 lg:pb-24 px-4 sm:px-8 lg:px-12 overflow-hidden select-none group transition-all duration-300 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* ─── High-Res Cinematic Backdrop ─── */}
      <div
        className="absolute inset-0 z-0 h-full w-full pointer-events-none transition-transform duration-500 ease-out"
        style={{
          transform: isDragging ? `translateX(${dragDistance * 0.4}px)` : "translateX(0px)",
        }}
      >
        <SmartImage
          key={current.id}
          src={backdropUrl}
          alt={displayTitle}
          fallbackType="backdrop"
          containerClassName="w-full h-full"
          className="h-full w-full object-cover object-center transition-all duration-700"
        />
      </div>

      {/* ─── Seamless Cinematic Gradient Overlays ─── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c]/90 via-[#0a0a0c]/40 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-24 sm:h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />

      {/* ─── Hero Content Info (Left Side) ─── */}
      <div className="relative z-20 max-w-2xl flex flex-col gap-2.5 sm:gap-3.5 items-start pointer-events-auto pb-4 sm:pb-0">
        {/* Mobile Top Badge Tag */}
        <div className="inline-flex sm:hidden items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-white/15 backdrop-blur-xl text-[11px] font-semibold text-white shadow-lg">
          <span className={`flex items-center justify-center h-3.5 w-3.5 rounded-full bg-gradient-to-tr ${currentBadge.gradient} text-white shrink-0`}>
            <BadgeIcon className="h-2 w-2" />
          </span>
          <span>{currentBadge.label}</span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none drop-shadow-2xl">
            {displayTitle}
          </h1>
        </div>

        {/* Metadata Row (★ 9.0 • 2026 • Movie • Action • [ R ]) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-semibold text-zinc-300 flex-wrap">
          {/* Red Star + Rating */}
          <span className="flex items-center gap-1 text-[#E50914] font-black">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{rating}</span>
          </span>

          <span className="text-zinc-500 font-bold">&bull;</span>

          {/* Release Year */}
          <span>{year}</span>

          <span className="text-zinc-500 font-bold">&bull;</span>

          {/* Media Type */}
          <span>
            {isAnime ? "Anime" : mediaType === "tv" ? "TV Show" : "Movie"}
          </span>

          <span className="text-zinc-500 font-bold">&bull;</span>

          {/* Genre */}
          <span>{genreName}</span>

          <span className="text-zinc-500 font-bold">&bull;</span>

          {/* Age Rating Badge */}
          <span className="px-1.5 py-0.5 rounded border border-zinc-600 bg-black/40 text-[10px] sm:text-xs font-mono font-bold text-zinc-200">
            {isAnime ? "PG-13" : mediaType === "tv" ? "TV-MA" : "R"}
          </span>
        </div>

        {/* Synopsis */}
        <p className="text-zinc-300 text-xs sm:text-sm lg:text-[15px] max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-3 font-normal drop-shadow-md">
          {current.overview ||
            "An extraordinary journey where danger and high-stakes choices test loyalties to the absolute limit."}
        </p>

        {/* Action Buttons & Indicator Row */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pt-1 w-full sm:w-auto">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href={`/watch/${current.id}?type=${mediaType}&play=true`}
              onClick={() => audioFX.playClick()}
              className="px-6 sm:px-8 py-2 sm:py-2.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5 sm:h-5 sm:w-5 fill-current" />
              <span>Play</span>
            </Link>

            <Link
              href={`/watch/${current.id}?type=${mediaType}`}
              onClick={() => audioFX.playClick()}
              className="px-4 sm:px-7 py-2 sm:py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white font-semibold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 backdrop-blur-xl transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Info className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-zinc-300" />
              <span>More info</span>
            </Link>
          </div>

          {/* Mobile Dash Line Indicators (Inline with buttons on mobile) */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            {Array.from({ length: 5 }).map((_, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={`dash_mob_${idx}`}
                  type="button"
                  onClick={() => {
                    audioFX.playClick();
                    setActiveIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "w-6 h-1.5 rounded-full bg-white shadow-md shadow-white/50"
                      : "w-3 h-1.5 rounded-full bg-white/30"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Desktop Right Side Feature Badges & Exactly 5 Dash Indicators ─── */}
      <div className="hidden sm:flex absolute right-4 sm:right-8 lg:right-12 bottom-16 sm:bottom-20 lg:bottom-24 z-20 flex-col items-end gap-4 pointer-events-auto">
        {/* Dynamic Sequential Badge based on active slide */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-xl text-xs font-semibold text-white shadow-xl animate-in fade-in duration-300">
            <span className={`flex items-center justify-center h-4 w-4 rounded-full bg-gradient-to-tr ${currentBadge.gradient} text-white shrink-0`}>
              <BadgeIcon className="h-2.5 w-2.5" />
            </span>
            <span>{currentBadge.label}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl text-xs font-medium text-zinc-300 shadow-md">
            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-gradient-to-tr from-[#E50914] to-pink-500 text-white shrink-0">
              <Megaphone className="h-2.5 w-2.5" />
            </span>
            <span>Spotlight</span>
          </div>
        </div>

        {/* Exactly 5 Carousel Progress Dash Lines (—— — — — —) */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={`dash_${idx}`}
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  setActiveIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "w-8 sm:w-10 h-1.5 rounded-full bg-white shadow-md shadow-white/50"
                    : "w-4 sm:w-5 h-1.5 rounded-full bg-white/30 hover:bg-white/60"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
