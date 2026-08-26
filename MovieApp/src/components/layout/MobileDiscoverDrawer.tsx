"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Building2,
  Sparkles,
  ChevronRight,
  X,
  Compass,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface MobileDiscoverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDiscoverDrawer({ isOpen, onClose }: MobileDiscoverDrawerProps) {
  const pathname = usePathname();

  // Auto-close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden bg-black/80 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[85vh] bg-[#121212] border-t border-zinc-700/80 rounded-t-3xl p-5 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Drag Indicator */}
        <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4 shrink-0" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#E31937]/15 border border-[#E31937]/30 flex items-center justify-center text-[#E31937]">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-white">Discover &amp; Catalogs</h3>
              <p className="text-[11px] text-zinc-400">Browse taxonomy, studios, people &amp; specialty catalogs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 active:scale-95 transition-all"
            aria-label="Close Discover Drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Categories List */}
        <div className="overflow-y-auto space-y-6 pt-4 pb-12 overscroll-contain">
          {/* ── 1. People & Creators ── */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E31937]">
              <Users className="h-4 w-4" />
              <span>People &amp; Creators</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              <Link
                href="/people"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>All Popular People</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/people?role=actor"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Actors &amp; Voice Stars</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/people?role=director"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Directors &amp; Filmmakers</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/people?role=writer"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Writers &amp; Authors</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* ── 2. Studios & Networks ── */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Building2 className="h-4 w-4" />
              <span>Studios &amp; Networks</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              <Link
                href="/studios"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Production Studios</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/networks"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Broadcasters &amp; Networks</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/where-to-watch"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Where to Watch Hub</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/discover?country=PH"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Local Pinoy Cinema</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* ── 3. Specialty Catalogs ── */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span>Specialty Catalogs</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              <Link
                href="/anime"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Anime &amp; Manga Media</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/discover?country=KR"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Asian Cinema &amp; K-Dramas</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/cartoons"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Cartoons &amp; Western Animation</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/discover?genre=99"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#181818] hover:bg-zinc-800/80 border border-zinc-800/60 transition-all group"
              >
                <span>Documentaries &amp; Real Life</span>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
