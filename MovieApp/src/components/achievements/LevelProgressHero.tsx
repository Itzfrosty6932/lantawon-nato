"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Zap, Sparkles, Flame, Gift, ArrowRight } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { useAuth } from "@/context/AuthContext";
import { StreakService, type DailyStreakInfo } from "@/lib/services/streak-service";
import { StreakModal } from "@/components/gamification/StreakModal";

interface LevelProgressHeroProps {
  progression: {
    level: number;
    rank: string;
    rankTier: string;
    rankColor: string;
    currentLevelXp: number;
    xpNeeded: number;
    progressPct: number;
    totalXp: number;
  };
  unlockedCount: number;
  totalCount: number;
  unclaimedCount: number;
  onClaimAll: () => void;
}

export function LevelProgressHero({
  progression,
  unlockedCount,
  totalCount,
  unclaimedCount,
  onClaimAll,
}: LevelProgressHeroProps) {
  const { user } = useAuth();
  const userId = user?.isLoggedIn && user.role !== "guest" ? user.id : "anonymous";
  const [streakData, setStreakData] = useState<DailyStreakInfo | null>(null);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  useEffect(() => {
    StreakService.getStreakInfo(userId).then(setStreakData);
  }, [userId]);

  const streak = streakData?.currentStreak || 0;
  const isHot = streak > 0 || streakData?.hasWatchedToday;

  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-[#1c1d1e] via-[#18191a] to-black border border-zinc-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Left: Level & Title */}
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-[#E50914] to-red-900 border border-red-500/40 flex flex-col items-center justify-center text-white shadow-xl shrink-0">
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-200 uppercase">
                LEVEL
              </span>
              <span className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
                {progression.level}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
                  {progression.rank}
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border bg-[#242526] ${progression.rankColor} border-zinc-700/80`}
                >
                  {progression.rankTier}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {progression.totalXp.toLocaleString()} Total XP Accumulated Across All Media
              </p>
            </div>
          </div>

          {/* Right: Streak Flame + Unlocked Count + Claim All */}
          <div className="flex items-center gap-3 flex-wrap self-start md:self-center">
            {/* Daily Watch Streak Box */}
            <button
              type="button"
              onClick={() => {
                audioFX.playPop();
                setIsStreakModalOpen(true);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer group ${
                isHot
                  ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/50 text-white shadow-lg shadow-orange-500/20 hover:scale-105"
                  : "bg-[#242526] border-zinc-700/80 text-zinc-400 hover:text-white"
              }`}
            >
              <Flame
                className={`h-5 w-5 ${
                  isHot
                    ? "text-orange-500 fill-orange-500 animate-pulse"
                    : "text-zinc-500 fill-zinc-600"
                }`}
              />
              <div className="text-left">
                <div className="text-[9px] font-mono font-bold uppercase text-orange-400">
                  Daily Streak
                </div>
                <div className="text-xs font-black font-mono text-white">
                  {streak} {streak === 1 ? "Day" : "Days"} 🔥
                </div>
              </div>
            </button>

            <div className="rounded-2xl bg-[#242526] border border-zinc-700/80 px-4 py-2.5 text-center">
              <div className="text-[10px] font-mono text-zinc-400 uppercase">Completed</div>
              <div className="text-sm font-bold text-white font-mono">
                {unlockedCount} / {totalCount}
              </div>
            </div>

            {unclaimedCount > 0 && (
              <button
                onClick={() => {
                  audioFX.playClick();
                  onClaimAll();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#E50914] hover:bg-red-600 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/40 animate-pulse cursor-pointer"
              >
                <Zap className="h-4 w-4 fill-current" />
                <span>Claim All ({unclaimedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Next Level Progression</span>
            <span className="text-white font-bold">
              {progression.currentLevelXp.toLocaleString()} / {progression.xpNeeded.toLocaleString()} XP (
              {progression.progressPct}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-[#E50914] to-amber-400 transition-all duration-500 shadow-sm"
              style={{ width: `${progression.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
      />
    </>
  );
}
