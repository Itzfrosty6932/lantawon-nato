"use client";

import React, { useState, useEffect } from "react";
import { Flame, X } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  StreakService,
  type DailyStreakInfo,
} from "@/lib/services/streak-service";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Milestone color ladder. Each tier the streak crosses recolors the flame
 * and accent. Beyond 1000 days every +1000 keeps the deepest tier.
 */
const MILESTONES: { days: number; name: string; hex: string; soft: string }[] = [
  { days: 0, name: "Spark", hex: "#f97316", soft: "rgba(249,115,22,0.14)" }, // orange-500
  { days: 10, name: "Ember", hex: "#ef4444", soft: "rgba(239,68,68,0.14)" }, // red-500
  { days: 50, name: "Blaze", hex: "#ec4899", soft: "rgba(236,72,153,0.14)" }, // pink-500
  { days: 100, name: "Inferno", hex: "#a855f7", soft: "rgba(168,85,247,0.14)" }, // purple-500
  { days: 200, name: "Supernova", hex: "#3b82f6", soft: "rgba(59,130,246,0.14)" }, // blue-500
  { days: 300, name: "Aurora", hex: "#06b6d4", soft: "rgba(6,182,212,0.14)" }, // cyan-500
  { days: 400, name: "Glacier", hex: "#10b981", soft: "rgba(16,185,129,0.14)" }, // emerald-500
  { days: 500, name: "Emerald Legend", hex: "#84cc16", soft: "rgba(132,204,22,0.14)" }, // lime-500
  { days: 600, name: "Mythic", hex: "#eab308", soft: "rgba(234,179,8,0.14)" }, // yellow-500
  { days: 700, name: "Ascendant", hex: "#f59e0b", soft: "rgba(245,158,11,0.14)" }, // amber-500
  { days: 800, name: "Eternal", hex: "#fb923c", soft: "rgba(251,146,60,0.14)" }, // orange-400
  { days: 900, name: "Celestial", hex: "#fda4af", soft: "rgba(253,164,175,0.14)" }, // rose-300
  { days: 1000, name: "Immortal", hex: "#f43f5e", soft: "rgba(244,63,94,0.16)" }, // rose-500
];

function getMilestone(streak: number) {
  let current = MILESTONES[0];
  for (const m of MILESTONES) {
    if (streak >= m.days) current = m;
  }
  return current;
}

function getNextMilestone(streak: number) {
  return MILESTONES.find((m) => m.days > streak) ?? null;
}

export function StreakModal({ isOpen, onClose }: StreakModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.isLoggedIn && user.role !== "guest" ? user.id : "anonymous";
  const [streakData, setStreakData] = useState<DailyStreakInfo | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStreakData(null);
      StreakService.getStreakInfo(userId).then(setStreakData);
    }
  }, [isOpen, userId]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !streakData) return null;

  const streak = streakData.currentStreak;
  const milestone = getMilestone(streak);
  const next = getNextMilestone(streak);
  const progressPct = next
    ? Math.min(100, ((streak - milestone.days) / (next.days - milestone.days)) * 100)
    : 100;

  const handleClaimBonus = async () => {
    if (claiming || streakData.dailyRewardClaimed) return;
    setClaiming(true);
    try {
      const res = await StreakService.claimDailyReward(userId);
      if (res.ok) {
        audioFX.playSuccess();
        showToast(`Claimed +${res.xp} XP Daily Watch Bonus!`, "success");
        setStreakData({ ...streakData, dailyRewardClaimed: true });
      } else if (res.error === "no_watch_today") {
        showToast("Manood muna ngayong araw para ma-claim ang bonus.", "info");
      } else if (res.error === "already_claimed") {
        showToast("Nakuha mo na ang bonus ngayong araw.", "info");
        setStreakData({ ...streakData, dailyRewardClaimed: true });
      } else if (res.error === "not_authenticated") {
        showToast("Mag-log in para ma-claim ang daily bonus.", "info");
      } else {
        showToast("Hindi ma-claim ang bonus ngayon. Try again later.", "error");
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Watch streak"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Edge-to-edge on mobile (zero margin), centered card ≥ sm */}
      <div
        className="relative w-full sm:max-w-sm sm:rounded-3xl rounded-t-none bg-[#101010] border border-white/10 sm:border shadow-2xl p-5 sm:p-7 space-y-5 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        style={{ boxShadow: `0 0 80px ${milestone.soft}` }}
      >
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Minimal hero: flame + number */}
        <div className="pt-2 space-y-1">
          <Flame
            className="h-10 w-10 transition-colors duration-500"
            style={{ color: streak > 0 ? milestone.hex : "#52525b", fill: streak > 0 ? milestone.hex : "#3f3f46" }}
            strokeWidth={1.5}
          />
          <div className="flex items-baseline gap-2">
            <span
              className="text-5xl font-black font-heading tracking-tight tabular-nums transition-colors duration-500"
              style={{ color: streak > 0 ? milestone.hex : "#a1a1aa" }}
            >
              {streak}
            </span>
            <span className="text-sm font-semibold text-zinc-400">
              {streak === 1 ? "araw na streak" : "araw na streak"}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            {streak > 0 ? milestone.name : "Manood ngayon para magsimula"}
            {" · "}
            longest: {streakData.longestStreak}
          </p>
        </div>

        {/* Progress to next milestone */}
        {next && (
          <div className="space-y-1.5">
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, backgroundColor: milestone.hex }}
              />
            </div>
            <p className="text-[11px] font-mono text-zinc-500">
              {streak} / {next.days} · next color at {next.name}
            </p>
          </div>
        )}

        {/* Week strip — minimal dots */}
        <div className="grid grid-cols-7 gap-1.5 pt-1 border-t border-white/5">
          {streakData.streakWeek.map((d) => (
            <div key={d.dateStr} className="flex flex-col items-center gap-1 py-1.5">
              <span className="text-[9px] font-bold uppercase text-zinc-600">
                {d.day[0]}
              </span>
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: d.active ? milestone.hex : d.isToday ? "transparent" : "#27272a",
                  border: d.active ? "none" : d.isToday ? `1px dashed ${milestone.hex}` : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Daily bonus claim — real server-side XP */}
        <button
          type="button"
          onClick={handleClaimBonus}
          disabled={claiming || streakData.dailyRewardClaimed || !streakData.hasWatchedToday}
          className={`w-full h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            streakData.dailyRewardClaimed
              ? "bg-white/5 text-zinc-600 cursor-default"
              : streakData.hasWatchedToday
              ? "text-black hover:opacity-90 cursor-pointer"
              : "bg-white/5 text-zinc-600 cursor-not-allowed"
          }`}
          style={
            !streakData.dailyRewardClaimed && streakData.hasWatchedToday
              ? { backgroundColor: milestone.hex }
              : undefined
          }
        >
          {streakData.dailyRewardClaimed
            ? "Nakuha na ang bonus ngayong araw (+50 XP)"
            : streakData.hasWatchedToday
            ? "Kunin ang Daily Watch Bonus (+50 XP)"
            : "Manood ngayon para i-unlock ang bonus"}
        </button>

        <p className="text-[10px] leading-relaxed text-zinc-600">
          Ang streak ay bilang ng magkakasunod na{" "}
          <span className="text-zinc-400">araw na nanood ka</span> — hindi kasama
          ang pag-login lang o panonood ng trailer.
        </p>
      </div>
    </div>
  );
}
