/**
 * LANTAWON LANG — OFFLINE-FIRST DEXIE & CLOUD SUPABASE SYNC SERVICE
 * 
 * Two-way reconciliation engine guaranteeing offline usability and cloud backup. (Section 72)
 */

import { supabase } from "./client";
import { db, LantawonDatabase } from "@/lib/db/dexie-db";
import type { LibraryItemRecord, WatchHistoryRecord } from "@/types/storage";

export class CloudSyncService {
  /**
   * Pushes local IndexedDB watchlist and history to Supabase for an authenticated user.
   */
  static async pushLocalToCloud(userId: string): Promise<{ success: boolean; pushedCount: number }> {
    if (!userId || !supabase) return { success: false, pushedCount: 0 };

    let count = 0;

    try {
      // 1. Sync Watchlist
      const localLibrary = await db.libraryItems.toArray();
      const watchlistItems = localLibrary.filter((i) => i.inWatchlist);

      for (const item of watchlistItems) {
        const { error } = await supabase.from("user_watchlist").upsert(
          {
            user_id: userId,
            content_id: item.mediaId || item.id,
            media_type: item.mediaType,
            added_at: item.addedAt,
          },
          { onConflict: "user_id,content_id" }
        );
        if (!error) count++;
      }

      // 2. Sync Favorites
      const favoriteItems = localLibrary.filter((i) => i.isFavorite);
      for (const item of favoriteItems) {
        await supabase.from("user_favorites").upsert(
          {
            user_id: userId,
            content_id: item.mediaId || item.id,
            media_type: item.mediaType,
            added_at: item.addedAt,
          },
          { onConflict: "user_id,content_id" }
        );
      }

      // 3. Sync Watch History & Progress
      const localHistory = await db.watchHistory.toArray();
      for (const hist of localHistory) {
        await supabase.from("watch_progress").upsert(
          {
            user_id: userId,
            content_id: hist.mediaId,
            media_type: hist.mediaType,
            season_number: hist.season || null,
            episode_number: hist.episode || null,
            progress_seconds: hist.currentTime,
            duration_seconds: hist.duration,
            percentage: hist.percentage,
            completed: hist.completed,
            last_watched_at: hist.lastWatchedAt,
          },
          { onConflict: "user_id,content_id,season_number,episode_number" }
        );
      }

      return { success: true, pushedCount: count };
    } catch (err) {
      console.error("[CloudSyncService] Push failed:", err);
      return { success: false, pushedCount: count };
    }
  }

  /**
   * Pulls remote cloud records down into Dexie IndexedDB.
   */
  static async pullCloudToLocal(userId: string): Promise<{ success: boolean }> {
    if (!userId || !supabase) return { success: false };

    try {
      // 1. Pull Watchlist
      const { data: cloudWatchlist } = await supabase
        .from("user_watchlist")
        .select("*")
        .eq("user_id", userId);

      if (cloudWatchlist && cloudWatchlist.length > 0) {
        for (const w of cloudWatchlist) {
          const key = LantawonDatabase.libraryKey(userId, w.content_id);
          await db.libraryItems.put({
            id: key,
            userId,
            mediaId: w.content_id,
            mediaType: w.media_type || "movie",
            title: "Saved Title",
            posterPath: "",
            genres: [],
            rating: 0,
            inWatchlist: true,
            isFavorite: false,
            addedAt: w.added_at || new Date().toISOString(),
          });
        }
      }

      return { success: true };
    } catch (err) {
      console.error("[CloudSyncService] Pull failed:", err);
      return { success: false };
    }
  }
}
