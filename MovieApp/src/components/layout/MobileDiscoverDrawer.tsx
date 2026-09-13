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
  const prevPathnameRef = React.useRef(pathname);

  // Auto-close ONLY on actual route navigation
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Lock background scroll completely when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end select-none pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Discovery Catalogs Menu"
    >
      {/* ─── Backdrop Blur Overlay ─── */}
      <div
        onClick={() => {
          audioFX.playClick();
          onClose();
        }}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] animate-in fade-in duration-200 cursor-pointer"
      />

      {/* ─── Slide-Up Bottom Sheet (Reaches near header, rounded top corners) ─── */}
      <div className="relative z-[101] w-full max-h-[calc(100svh-4.5rem)] sm:max-h-[calc(100svh-5rem)] h-[84svh] bg-[#121316] border-t border-x border-white/15 rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Top Centered Drag Handle Pill */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-3 mb-1 shrink-0" />

        {/* ─── Header Bar ─── */}
        <div className="w-full px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#121316] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shadow-md">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Discovery
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                Taxonomy, Studios, People &amp; Catalogs
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              onClose();
            }}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
            aria-label="Close Discovery"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ─── Scrollable Body ─── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-24 overscroll-contain">
          {/* ── 1. People & Creators ── */}
          <div className="p-4 rounded-2xl bg-[#141518] border border-white/10 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E50914]">
              <Users className="h-4 w-4" />
              <span>People &amp; Creators</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Explore filmographies, directors, and actors.
            </p>
            <div className="space-y-1.5 pt-1">
              <Link
                href="/people"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>All Popular People</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link
                href="/people?role=actor"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Actors &amp; Voice Stars</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link
                href="/people?role=director"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Directors &amp; Filmmakers</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link
                href="/people?role=writer"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Writers &amp; Authors</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
            </div>
          </div>

          {/* ── 2. Studios & Networks ── */}
          <div className="p-4 rounded-2xl bg-[#141518] border border-white/10 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Building2 className="h-4 w-4" />
              <span>Studios &amp; Networks</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Browse productions by major studios &amp; broadcasters.
            </p>
            <div className="space-y-1.5 pt-1">
              <Link
                href="/studios"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Production Studios</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link
                href="/networks"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Broadcasters &amp; Networks</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link
                href="/where-to-watch"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Where to Watch Hub</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link
                href="/studios?region=ph"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Local Pinoy Cinema</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
            </div>
          </div>

          {/* ── 3. Specialty Catalogs ── */}
          <div className="p-4 rounded-2xl bg-[#141518] border border-white/10 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span>Specialty Catalogs</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Specialized cinema media classifications.
            </p>
            <div className="space-y-1.5 pt-1">
              <Link
                href="/anime"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Anime &amp; Manga Media</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link
                href="/asian-cinema"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Asian Cinema &amp; K-Dramas</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link
                href="/cartoons"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Cartoons &amp; Western Animation</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link
                href="/documentaries"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all"
              >
                <span>Documentaries &amp; Real Life</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
