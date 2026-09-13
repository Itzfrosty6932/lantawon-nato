"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { MediaCard } from "@/components/movie/MediaCard";
import { audioFX } from "@/lib/audio/audio-fx";
import type { MediaItem } from "@/types/media";

interface MediaShelfProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  seeAllHref?: string;
  items: MediaItem[];
  onOpenTrailer?: (id: number | string, type: string, title: string, year: string) => void;
}

export function MediaShelf({
  title,
  subtitle,
  icon: Icon,
  seeAllHref,
  items,
  onOpenTrailer,
}: MediaShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredCardId, setHoveredCardId] = useState<string | number | null>(null);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    audioFX.playClick();
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleCardMouseEnter = (item: MediaItem, e: React.MouseEvent<HTMLDivElement>) => {
    setHoveredCardId(item.id);

    if (scrollRef.current && e.currentTarget) {
      const containerRect = scrollRef.current.getBoundingClientRect();
      const cardRect = e.currentTarget.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      const isTablet = window.innerWidth < 768;
      const expandDelta = isMobile ? 145 : isTablet ? 190 : 210;

      const overflowRight = (cardRect.left + cardRect.width + expandDelta) - containerRect.right;
      if (overflowRight > 0) {
        scrollRef.current.scrollBy({
          left: overflowRight + 32,
          behavior: "smooth",
        });
      }
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-3.5 select-none group/shelf relative">
      {/* ─── Shelf Header with Red Vertical Accent (Screenshots 2 & 3) ─── */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1.5 h-7 sm:h-8 bg-[#E50914] rounded-full shrink-0" />
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-zinc-400 shrink-0" />}
              <span>{title}</span>
            </h2>
            {subtitle && (
              <p className="text-xs text-zinc-400 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {seeAllHref && (
          <Link
            href={seeAllHref}
            onClick={() => audioFX.playClick()}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 shrink-0 whitespace-nowrap ml-auto group/btn shadow-sm"
          >
            <span>See All</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#E50914] transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Horizontal Scrollable Carousel Track with Expanding Cards */}
      <div className="relative">
        {/* Left Navigation Arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Scroll Left"
            className="absolute left-0 top-0 bottom-0 z-30 w-12 sm:w-16 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/90 to-transparent flex items-center justify-start pl-1 text-white/70 hover:text-white opacity-0 group-hover/shelf:opacity-100 transition-all duration-300 cursor-pointer"
          >
            <ChevronLeft className="h-7 w-7 sm:h-9 sm:w-9 transition-transform hover:scale-125 stroke-[2.5]" />
          </button>
        )}

        {/* Right Navigation Arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Scroll Right"
            className="absolute right-0 top-0 bottom-0 z-30 w-12 sm:w-16 bg-gradient-to-l from-[#0D0D0D] via-[#0D0D0D]/90 to-transparent flex items-center justify-end pr-1 text-white/70 hover:text-white opacity-0 group-hover/shelf:opacity-100 transition-all duration-300 cursor-pointer"
          >
            <ChevronRight className="h-7 w-7 sm:h-9 sm:w-9 transition-transform hover:scale-125 stroke-[2.5]" />
          </button>
        )}

        {/* Carousel Track: Unified Fixed Height so All Cards are 100% Pantay with ZERO Vertical Wobble */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none py-3 px-1 scroll-smooth h-[255px] sm:h-[295px] md:h-[315px]"
        >
          {items.map((item, idx) => {
            const isExpanded = hoveredCardId === item.id;

            return (
              <div
                key={`${item.id}_${idx}`}
                onMouseEnter={(e) => handleCardMouseEnter(item, e)}
                onMouseLeave={() => setHoveredCardId(null)}
                className={`shrink-0 h-full transition-[width] duration-300 ease-out ${
                  isExpanded
                    ? "w-[300px] sm:w-[380px] md:w-[420px] z-30"
                    : "w-[155px] sm:w-[190px] md:w-[210px] z-10"
                }`}
              >
                <MediaCard
                  item={item}
                  isExpanded={isExpanded}
                  onOpenTrailer={onOpenTrailer}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
