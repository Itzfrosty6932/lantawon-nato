"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Heart,
  Clock,
  BarChart2,
  X,
  Play,
  Trash2,
  Film,
  Tv,
  Star,
  Flame,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { db } from "@/lib/db/dexie-db";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import type { LibraryItemRecord, WatchHistoryRecord } from "@/types/storage";

// ─── Poster Card (Watchlist / Favorites) ─────────────────────────────────────

function PosterCard({
  item,
  onPlay,
}: {
  item: LibraryItemRecord;
  onPlay: () => void;
}) {
  return (
    <div
      onClick={onPlay}
      className="group relative rounded-xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-zinc-600 transition-all hover:scale-[1.03] hover:shadow-xl"
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative overflow-hidden">
        <SmartImage
          src={
            item.posterPath
              ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.posterPath}`
              : TMDB_IMAGE_CONFIG.FALLBACK_POSTER
          }
          alt={item.title}
          fallbackType="poster"
          containerClassName="w-full h-full"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-[#E50914] flex items-center justify-center shadow-xl">
            <Play className="h-4 w-4 fill-white text-white ml-0.5" />
          </div>
        </div>
        {/* Media type badge */}
        <div className="absolute top-1.5 left-1.5">
          <span className="flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300">
            {item.mediaType === "tv" ? (
              <Tv className="h-2.5 w-2.5" />
            ) : (
              <Film className="h-2.5 w-2.5" />
            )}
            {item.mediaType === "tv" ? "TV" : "FILM"}
          </span>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-2 space-y-0.5">
        <div className="text-[11px] font-bold text-white leading-tight line-clamp-1">
          {item.title}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
          {item.rating && (
            <span className="flex items-center gap-0.5 text-amber-400">
              <Star className="h-2.5 w-2.5 fill-amber-400" />
              {Number(item.rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({
  item,
  onPlay,
  onDelete,
}: {
  item: WatchHistoryRecord;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const pct = item.percentage ?? 0;
  const imgSrc = item.backdropPath
    ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${item.backdropPath}`
    : item.posterPath
    ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.posterPath}`
    : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-zinc-600 transition-all cursor-pointer group">
      {/* Backdrop thumbnail */}
      <div className="relative w-20 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
        <SmartImage
          src={imgSrc}
          alt={item.title}
          fallbackType="backdrop"
          containerClassName="w-full h-full"
          className="w-full h-full object-cover"
        />
        <div
          onClick={onPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Play className="h-4 w-4 fill-white text-white" />
        </div>
        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
          <div
            className="h-full bg-[#E50914] rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={onPlay}>
        <div className="text-xs font-semibold text-white truncate leading-tight">
          {item.title}
        </div>
        <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
          {item.mediaType === "tv" && item.season && item.episode ? (
            <span>
              S{item.season} · E{item.episode}
            </span>
          ) : (
            <span>Movie</span>
          )}
          <span>·</span>
          <span className="text-zinc-400">{pct}% watched</span>
          <span>·</span>
          <span>{timeAgo(item.lastWatchedAt)}</span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
        title="Remove"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────

function StatsPanel({
  watchlist,
  favorites,
  history,
}: {
  watchlist: LibraryItemRecord[];
  favorites: LibraryItemRecord[];
  history: WatchHistoryRecord[];
}) {
  const totalWatchedMins = history.reduce((acc, h) => {
    const est = h.mediaType === "movie" ? 105 : 45;
    return acc + (est * (h.percentage ?? 0)) / 100;
  }, 0);

  const hours = Math.floor(totalWatchedMins / 60);
  const mins = Math.round(totalWatchedMins % 60);

  const completed = history.filter((h) => (h.percentage ?? 0) >= 90).length;

  const topTitles = [...history]
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
    .slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Big stats */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          {
            label: "Total Tracked",
            value: watchlist.length + favorites.length + history.length,
            icon: <BarChart2 className="h-3.5 w-3.5 text-violet-400" />,
            color: "text-white",
          },
          {
            label: "Completed",
            value: completed,
            icon: <Flame className="h-3.5 w-3.5 text-emerald-400" />,
            color: "text-emerald-400",
          },
          {
            label: "Watchlist",
            value: watchlist.length,
            icon: <Bookmark className="h-3.5 w-3.5 text-cyan-400" />,
            color: "text-cyan-400",
          },
          {
            label: "Favorites",
            value: favorites.length,
            icon: <Heart className="h-3.5 w-3.5 text-rose-400" />,
            color: "text-rose-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-1"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              {s.icon} {s.label}
            </div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Watch time estimate */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-amber-400 shrink-0" />
        <div>
          <div className="text-[10px] text-zinc-500">Estimated Watch Time</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {hours > 0 ? `${hours}h ` : ""}{mins}m total
          </div>
        </div>
      </div>

      {/* Top titles */}
      {topTitles.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold px-1">
            Most Watched
          </div>
          {topTitles.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2"
            >
              <span className="text-[11px] font-mono text-zinc-600 w-4 shrink-0">
                #{i + 1}
              </span>
              <span className="text-xs text-white flex-1 truncate">{t.title}</span>
              <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                {t.percentage ?? 0}%
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-zinc-600 text-center pt-1">
        All data is stored locally on your device. Never shared.
      </p>
    </div>
  );
}

// ─── Main LibraryDrawer ───────────────────────────────────────────────────────

export function LibraryDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "watchlist" | "favorites" | "history" | "stats"
  >("watchlist");
  const [watchlistItems, setWatchlistItems] = useState<LibraryItemRecord[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<LibraryItemRecord[]>([]);
  const [historyItems, setHistoryItems] = useState<WatchHistoryRecord[]>([]);

  const loadData = async () => {
    try {
      await db.migrateFromLocalStorage();
      const allLibrary = await db.libraryItems.toArray();
      setWatchlistItems(allLibrary.filter((i) => i.inWatchlist));
      setFavoriteItems(allLibrary.filter((i) => i.isFavorite));
      const allHistory = await db.watchHistory
        .orderBy("lastWatchedAt")
        .reverse()
        .toArray();
      setHistoryItems(allHistory);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNavigate = (url: string) => {
    onClose();
    audioFX.playClick();
    router.push(url);
  };

  const handleClearTab = async () => {
    audioFX.playPop();
    if (activeTab === "watchlist") {
      await db.libraryItems.filter((i) => i.inWatchlist).modify({ inWatchlist: false });
      setWatchlistItems([]);
      showToast("Watchlist cleared", "info");
    } else if (activeTab === "favorites") {
      await db.libraryItems.filter((i) => i.isFavorite).modify({ isFavorite: false });
      setFavoriteItems([]);
      showToast("Favorites cleared", "info");
    } else if (activeTab === "history") {
      await db.clearAllHistory();
      setHistoryItems([]);
      showToast("Watch history cleared", "info");
    }
    loadData();
  };

  const tabs = [
    { id: "watchlist", label: "Watchlist", icon: Bookmark, count: watchlistItems.length },
    { id: "favorites", label: "Favorites", icon: Heart, count: favoriteItems.length },
    { id: "history", label: "History", icon: Clock, count: historyItems.length },
    { id: "stats", label: "Stats", icon: BarChart2 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-950 border-l border-white/10 flex flex-col h-full shadow-modal animate-in slide-in-from-right duration-300"
      >
        {/* ── Header ── */}
        <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2 font-heading font-bold text-white text-sm">
            <Bookmark className="h-4 w-4 text-zinc-300" /> My Library &amp; History
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigate("/library")}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> Full Library
            </button>
            <button
              onClick={() => { audioFX.playClick(); onClose(); }}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-white/[0.08] p-1.5 gap-1 bg-zinc-950 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { audioFX.playClick(); setActiveTab(tab.id as typeof activeTab); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] font-mono opacity-80">({tab.count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content Body ── */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {/* Watchlist — 2-col poster grid */}
          {activeTab === "watchlist" && (
            <>
              {watchlistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Bookmark className="h-10 w-10 text-zinc-700" />
                  <div className="text-sm font-bold text-zinc-500">Your watchlist is empty</div>
                  <p className="text-xs text-zinc-600 max-w-[200px]">
                    Click the bookmark icon on any title to add it here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {watchlistItems.map((item) => (
                    <PosterCard
                      key={item.id}
                      item={item}
                      onPlay={() =>
                        handleNavigate(`/watch/${item.id}?type=${item.mediaType}`)
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Favorites — 2-col poster grid */}
          {activeTab === "favorites" && (
            <>
              {favoriteItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Heart className="h-10 w-10 text-zinc-700" />
                  <div className="text-sm font-bold text-zinc-500">No favorites yet</div>
                  <p className="text-xs text-zinc-600 max-w-[200px]">
                    Heart any title to save it here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {favoriteItems.map((item) => (
                    <PosterCard
                      key={item.id}
                      item={item}
                      onPlay={() =>
                        handleNavigate(`/watch/${item.id}?type=${item.mediaType}`)
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* History — enhanced list */}
          {activeTab === "history" && (
            <>
              {historyItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Clock className="h-10 w-10 text-zinc-700" />
                  <div className="text-sm font-bold text-zinc-500">No watch history yet</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((item) => (
                    <HistoryRow
                      key={item.id}
                      item={item}
                      onPlay={() =>
                        handleNavigate(
                          `/watch/${item.mediaId}?type=${item.mediaType}&season=${item.season || 1}&episode=${item.episode || 1}`
                        )
                      }
                      onDelete={async () => {
                        audioFX.playPop();
                        await db.watchHistory.delete(item.id);
                        setHistoryItems((prev) => prev.filter((h) => h.id !== item.id));
                        showToast("Removed from history", "info");
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Stats panel */}
          {activeTab === "stats" && (
            <StatsPanel
              watchlist={watchlistItems}
              favorites={favoriteItems}
              history={historyItems}
            />
          )}
        </div>

        {/* ── Footer ── */}
        {activeTab !== "stats" && (
          <div className="p-3 border-t border-white/10 bg-zinc-900/40 flex justify-between items-center text-xs shrink-0">
            <span className="text-zinc-500">Local-First Storage</span>
            <button
              onClick={handleClearTab}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Tab
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
