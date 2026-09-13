"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Flame, X, Calendar, Check } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { useAuth } from "@/context/AuthContext";
import { StreakService, type DailyStreakInfo } from "@/lib/services/streak-service";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StreakModal({ isOpen, onClose }: StreakModalProps) {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<DailyStreakInfo | null>(null);
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Load streak information whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    StreakService.getStreakInfo(user?.id).then((data) => {
      setStreakData(data);
    });
  }, [isOpen, user?.id]);

  // Auto-scroll heatmap to current week index on load
  useEffect(() => {
    if (isOpen && streakData && scrollContainerRef.current) {
      const targetScroll = Math.max(0, streakData.currentWeekIndex * 14 - 120);
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  }, [isOpen, streakData]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !streakData) return null;

  const streak = streakData.currentStreak;
  const isHot = streak > 0 || streakData.hasWatchedToday;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] bg-black/90 sm:bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Daily watch streak"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0 hidden sm:block" onClick={onClose} />

      {/* Modal Card (Full screen on mobile: 0 margins, 0 corner radius; floating card on sm+) */}
      <div
        className="relative w-full h-full min-h-[100svh] sm:h-auto sm:min-h-0 sm:max-w-xl rounded-none sm:rounded-3xl bg-[#121316] border-0 sm:border sm:border-white/15 shadow-2xl p-5 pt-14 sm:p-8 flex flex-col justify-center space-y-6 animate-in zoom-in-95 duration-200 overflow-y-auto sm:overflow-hidden z-10"
        style={{
          boxShadow: isHot
            ? "0 0 60px rgba(249,115,22,0.35), inset 0 1px 1px rgba(255,255,255,0.15)"
            : "0 0 40px rgba(0,0,0,0.8)",
        }}
      >
        {/* Ambient Top Orange Glow */}
        {isHot && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-48 rounded-full blur-3xl bg-orange-500/25 pointer-events-none" />
        )}

        {/* Big Clickable Close Button (Enlarged touch target) */}
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 h-11 w-11 sm:h-10 sm:w-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90 z-20"
          aria-label="Close modal"
          title="Close"
        >
          <X className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
        </button>

        {/* Hero Section: Orange Flame + Streak Counter */}
        <div className="text-center space-y-3 pt-2 relative z-10">
          <div className="relative inline-flex items-center justify-center">
            {/* Glowing Pulsing Ring */}
            <div
              className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${
                isHot ? "opacity-70 scale-125 animate-pulse bg-orange-500" : "opacity-0"
              }`}
            />
            {/* Flame Icon Box */}
            <div
              className={`h-20 w-20 rounded-3xl p-3 flex items-center justify-center border transition-all duration-500 shadow-xl ${
                isHot
                  ? "bg-orange-500/20 border-orange-500/60 shadow-orange-500/20"
                  : "bg-white/[0.03] border-white/[0.08]"
              }`}
            >
              <Flame
                className={`h-12 w-12 transition-all duration-500 ${
                  isHot
                    ? "scale-110 text-orange-500 fill-orange-500 animate-pulse drop-shadow-[0_0_14px_rgba(249,115,22,0.9)]"
                    : "text-zinc-600 fill-zinc-700"
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 font-mono">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {streak}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-orange-500">
                {streak === 1 ? "DAY" : "DAYS"}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-zinc-300 mt-1">
              {streakData.hasWatchedToday ? (
                <span className="text-orange-400 font-bold flex items-center justify-center gap-1.5">
                  <Check className="h-4 w-4 text-orange-400" />
                  You watched today! Streak extended.
                </span>
              ) : (
                <span className="text-zinc-400">
                  Stream any title today to keep your streak alive!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 2026 Heatmap Annual Contribution Section */}
        <div className="space-y-3 bg-black/40 rounded-2xl p-4 border border-white/10 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-400" />
              <span className="text-xs sm:text-sm font-bold text-white">
                {streakData.totalDaysActive} active watch days in 2026
              </span>
            </div>

            <div className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-mono font-bold">
              2026
            </div>
          </div>

          {/* Heatmap Matrix with Month Labels */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent scroll-smooth"
          >
            <div className="min-w-[620px] space-y-1">
              {/* Month Labels */}
              <div className="flex text-[10px] font-mono text-zinc-400 pl-7 h-4 relative">
                {streakData.monthsHeader.map((m, idx) => (
                  <span
                    key={`${m.name}_${idx}`}
                    className="absolute"
                    style={{ left: `${m.weekIndex * 14 + 28}px` }}
                  >
                    {m.name}
                  </span>
                ))}
              </div>

              {/* Grid: 7 Rows (Mon - Sun) × 52 Weeks */}
              <div className="flex gap-1 items-start">
                {/* Day of Week Labels on the Left */}
                <div className="flex flex-col gap-1 text-[9px] font-mono text-zinc-500 pr-1 select-none">
                  <span className="h-2.5 leading-none">Mon</span>
                  <span className="h-2.5 leading-none opacity-0">Tue</span>
                  <span className="h-2.5 leading-none">Wed</span>
                  <span className="h-2.5 leading-none opacity-0">Thu</span>
                  <span className="h-2.5 leading-none">Fri</span>
                  <span className="h-2.5 leading-none opacity-0">Sat</span>
                  <span className="h-2.5 leading-none">Sun</span>
                </div>

                {/* Columns of Week Tiles */}
                <div className="flex gap-1">
                  {streakData.heatmapWeeks.map((week, wIdx) => (
                    <div key={`week_${wIdx}`} className="flex flex-col gap-1">
                      {week.map((day) => {
                        return (
                          <div
                            key={day.dateStr}
                            title={`${day.dateStr}${day.active ? " (Watched 🔥)" : day.isToday ? " (Today)" : ""}`}
                            className={`w-2.5 h-2.5 rounded-[2px] transition-all ${
                              day.isFuture
                                ? "opacity-0 pointer-events-none"
                                : day.active
                                ? "bg-orange-500 shadow-sm shadow-orange-500/60 ring-1 ring-orange-400/40 hover:scale-125"
                                : day.isToday
                                ? "bg-white/10 border border-orange-400/50 animate-pulse"
                                : "bg-white/[0.04] border border-white/[0.03] hover:bg-white/15"
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap Legend (Only 2 Colors: None vs Orange) */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-white/5">
            <span>Daily watch activity from Jan 1, 2026</span>
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div
                title="None / Inactive"
                className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.04] border border-white/[0.06]"
              />
              <div
                title="Watched / Active"
                className="w-2.5 h-2.5 rounded-[2px] bg-orange-500 shadow-sm shadow-orange-500/60 ring-1 ring-orange-400/40"
              />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
