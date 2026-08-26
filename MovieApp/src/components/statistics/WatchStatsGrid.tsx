"use client";

import React from "react";
import {
  Clock,
  Eye,
  Heart,
  Star,
  Film,
  Tv,
  Sparkles,
  CheckCircle2,
  HardDrive,
  BarChart2,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-cyan-400",
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-[#18191a] border border-zinc-800/80 p-4 space-y-1.5 shadow-sm">
      <div
        className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest ${color}`}
      >
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="font-heading text-2xl font-extrabold text-white">{value}</div>
      {sub && <div className="text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}

export function GenreBar({
  label,
  pct,
  count,
}: {
  label: string;
  pct: number;
  count: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-300 font-semibold">{label}</span>
        <span className="text-zinc-500 text-[10px]">{count} titles</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-amber-500 transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface WatchStatsGridProps {
  totalHours: number;
  totalDays: string;
  historyLength: number;
  completed: number;
  favCount: number;
  watchlistCount: number;
  avgRating: string;
  moviesWatched: number;
  tvWatched: number;
  animeWatched: number;
  completionRate: number;
  localSizeGB: string;
  localLength: number;
  topGenres: [string, number][];
  maxGenreCount: number;
}

export function WatchStatsGrid({
  totalHours,
  totalDays,
  historyLength,
  completed,
  favCount,
  watchlistCount,
  avgRating,
  moviesWatched,
  tvWatched,
  animeWatched,
  completionRate,
  localSizeGB,
  localLength,
  topGenres,
  maxGenreCount,
}: WatchStatsGridProps) {
  return (
    <div className="space-y-5">
      {/* Big Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Watch Time"
          value={`${totalHours}h`}
          sub={`≈ ${totalDays} days`}
          icon={Clock}
          color="text-white"
        />
        <StatCard
          label="Titles Watched"
          value={historyLength}
          sub={`${completed} completed`}
          icon={Eye}
          color="text-emerald-400"
        />
        <StatCard
          label="Favorites"
          value={favCount}
          sub={`${watchlistCount} in watchlist`}
          icon={Heart}
          color="text-rose-400"
        />
        <StatCard
          label="Avg Rating"
          value={avgRating}
          sub="across your library"
          icon={Star}
          color="text-amber-400"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Movies"
          value={moviesWatched}
          icon={Film}
          color="text-blue-400"
        />
        <StatCard
          label="TV Series"
          value={tvWatched}
          icon={Tv}
          color="text-amber-400"
        />
        <StatCard
          label="Anime"
          value={animeWatched}
          icon={Sparkles}
          color="text-pink-400"
        />
      </div>

      {/* Completion Rate + Local Storage Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#18191a] border border-zinc-800/80 p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Completion Rate</span>
          </div>
          <div className="flex items-end gap-3">
            <div className="font-heading text-4xl font-extrabold text-white">
              {completionRate}%
            </div>
            <div className="text-xs text-zinc-400 pb-1">
              {completed} of {historyLength} titles finished
            </div>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-[#18191a] border border-zinc-800/80 p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
            <HardDrive className="h-4 w-4 text-cyan-400" />
            <span>Local Vault Storage</span>
          </div>
          <div className="flex items-end gap-3">
            <div className="font-heading text-4xl font-extrabold text-white">
              {localSizeGB} <span className="text-lg text-zinc-400">GB</span>
            </div>
          </div>
          <div className="text-xs text-zinc-400">
            {localLength} locally indexed video files
          </div>
        </div>
      </div>

      {/* Genre breakdown */}
      {topGenres.length > 0 && (
        <div className="rounded-2xl bg-[#18191a] border border-zinc-800/80 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
            <BarChart2 className="h-4 w-4 text-[#E50914]" />
            <span>Genre Taste Profile</span>
          </div>
          <div className="space-y-3">
            {topGenres.map(([genre, count]) => (
              <GenreBar
                key={genre}
                label={genre}
                count={count}
                pct={Math.round((count / maxGenreCount) * 100)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
