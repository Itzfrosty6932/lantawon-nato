"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Bookmark,
  HardDrive,
  BarChart2,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/db/dexie-db";
import { audioFX } from "@/lib/audio/audio-fx";
import {
  ProfileHeroCard,
  UserProfile,
} from "@/components/statistics/ProfileHeroCard";
import { WatchStatsGrid } from "@/components/statistics/WatchStatsGrid";
import { StatisticsTabViews } from "@/components/statistics/StatisticsTabViews";
import type {
  WatchHistoryRecord,
  LibraryItemRecord,
  LocalScannedMediaRecord,
} from "@/types/storage";

const PROFILE_KEY = "lantawon_profile";

const DEFAULT_PROFILE: UserProfile = {
  name: "Movie Fan",
  bio: "I watch therefore I am.",
  avatarEmoji: "🎬",
  joinedAt: new Date().toISOString(),
  favoriteGenres: [],
  favoriteEra: "",
};

function saveProfile(p: UserProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {}
}

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PROFILE };
}

function computePersona(history: WatchHistoryRecord[], library: LibraryItemRecord[]) {
  const total = history.length;
  const completed = history.filter((h) => h.completed || h.percentage > 85).length;
  const movies = history.filter((h) => h.mediaType === "movie").length;
  const tv = history.filter((h) => h.mediaType === "tv").length;
  const favs = library.filter((l) => l.isFavorite).length;

  if (total === 0)
    return { title: "The New Arrival", emoji: "🌱", desc: "Your cinematic journey starts here." };
  if (completed / Math.max(total, 1) > 0.9)
    return { title: "The Completionist", emoji: "✅", desc: "You never leave a title unfinished." };
  if (favs > 20)
    return { title: "The Connoisseur", emoji: "🏆", desc: "You have refined and discriminating taste." };
  if (tv > movies * 2)
    return { title: "The Binge-Watcher", emoji: "📺", desc: "Series are your domain." };
  if (movies > tv * 2)
    return { title: "The Cinema Purist", emoji: "🎬", desc: "Cinema is your temple." };
  if (total > 100)
    return { title: "The Film Scholar", emoji: "🎓", desc: "A walking encyclopedia of titles." };
  return {
    title: "The Steady Explorer",
    emoji: "🧭",
    desc: "Building your watch history, one title at a time.",
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<UserProfile>(DEFAULT_PROFILE);
  const [showEmojis, setShowEmojis] = useState(false);

  const [history, setHistory] = useState<WatchHistoryRecord[]>([]);
  const [library, setLibrary] = useState<LibraryItemRecord[]>([]);
  const [local, setLocal] = useState<LocalScannedMediaRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"overview" | "history" | "library" | "local">(
    "overview"
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const p = loadProfile();
      setProfile(p);
      setEditDraft(p);

      const hist = await db.watchHistory.orderBy("lastWatchedAt").reverse().toArray();
      setHistory(hist);

      const lib = await db.libraryItems.toArray();
      setLibrary(lib);

      const loc = await db.localScannedMedia.toArray();
      setLocal(loc);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProfile = () => {
    audioFX.playSuccess();
    saveProfile(editDraft);
    setProfile(editDraft);
    setEditing(false);
    setShowEmojis(false);
  };

  const handleCancelProfile = () => {
    audioFX.playPop();
    setEditDraft(profile);
    setEditing(false);
    setShowEmojis(false);
  };

  // Compute stats metrics
  const totalSeconds = history.reduce((acc, h) => acc + (h.currentTime || 0), 0);
  const totalHours = Math.round(totalSeconds / 3600);
  const totalDays = (totalSeconds / 86400).toFixed(1);
  const completed = history.filter((h) => h.completed || (h.percentage || 0) > 85).length;
  const moviesWatched = history.filter((h) => h.mediaType === "movie").length;
  const tvWatched = history.filter((h) => h.mediaType === "tv").length;
  const animeWatched = history.filter((h) => h.mediaType === "anime").length;
  const favCount = library.filter((l) => l.isFavorite).length;
  const watchlistCount = library.filter((l) => l.inWatchlist).length;

  const libraryWithScore = library.filter((l) => l.rating);
  const avgRating = libraryWithScore.length
    ? (
        libraryWithScore.reduce((acc, l) => acc + (l.rating || 0), 0) /
        libraryWithScore.length
      ).toFixed(1)
    : "—";

  const totalLocalBytes = local.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const localSizeGB = (totalLocalBytes / (1024 * 1024 * 1024)).toFixed(1);


  // Genre distribution
  const genreCount: Record<string, number> = {};
  library.forEach((l) =>
    l.genres?.forEach((g) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    })
  );
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxGenreCount = topGenres[0]?.[1] || 1;

  const completionRate = history.length
    ? Math.round((completed / history.length) * 100)
    : 0;

  const persona = computePersona(history, library);

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "history", label: "History", icon: Clock },
    { id: "library", label: "Library", icon: Bookmark },
    { id: "local", label: "Local Files", icon: HardDrive },
  ] as const;

  return (
    <div className="space-y-6 w-full pt-2 pb-24 animate-in fade-in">
      {/* ─── User Profile Hero ─── */}
      <ProfileHeroCard
        profile={profile}
        persona={persona}
        editing={editing}
        editDraft={editDraft}
        showEmojis={showEmojis}
        setEditing={setEditing}
        setEditDraft={setEditDraft}
        setShowEmojis={setShowEmojis}
        onSave={handleSaveProfile}
        onCancel={handleCancelProfile}
      />

      {/* ─── View Tabs ─── */}
      <div className="flex gap-1.5 pb-1 overflow-x-auto scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              audioFX.playClick();
              setActiveTab(id as typeof activeTab);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
              activeTab === id
                ? "bg-white text-zinc-950 shadow-md font-black"
                : "bg-[#242526] text-zinc-300 border border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
          <span className="text-xs">Loading analytics and telemetry…</span>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <WatchStatsGrid
              totalHours={totalHours}
              totalDays={totalDays}
              historyLength={history.length}
              completed={completed}
              favCount={favCount}
              watchlistCount={watchlistCount}
              avgRating={avgRating}
              moviesWatched={moviesWatched}
              tvWatched={tvWatched}
              animeWatched={animeWatched}
              completionRate={completionRate}
              localSizeGB={localSizeGB}
              localLength={local.length}
              topGenres={topGenres}
              maxGenreCount={maxGenreCount}
            />
          )}

          {/* Subtab Views (History, Library, Local) */}
          {activeTab !== "overview" && (
            <StatisticsTabViews
              activeTab={activeTab}
              history={history}
              library={library}
              local={local}
              watchlistCount={watchlistCount}
              favCount={favCount}
            />
          )}
        </>
      )}
    </div>
  );
}
