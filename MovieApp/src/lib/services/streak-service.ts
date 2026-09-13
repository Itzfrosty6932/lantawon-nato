"use client";

import { db } from "@/lib/db/dexie-db";

export interface HeatmapDay {
  dateStr: string;
  dayOfWeek: number; // 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface DailyStreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWatchDate: string | null;
  hasWatchedToday: boolean;
  totalDaysActive: number;
  hoursUntilReset: number;
  activeDates: string[];
  heatmapWeeks: HeatmapDay[][];
  monthsHeader: { name: string; weekIndex: number }[];
  currentWeekIndex: number;
}

// Scoped storage keys
const storageDatesKey = (userId: string) => `lantawon_streak_dates_${userId}`;
const streakNotifiedKey = (userId: string, dateStr: string) => `lantawon_streak_notif_${userId}_${dateStr}`;

export class StreakService {
  /**
   * Get current local date string in YYYY-MM-DD
   */
  static getTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  private static safeGetUserId(userId?: string | null): string {
    return userId && userId.trim() && userId !== "guest" ? userId : "anonymous";
  }

  /**
   * Get all active watch dates from Dexie DB + localStorage fallback
   */
  static async getActiveDates(uid: string): Promise<Set<string>> {
    const activeDateSet = new Set<string>();

    // 1. Read from localStorage fallback
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageDatesKey(uid));
        if (stored) {
          const parsed: string[] = JSON.parse(stored);
          parsed.forEach((d) => {
            if (d && typeof d === "string") activeDateSet.add(d.trim());
          });
        }
      } catch {}
    }

    // 2. Query IndexedDB watch history
    try {
      const records = await db.watchHistory
        .filter((h) => h.userId === uid || (uid === "anonymous" && (!h.userId || h.userId === "guest" || h.userId === "anonymous")))
        .toArray();

      for (const h of records) {
        if (!h.lastWatchedAt) continue;

        // Parse ISO string split
        const isoDate = h.lastWatchedAt.split("T")[0];
        if (isoDate) activeDateSet.add(isoDate);

        // Parse local date representation
        try {
          const d = new Date(h.lastWatchedAt);
          if (!isNaN(d.getTime())) {
            const localStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            activeDateSet.add(localStr);
          }
        } catch {}
      }
    } catch {}

    return activeDateSet;
  }

  /**
   * Generate continuous Monday-first annual heatmap grid for 2026
   */
  static generateAnnualHeatmap(activeDateSet: Set<string>, todayStr: string) {
    const today = new Date();
    const currentYear = today.getFullYear(); // 2026

    // Start from Jan 1st of current year
    const startDate = new Date(currentYear, 0, 1);
    // Align start to preceding Monday (0=Mon, 6=Sun)
    const startMonOffset = (startDate.getDay() + 6) % 7;
    const alignedStart = new Date(startDate);
    alignedStart.setDate(startDate.getDate() - startMonOffset);

    // End on Dec 31st of current year (52/53 weeks)
    const endDate = new Date(currentYear, 11, 31);
    const endMonOffset = (endDate.getDay() + 6) % 7;
    const alignedEnd = new Date(endDate);
    alignedEnd.setDate(endDate.getDate() + (6 - endMonOffset));

    const weeks: HeatmapDay[][] = [];
    const monthsHeader: { name: string; weekIndex: number }[] = [];
    let currentWeek: HeatmapDay[] = [];
    let lastMonth = -1;
    let currentWeekIndex = 0;

    const iter = new Date(alignedStart);
    let weekCounter = 0;

    while (iter <= alignedEnd) {
      const dateStr = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, "0")}-${String(iter.getDate()).padStart(2, "0")}`;
      const isToday = dateStr === todayStr;
      const isFuture = iter > today;
      const active = activeDateSet.has(dateStr);

      if (isToday) {
        currentWeekIndex = weekCounter;
      }

      // Track month header position on first occurrence
      if (iter.getFullYear() === currentYear && iter.getMonth() !== lastMonth) {
        lastMonth = iter.getMonth();
        const monthName = iter.toLocaleString("en-US", { month: "short" });
        monthsHeader.push({ name: monthName, weekIndex: weekCounter });
      }

      // Day of week: 0 = Mon, ..., 6 = Sun
      const dayOfWeek = (iter.getDay() + 6) % 7;

      currentWeek.push({
        dateStr,
        dayOfWeek,
        active,
        isToday,
        isFuture,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
        weekCounter++;
      }

      iter.setDate(iter.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, monthsHeader, currentWeekIndex };
  }

  /**
   * Calculate continuous daily streak info
   */
  static async getStreakInfo(userId?: string | null): Promise<DailyStreakInfo> {
    const uid = this.safeGetUserId(userId);
    const todayStr = this.getTodayStr();

    const activeDateSet = await this.getActiveDates(uid);
    let hasWatchedToday = activeDateSet.has(todayStr);

    // Calculate current continuous streak backwards
    let currentStreak = 0;
    const checkDate = new Date();
    if (!hasWatchedToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
      if (activeDateSet.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Ensure all streak dates are in activeDateSet
    if (currentStreak > 0) {
      const streakPopulator = new Date();
      if (!hasWatchedToday) {
        streakPopulator.setDate(streakPopulator.getDate() - 1);
      }
      for (let i = 0; i < currentStreak; i++) {
        const sDateStr = `${streakPopulator.getFullYear()}-${String(streakPopulator.getMonth() + 1).padStart(2, "0")}-${String(streakPopulator.getDate()).padStart(2, "0")}`;
        activeDateSet.add(sDateStr);
        streakPopulator.setDate(streakPopulator.getDate() - 1);
      }
    }

    // Calculate longest streak
    let longestStreak = currentStreak;
    {
      const sorted = Array.from(activeDateSet).sort();
      let run = 0;
      let prev: Date | null = null;
      for (const ds of sorted) {
        const d = new Date(`${ds}T00:00:00`);
        if (prev && Math.round((d.getTime() - prev.getTime()) / 86_400_000) === 1) {
          run++;
        } else {
          run = 1;
        }
        prev = d;
        longestStreak = Math.max(longestStreak, run);
      }
    }

    // Calculate hours remaining until midnight local reset
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const hoursUntilReset = Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 3_600_000));

    // Generate annual GitHub-style 2026 heatmap
    const { weeks: heatmapWeeks, monthsHeader, currentWeekIndex } = this.generateAnnualHeatmap(activeDateSet, todayStr);

    return {
      currentStreak,
      longestStreak,
      lastWatchDate: hasWatchedToday ? todayStr : null,
      hasWatchedToday,
      totalDaysActive: activeDateSet.size,
      hoursUntilReset,
      activeDates: Array.from(activeDateSet),
      heatmapWeeks,
      monthsHeader,
      currentWeekIndex,
    };
  }

  /**
   * Record playback streak for today
   */
  static async recordPlaybackStreak(
    userId?: string | null,
    title?: string
  ): Promise<{ isNewDayStreak: boolean; streak: number }> {
    const uid = this.safeGetUserId(userId);
    const todayStr = this.getTodayStr();

    // 1. Add today to active dates list in localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageDatesKey(uid));
        const dates: string[] = stored ? JSON.parse(stored) : [];
        if (!dates.includes(todayStr)) {
          dates.push(todayStr);
          localStorage.setItem(storageDatesKey(uid), JSON.stringify(dates));
        }
      } catch {}
    }

    // 2. Fetch updated streak info
    const info = await this.getStreakInfo(uid);
    return {
      isNewDayStreak: true,
      streak: info.currentStreak,
    };
  }

  /**
   * Check if streak milestone notification should fire
   */
  static shouldShowStreakToast(userId: string | null | undefined, currentStreak: number): boolean {
    if (currentStreak <= 0) return false;
    const uid = this.safeGetUserId(userId);
    const todayStr = this.getTodayStr();
    const key = streakNotifiedKey(uid, todayStr);

    if (typeof window === "undefined") return false;
    try {
      const notified = localStorage.getItem(key);
      if (notified) return false;
      localStorage.setItem(key, "true");
      return true;
    } catch {
      return false;
    }
  }
}
