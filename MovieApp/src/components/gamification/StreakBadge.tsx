"use client";

import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { useAuth } from "@/context/AuthContext";
import { StreakService, type DailyStreakInfo } from "@/lib/services/streak-service";
import { StreakModal } from "@/components/gamification/StreakModal";

export function StreakBadge({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const userId = user?.isLoggedIn && user.role !== "guest" ? user.id : "anonymous";
  const [streakData, setStreakData] = useState<DailyStreakInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refresh = () => {
    StreakService.getStreakInfo(userId).then(setStreakData);
  };

  useEffect(() => {
    refresh();
    // Listen for real-time streak updates from video playback
    const handle = (e: Event) => {
      const ev = e as CustomEvent<DailyStreakInfo>;
      if (ev.detail) setStreakData(ev.detail);
    };
    window.addEventListener("streak_updated", handle);
    return () => window.removeEventListener("streak_updated", handle);
  }, [userId]);

  const streak = streakData?.currentStreak || 0;
  const isHot = streakData?.hasWatchedToday || streak > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          audioFX.playPop();
          setIsModalOpen(true);
        }}
        aria-label={`Daily Watch Streak: ${streak} day${streak !== 1 ? "s" : ""}`}
        title={
          isHot
            ? `🔥 Daily Streak: ${streak} day${streak !== 1 ? "s" : ""} (Active today)`
            : "Daily Streak: Watch for 10s today to ignite your flame!"
        }
        className={`p-2 rounded-full transition-all cursor-pointer relative shrink-0 ${
          isHot
            ? "bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-400 shadow-md shadow-orange-500/20"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-transparent"
        } ${className}`}
      >
        <Flame
          className={`h-4 w-4 transition-all duration-300 ${
            isHot
              ? "text-orange-500 fill-orange-500 animate-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
              : "text-zinc-400 stroke-[1.75]"
          }`}
        />
      </button>

      <StreakModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
