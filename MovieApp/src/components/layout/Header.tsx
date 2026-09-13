"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Bell } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { HeaderUserMenu } from "@/components/layout/header/HeaderUserMenu";
import { DiscoverMegaMenu } from "@/components/layout/header/DiscoverMegaMenu";
import { NotificationsDropdown } from "@/components/layout/header/NotificationsDropdown";
import { StreakBadge } from "@/components/gamification/StreakBadge";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export function Header({ onOpenLibrary }: { onOpenLibrary?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user && user.isLoggedIn === true && user.role !== "guest");

  // Scroll Direction Awareness (Hide on Scroll Down, Show on Scroll Up)
  const isScrolledVisible = useScrollDirection({ threshold: 10, topThreshold: 40 });

  // Dropdown States
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isHeaderVisible = isScrolledVisible || isDiscoverOpen || isNotifOpen || isUserMenuOpen;

  // Hide header completely on See All / Section Catalog views so Back button is at the top
  const isSeeAllMode = Boolean(
    searchParams?.get("section") || searchParams?.get("genre")
  );

  // Refs for outside click handling
  const discoverRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (discoverRef.current && !discoverRef.current.contains(target)) {
        setIsDiscoverOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide header completely on Watch page & See All / Section Catalog views so Back button is unblocked
  if (isSeeAllMode || pathname.startsWith("/watch")) {
    return null;
  }

  const isHomeActive = pathname === "/" || pathname === "/home";
  const isMoviesActive = pathname === "/movies" || pathname === "/movie";
  const isShowsActive = pathname === "/shows" || pathname === "/series" || pathname === "/tv";
  const isAnimeActive = pathname === "/anime";
  const isExploreActive = pathname.startsWith("/discover") && !pathname.includes("country=") && !pathname.includes("genre=");
  const isDiscoveryRouteActive =
    pathname.startsWith("/people") ||
    pathname.startsWith("/studios") ||
    pathname.startsWith("/networks") ||
    pathname.startsWith("/where-to-watch") ||
    pathname.startsWith("/cartoons") ||
    pathname.startsWith("/documentaries") ||
    pathname.startsWith("/asian-cinema");

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out pointer-events-none select-none ${
        isHeaderVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <header className="w-full px-4 sm:px-8 lg:px-12 py-3 sm:py-4 flex items-center justify-between transition-colors duration-300 bg-transparent">
        {/* ─── LEFT: BRAND LOGO (LOGO ONLY, LARGE & PROMINENT) ─── */}
        <div className="flex items-center pointer-events-auto">
          <Link
            href="/home"
            onClick={() => audioFX.playClick()}
            className="flex items-center transition-transform hover:scale-105 active:scale-95"
            aria-label="Lantawon Home"
          >
            <BrandLogo size="lg" />
          </Link>
        </div>

        {/* ─── RIGHT: NAVIGATION & USER ACTION BAR ─── */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <nav className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-[#121316]/90 border border-white/15 backdrop-blur-2xl text-xs sm:text-sm font-medium">
            {/* Desktop Navigation Links (HIDDEN ON TABLET & MOBILE) */}
            <div className="hidden lg:flex items-center gap-1">
              {/* 1. Home */}
              <Link
                href="/home"
                onClick={() => audioFX.playClick()}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  isHomeActive
                    ? "bg-white text-zinc-950 font-bold"
                    : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
                }`}
              >
                <span>Home</span>
              </Link>

              {/* 2. Movies */}
              <Link
                href="/movies"
                onClick={() => audioFX.playClick()}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  isMoviesActive
                    ? "bg-white text-zinc-950 font-bold"
                    : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
                }`}
              >
                <span>Movies</span>
              </Link>

              {/* 3. TV Shows */}
              <Link
                href="/shows"
                onClick={() => audioFX.playClick()}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  isShowsActive
                    ? "bg-white text-zinc-950 font-bold"
                    : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
                }`}
              >
                <span>TV Shows</span>
              </Link>

              {/* 4. Anime */}
              <Link
                href="/anime"
                onClick={() => audioFX.playClick()}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  isAnimeActive
                    ? "bg-white text-zinc-950 font-bold"
                    : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
                }`}
              >
                <span>Anime</span>
              </Link>

              {/* 5. Explore */}
              <Link
                href="/discover"
                onClick={() => audioFX.playClick()}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  isExploreActive
                    ? "bg-white text-zinc-950 font-bold"
                    : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
                }`}
              >
                <span>Explore</span>
              </Link>

              {/* 6. Discovery Mega Dropdown Trigger */}
              <div ref={discoverRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    audioFX.playPop();
                    setIsDiscoverOpen((prev) => !prev);
                    setIsNotifOpen(false);
                    setIsUserMenuOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isDiscoverOpen || isDiscoveryRouteActive
                      ? "bg-white text-zinc-950 font-bold"
                      : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
                  }`}
                >
                  <span>Discovery</span>
                  {isDiscoverOpen ? (
                    <ChevronUp className="h-3 w-3 text-zinc-300" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-zinc-300" />
                  )}
                </button>

                {/* 3-Column Discovery Mega Dropdown */}
                <DiscoverMegaMenu
                  isOpen={isDiscoverOpen}
                  onClose={() => setIsDiscoverOpen(false)}
                />
              </div>

              {/* Subtle Vertical Divider */}
              <div className="h-4 w-px bg-white/20 mx-1 shrink-0" />
            </div>

            {/* ─── SEQUENTIAL ICON ONLY GROUP [Streak, Notification, User] (Always visible on mobile, tablet, and desktop) ─── */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Authenticated Only: Streak & Notifications */}
              {isAuthenticated && (
                <>
                  {/* 1. Streak Icon Button */}
                  <StreakBadge />

                  {/* 2. Notification Bell Dropdown */}
                  <div ref={notifRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        audioFX.playPop();
                        setIsNotifOpen((prev) => !prev);
                        setIsDiscoverOpen(false);
                        setIsUserMenuOpen(false);
                      }}
                      title="Notifications"
                      aria-label="View notifications"
                      className={`p-2 rounded-full transition-all cursor-pointer relative ${
                        isNotifOpen
                          ? "bg-white/20 text-white"
                          : "text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95"
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                      {/* Unread indicator dot */}
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E50914] ring-2 ring-[#121316] animate-pulse" />
                    </button>

                    <NotificationsDropdown
                      isOpen={isNotifOpen}
                      onClose={() => setIsNotifOpen(false)}
                      dropdownRef={notifRef}
                    />
                  </div>
                </>
              )}

              {/* 3. User Avatar Profile Menu */}
              <HeaderUserMenu
                userMenuRef={userMenuRef}
                isOpen={isUserMenuOpen}
                onToggle={() => {
                  setIsUserMenuOpen((p) => !p);
                  setIsDiscoverOpen(false);
                  setIsNotifOpen(false);
                }}
                onClose={() => setIsUserMenuOpen(false)}
              />
            </div>
          </nav>
        </div>
      </header>
    </div>
  );
}
