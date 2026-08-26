"use client";

import { db } from "@/lib/db/dexie-db";
import type { WatchHistoryRecord } from "@/types/storage";

export interface DailyStreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWatchDate: string | null;
  hasWatchedToday: boolean;
  streakWeek: { day: string; dateStr: string; active: boolean; isToday: boolean }[];
  totalDaysActive: number;
  dailyRewardClaimed: boolean;
}

// Per-user keys. Streak data MUST be scoped to the account that earned it —
// an unscoped key let stale/demo values bleed into freshly created accounts.
const storageKey = (userId: string) => `lantawon_streak_data_${userId}`;
const claimKey = (userId: string) => `lantawon_streak_claim_${userId}`;

/** Legacy unscoped keys from the pre-scoping era — cleaned on first run. */
const LEGACY_STORAGE_KEY = "lantawon_streak_data";
const LEGACY_DAILY_CLAIM_KEY = "lantawon_streak_claim_date";
let legacyCleaned = false;

function cleanLegacyKeys() {
  if (legacyCleaned || typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_DAILY_CLAIM_KEY);
  } catch {}
  legacyCleaned = true;
}

export class StreakService {
  /**
   * Get the current date in YYYY-MM-DD local format
   */
  static getTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  private static safeGetUserId(userId?: string | null): string {
    return userId && userId.trim() ? userId : "anonymous";
  }

  /**
   * Calculate consecutive WATCH days for a specific user.
   *
   * CANONICAL RULE: a streak day counts ONLY when the user actually watched
   * something (a history record was written with real playback). Merely
   * logging in or opening the site never creates a streak.
   *
   * The streak is derived purely from the user's own Dexie history — no
   * localStorage fallback can inflate it.
   */
  static async getStreakInfo(userId?: string | null): Promise<DailyStreakInfo> {
    const uid = this.safeGetUserId(userId);
    const todayStr = this.getTodayStr();
    cleanLegacyKeys();

    let history: WatchHistoryRecord[] = [];
    try {
      // Scope strictly to this user's rows — never another account's demo
      // data, never a previous visitor's history on a shared device.
      history = await db.watchHistory.where("userId").equals(uid).toArray();
    } catch {
      history = [];
    }

    // A day is "active" only if REAL playback happened on it: progress must
    // have advanced beyond the opening seconds. This prevents page-load
    // resume stubs (currentTime 0) and trailer previews from counting.
    const activeDateSet = new Set<string>();
    for (const h of history) {
      if (!h.lastWatchedAt) continue;
      const dateStr = h.lastWatchedAt.split("T")[0];
      if (!dateStr) continue;
      const hasRealPlayback =
        (h.currentTime ?? 0) >= 60 ||
        (h.percentage ?? 0) >= 2 ||
        h.completed === true;
      if (hasRealPlayback) activeDateSet.add(dateStr);
    }

    const hasWatchedToday = activeDateSet.has(todayStr);

    // Walk backwards from today (or yesterday if today not yet watched).
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

    // Longest streak across all of this user's history (not just current week).
    let longestStreak = currentStreak;
    {
      const sorted = Array.from(activeDateSet).sort();
      let run = 0;
      let prev: Date | null = null;
      for (const ds of sorted) {
        const d = new Date(`${ds}T00:00:00`);
        if (prev && d.getTime() - prev.getTime() === 86_400_000) {
          run++;
        } else {
          run = 1;
        }
        prev = d;
        longestStreak = Math.max(longestStreak, run);
      }
    }

    // Build the 7-day current week tracker (Mon - Sun)
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const streakWeek = daysShort.map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        day: dayName,
        dateStr: dStr,
        active: activeDateSet.has(dStr),
        isToday: dStr === todayStr,
      };
    });

    // Daily reward claim state — scoped per user, checked against real watch
    // activity: the bonus can only be claimed on a day the user watched.
    let dailyRewardClaimed = false;
    try {
      dailyRewardClaimed = localStorage.getItem(claimKey(uid)) === todayStr;
    } catch {}

    return {
      currentStreak,
      longestStreak,
      lastWatchDate: hasWatchedToday ? todayStr : null,
      hasWatchedToday,
      streakWeek,
      totalDaysActive: activeDateSet.size,
      dailyRewardClaimed,
    };
  }

  /**
   * Claim the daily watch bonus XP. Server-side via RPC — the XP is written
   * into xp_events by the database function so totals stay auditable and
   * trigger-maintained. Returns false when there is nothing to claim.
   */
  static async claimDailyReward(
    userId?: string | null
  ): Promise<{ ok: boolean; xp?: number; error?: string }> {
    const uid = this.safeGetUserId(userId);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return { ok: false, error: "not_authenticated" };
    }
    // Guests / anonymous local users have no server XP account to credit.
    if (uid !== authData.user.id) {
      return { ok: false, error: "not_authenticated" };
    }

    const todayStr = this.getTodayStr();

    // Must actually have watched today — login alone never earns the bonus.
    const info = await this.getStreakInfo(uid);
    if (!info.hasWatchedToday) {
      return { ok: false, error: "no_watch_today" };
    }
    if (info.dailyRewardClaimed) {
      return { ok: false, error: "already_claimed" };
    }

    const { data, error } = await supabase.rpc("claim_daily_watch_bonus");
    if (error) {
      return { ok: false, error: error.message };
    }

    try {
      localStorage.setItem(claimKey(uid), todayStr);
    } catch {}

    return { ok: true, xp: Number((data as any)?.xp ?? 50) };
  }
}
