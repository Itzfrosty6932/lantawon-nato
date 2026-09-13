"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Tv,
  Layers,
  Sparkles,
  Flame,
  Globe2,
  Clapperboard,
  Film,
  Compass,
  FileText,
  Smile,
  ChevronRight,
  X,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface DiscoverMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiscoverMegaMenu({ isOpen, onClose }: DiscoverMegaMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Lock background scroll if in mobile/fullscreen fallback
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-3 w-[780px] max-w-[calc(100vw-32px)] bg-[#121316]/98 backdrop-blur-2xl border border-white/15 rounded-2xl p-6 shadow-2xl z-50 text-left animate-in fade-in zoom-in-95 duration-150 select-none"
      style={{
        boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(229,9,20,0.15)",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Column 1: People & Creators ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E31937]">
            <Users className="h-4 w-4" />
            <span>People &amp; Creators</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Explore filmographies, directors, and actors.
          </p>
          <div className="space-y-1">
            <Link
              href="/people"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>All Popular People</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/people?role=actor"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Actors &amp; Voice Stars</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/people?role=director"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Directors &amp; Filmmakers</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/people?role=writer"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Writers &amp; Authors</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* ── Column 2: Studios & Companies ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
            <Building2 className="h-4 w-4" />
            <span>Studios &amp; Networks</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Browse productions by major studios &amp; TV broadcasters.
          </p>
          <div className="space-y-1">
            <Link
              href="/studios"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Production Studios</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/networks"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Broadcasters &amp; Networks</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/where-to-watch"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Where to Watch Hub</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/studios?region=ph"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Local Pinoy Cinema</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* ── Column 3: Specialty Catalogs ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span>Specialty Catalogs</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Specialized cinema media classifications.
          </p>
          <div className="space-y-1">
            <Link
              href="/anime"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Anime &amp; Manga Media</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/asian-cinema"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Asian Cinema &amp; K-Dramas</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/cartoons"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Cartoons &amp; Western Animation</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/documentaries"
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-all group"
            >
              <span>Documentaries &amp; Real Life</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
