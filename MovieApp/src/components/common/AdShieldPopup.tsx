"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, ShieldAlert, ExternalLink, Sparkles } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

const DISMISSED_KEY = "lantawon_adshield_dismissed_v1";

// Accurate Vector SVGs for Brave and uBlock Origin
function BraveLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="braveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7638" />
          <stop offset="100%" stopColor="#FF1800" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#braveGrad)" />
      {/* Brave Lion Silhouette */}
      <path
        d="M16 6L21.5 9.5L24 14.5L22 17.5L23.5 21L19.5 24L16 26L12.5 24L8.5 21L10 17.5L8 14.5L10.5 9.5L16 6Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M16 9.5L19 12L20.5 15.5L18.5 17L16 18.5L13.5 17L11.5 15.5L13 12L16 9.5Z"
        fill="#FF2A00"
      />
      <path
        d="M14.5 13.5L16 14.5L17.5 13.5L16.8 15L16 15.8L15.2 15L14.5 13.5Z"
        fill="white"
      />
      <path
        d="M13.5 20L16 22.5L18.5 20L16 21.2L13.5 20Z"
        fill="white"
      />
    </svg>
  );
}

function UBlockOriginLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#800000" />
      {/* uBlock Shield Shape */}
      <path
        d="M16 7L23 10V16C23 20.5 20 23.8 16 25C12 23.8 9 20.5 9 16V10L16 7Z"
        fill="white"
      />
      {/* 'uo' text emblem inside shield */}
      <path
        d="M13 13V16.5C13 17.5 13.5 18 14.5 18C15.5 18 16 17.5 16 16.5V13H14.5V16.2C14.5 16.8 14.3 17 13.8 17C13.3 17 13.1 16.8 13.1 16.2V13H13Z"
        fill="#800000"
      />
      <circle cx="18.5" cy="15.5" r="2.2" stroke="#800000" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function AdShieldPopup() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Show only on Landing page (/), Login (/login), and Signup (/signup)
  const isTargetPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  useEffect(() => {
    setMounted(true);
    // Check if dismissed in this session
    try {
      const dismissed = sessionStorage.getItem(DISMISSED_KEY);
      if (!dismissed) {
        // Small delay for smooth entry animation
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [pathname]);

  const handleDismiss = () => {
    audioFX.playClick();
    setIsVisible(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch {}
  };

  if (!mounted || !isTargetPage || !isVisible) {
    return null;
  }

  return (
    <aside
      role="complementary"
      aria-label="Ad blocker recommendations"
      className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950/90 border border-white/15 backdrop-blur-xl shadow-2xl shadow-black/80 p-4 sm:p-5 text-white">
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -left-10 w-36 h-36 bg-[#E50914]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top row: Title + Close Button */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#E50914] animate-ping" />
            <h4 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Before clicking any link or video!
            </h4>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close notification"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Subtext description */}
        <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed mb-3.5">
          Third-party streaming servers may contain intrusive redirects. Use{" "}
          <strong className="text-white font-semibold">Brave</strong> or{" "}
          <strong className="text-white font-semibold">uBlock Origin</strong> to stop unwanted popups and ads.
        </p>

        {/* Action Buttons with Official Image Logos */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline-block">
            Get recommended protection:
          </span>

          {/* Brave Browser Link Button */}
          <a
            href="https://brave.com/download/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => audioFX.playClick()}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#FF5000] to-[#E51800] hover:from-[#FF6014] hover:to-[#F52008] text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <BraveLogo className="h-4 w-4 shrink-0 drop-shadow" />
            <span>Brave</span>
            <ExternalLink className="h-3 w-3 opacity-70 ml-0.5" />
          </a>

          {/* uBlock Origin Link Button */}
          <a
            href="https://ublockorigin.com/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => audioFX.playClick()}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#800000] to-[#5a0000] hover:from-[#990000] hover:to-[#6e0000] border border-red-500/30 text-white text-xs sm:text-sm font-semibold shadow-md shadow-red-950/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <UBlockOriginLogo className="h-4 w-4 shrink-0 drop-shadow" />
            <span>uBlock Origin</span>
            <ExternalLink className="h-3 w-3 opacity-70 ml-0.5" />
          </a>
        </div>
      </div>
    </aside>
  );
}
