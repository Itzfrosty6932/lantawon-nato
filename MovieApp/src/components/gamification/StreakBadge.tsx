"use client";

import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { useAuth } from "@/context/AuthContext";
import { StreakService, type DailyStreakInfo } from "@/lib/services/streak-service";
import { StreakModal } from "@/components/gamification/StreakModal";

export function StreakBadge({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  // Guests and logged-out users share the anonymous local bucket; every
  // signed-in account gets its own strictly scoped streak.
  const userId = user?.isLoggedIn && user.role !== "guest" ? user.id : "anonymous";
  const [streakData, setStreakData] = useState<DailyStreakInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    StreakService.getStreakInfo(userId).then(setStreakData);
  }, [userId]);

  const streak = streakData?.currentStreak || 0;
  const isHot = streak > 0 || streakData?.hasWatchedToday;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          audioFX.playPop();
          setIsModalOpen(true);
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer group ${
          isHot
            ? "bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/40 text-orange-400 shadow-sm shadow-orange-500/30"
            : "bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200"
        } ${className}`}
        title={`Daily Watch Streak: ${streak} Days (Click to open)`}
      >
        <Flame
          className={`h-4 w-4 transition-transform group-hover:scale-110 ${
            isHot
              ? "text-orange-500 fill-orange-500 animate-pulse"
              : "text-zinc-500 fill-zinc-600"
          }`}
        />
        <span className="text-xs font-mono font-black text-white">
          {streak}
        </span>
      </button>

      <StreakModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
