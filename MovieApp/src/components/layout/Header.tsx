"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  X,
  Dice5,
  Bookmark,
  ChevronDown,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { db } from "@/lib/db/dexie-db";
import { NotificationsBell } from "@/components/layout/header/NotificationsDropdown";
import {
  SearchAutocompleteDropdown,
  AutocompleteItem,
} from "@/components/layout/header/SearchAutocompleteDropdown";
import { HeaderUserMenu } from "@/components/layout/header/HeaderUserMenu";
import { HeaderShortcutsModal } from "@/components/layout/header/HeaderShortcutsModal";
import { DiscoverMegaMenu } from "@/components/layout/header/DiscoverMegaMenu";
import { RegionSwitcher } from "@/components/layout/header/RegionSwitcher";
import { StreakBadge } from "@/components/gamification/StreakBadge";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import type { SearchHistoryRecord } from "@/types/storage";

export function Header({ onOpenLibrary }: { onOpenLibrary?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user && user.isLoggedIn === true && user.role !== "guest");
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDiscoverMenuOpen, setIsDiscoverMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryRecord[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([
    "Spider-Man",
    "Deadpool",
    "Oppenheimer",
    "Interstellar",
    "Jujutsu Kaisen",
    "Solo Leveling",
    "Arcane",
    "Batman",
  ]);
  const [isScrolled, setIsScrolled] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Dynamic fetch of trending popular searches
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await fetch("/api/catalog/discover?sort_by=popularity.desc");
        if (res.ok) {
          const data = await res.json();
          const titles: string[] = (data.results || [])
            .map((item: any) => item.title || item.name)
            .filter((t: string) => Boolean(t && t.trim()))
            .slice(0, 8);
          if (titles.length > 0) {
            setPopularSearches(titles);
          }
        }
      } catch {}
    };
    fetchPopular();
  }, []);

  // Scroll listener: shifts background opacity on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load search history
  const loadSearchHistory = async () => {
    try {
      const list = await db.searchHistory.orderBy("timestamp").reverse().limit(6).toArray();
      setSearchHistory(list);
    } catch {}
  };

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const saveToSearchHistory = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await db.addSearchHistory(trimmed);
      loadSearchHistory();
    } catch {}
  };

  const handleDeleteHistoryItem = async (id: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    audioFX.playPop();
    try {
      await db.searchHistory.delete(id);
      loadSearchHistory();
      showToast("Removed from history", "info");
    } catch {}
  };

  const handleClearAllHistory = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    audioFX.playPop();
    try {
      await db.searchHistory.clear();
      setSearchHistory([]);
      showToast("Search history cleared", "info");
    } catch {}
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      const isEditing = tag === "input" || tag === "textarea" || tag === "select";

      if (e.key === "/" && !isEditing) {
        e.preventDefault();
        inputRef.current?.focus();
        showToast("Quick search activated", "info");
      }
      if (e.key === "?" && !isEditing) {
        e.preventDefault();
        setShowShortcuts((p) => !p);
      }
      if (e.key === "Escape") {
        setIsSearchFocused(false);
        setIsUserMenuOpen(false);
        setIsDiscoverMenuOpen(false);
        setShowShortcuts(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showToast]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete fetcher
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    saveToSearchHistory(trimmed);
    setIsSearchFocused(false);
    audioFX.playClick();
    router.push(`/discover?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelectSuggestion = (item: AutocompleteItem) => {
    audioFX.playClick();
    setIsSearchFocused(false);
    saveToSearchHistory(item.title);
    if (item.media_type === "person") {
      router.push(`/person/${item.id}`);
    } else {
      router.push(`/watch/${item.id}?type=${item.media_type || "movie"}`);
    }
  };

  const handleSurpriseMe = async () => {
    audioFX.playPop();
    showToast("Finding an extraordinary title…", "info");
    try {
      const res = await fetch("/api/recommend/mood?mood=thrilling");
      if (res.ok) {
        const data = await res.json();
        const pick = data.results?.[Math.floor(Math.random() * (data.results?.length || 1))];
        if (pick?.id) {
          router.push(`/watch/${pick.id}?type=${pick.media_type || "movie"}`);
          return;
        }
      }
      router.push("/watch/157336?type=movie");
    } catch {
      router.push("/watch/157336?type=movie");
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 select-none">
        <header
          className={`w-full px-4 sm:px-6 lg:px-10 py-3 sm:py-3.5 transition-colors duration-300 flex items-center justify-between ${
            isScrolled
              ? "bg-[#0D0D0D]/95 backdrop-blur-md shadow-lg"
              : "bg-gradient-to-b from-[#0D0D0D]/90 via-[#0D0D0D]/40 to-transparent"
          }`}
        >
          {/* ─── 1. Brand Logo & 7 Primary Header Nav Items ─── */}
          <div className="flex items-center gap-5 lg:gap-8">
            <Link
              href="/home"
              onClick={() => audioFX.playClick()}
              className="group shrink-0"
            >
              <BrandLogo size="md" />
            </Link>

            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs sm:text-sm font-medium text-zinc-300">
              {/* 1. Home */}
              <Link
                href="/home"
                onClick={() => audioFX.playClick()}
                className={`hover:text-white transition-colors ${
                  pathname === "/home" || pathname === "/" ? "text-white font-bold" : "text-zinc-300"
                }`}
              >
                Home
              </Link>

              {/* 2. Explore */}
              <Link
                href="/discover"
                onClick={() => audioFX.playClick()}
                className={`hover:text-white transition-colors ${
                  pathname === "/discover" ? "text-white font-bold" : "text-zinc-300"
                }`}
              >
                Explore
              </Link>

              {/* 3. Shows */}
              <Link
                href="/shows"
                onClick={() => audioFX.playClick()}
                className={`hover:text-white transition-colors ${
                  pathname === "/shows" || pathname === "/series" ? "text-white font-bold" : "text-zinc-300"
                }`}
              >
                Shows
              </Link>

              {/* 4. Discover Mega-Menu Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    audioFX.playPop();
                    setIsDiscoverMenuOpen((prev) => !prev);
                  }}
                  className={`hover:text-white transition-colors flex items-center gap-1 cursor-pointer ${
                    isDiscoverMenuOpen ||
                    pathname.startsWith("/people") ||
                    pathname.startsWith("/studios") ||
                    pathname.startsWith("/where-to-watch") ||
                    pathname.startsWith("/anime") ||
                    pathname.startsWith("/documentaries")
                      ? "text-white font-bold"
                      : "text-zinc-300"
                  }`}
                >
                  <span>Discover</span>
                  <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${isDiscoverMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <DiscoverMegaMenu
                  isOpen={isDiscoverMenuOpen}
                  onClose={() => setIsDiscoverMenuOpen(false)}
                />
              </div>

              {/* 5. My Library (Only visible for authenticated user account, strictly hidden in guest mode) */}
              {isAuthenticated && (
                <Link
                  href="/library"
                  onClick={() => audioFX.playClick()}
                  className={`hover:text-white transition-colors ${
                    pathname.startsWith("/library") ? "text-white font-bold" : "text-zinc-300"
                  }`}
                >
                  My Library
                </Link>
              )}
            </nav>
          </div>

          {/* ─── 2. Search Bar, Region Switcher & Utilities ─── */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Real-time Search Input */}
            <div ref={searchContainerRef} className="relative">
              {/* Mobile Search Icon Button (< lg) */}
              <button
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  setIsSearchFocused(true);
                }}
                className="lg:hidden h-8 w-8 rounded-lg bg-[#242526] hover:bg-[#3a3b3c] flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer border border-zinc-700/80 shrink-0"
                aria-label="Open Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Desktop Global Search Bar (≥ lg) */}
              <div className="hidden lg:flex items-center relative w-56 xl:w-72">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search"
                  className="w-full bg-[#181818] border border-zinc-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-[#E31937] focus:ring-1 focus:ring-[#E31937] transition-all font-medium"
                />
                <Search className="absolute left-3 h-4 w-4 text-zinc-400 pointer-events-none" />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="absolute right-2.5 text-zinc-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Live Autocomplete / History Dropdown */}
              {isSearchFocused && (
                <SearchAutocompleteDropdown
                  query={query}
                  setQuery={setQuery}
                  inputRef={inputRef}
                  suggestions={suggestions}
                  searchHistory={searchHistory}
                  popularSearches={popularSearches}
                  onSelectSuggestion={handleSelectSuggestion}
                  onSelectHistoryItem={(text) => {
                    setQuery(text);
                    router.push(`/discover?q=${encodeURIComponent(text)}`);
                    setIsSearchFocused(false);
                  }}
                  onDeleteHistoryItem={handleDeleteHistoryItem}
                  onClearAllHistory={handleClearAllHistory}
                  onSubmit={handleSubmit}
                  onClose={() => setIsSearchFocused(false)}
                />
              )}
            </div>

            {/* Region Switcher (🌐 PH) */}
            <RegionSwitcher />

            {/* Authenticated User Utilities vs Clean Guest Mode */}
            {isAuthenticated ? (
              <>
                {/* Daily Watch Streak Flame Badge */}
                <StreakBadge />

                {/* Bookmark / Library Button */}
                {onOpenLibrary && (
                  <button
                    type="button"
                    onClick={() => {
                      audioFX.playClick();
                      onOpenLibrary();
                    }}
                    className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#242526] hover:bg-[#3a3b3c] items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer border border-zinc-700/80 shrink-0"
                    title="My Library & Watchlist"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                )}

                {/* Notifications Bell — with dropdown panel */}
                <NotificationsBell />

                {/* User Profile Avatar Menu */}
                <HeaderUserMenu
                  userMenuRef={userMenuRef}
                  isOpen={isUserMenuOpen}
                  onToggle={() => setIsUserMenuOpen((p) => !p)}
                  onClose={() => setIsUserMenuOpen(false)}
                  onOpenShortcuts={() => setShowShortcuts(true)}
                />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  onClick={() => audioFX.playClick()}
                  className="hidden sm:inline-flex bg-[#E31937] hover:bg-[#ff1f3d] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 rounded-lg transition-all shadow-md shadow-[#E31937]/25 hover:scale-105"
                >
                  Sign In
                </Link>
                {/* Guest User Menu */}
                <HeaderUserMenu
                  userMenuRef={userMenuRef}
                  isOpen={isUserMenuOpen}
                  onToggle={() => setIsUserMenuOpen((p) => !p)}
                  onClose={() => setIsUserMenuOpen(false)}
                  onOpenShortcuts={() => setShowShortcuts(true)}
                />
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <HeaderShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
  </>
  );
}
