import Dexie, { type Table } from "dexie";
import type {
  WatchHistoryRecord,
  LibraryItemRecord,
  LocalScannedMediaRecord,
  ContentClassification,
  UserProgressionRecord,
  UserPreferencesRecord,
  PlaylistRecord,
  PlaylistItem,
  SearchHistoryRecord,
} from "@/types/storage";
import { GUEST_USER_ID } from "@/types/storage";

// ─────────────────────────────────────────────────────────────────────────────
// LantawonDB — Dexie (IndexedDB) database
// ─────────────────────────────────────────────────────────────────────────────
//
// Version history:
//   v1 — initial schema
//   v2 — added playlists + searchHistory
//   v3 — added userId to all tables, scoped IDs, search dedup, prefs upgrade
//
// NOTE: All data is local to this browser. The userId field defaults to
// GUEST_USER_ID ("guest") and will map to a real auth user ID in Phase 3.
// ─────────────────────────────────────────────────────────────────────────────

export class LantawonDatabase extends Dexie {
  watchHistory!: Table<WatchHistoryRecord, string>;
  libraryItems!: Table<LibraryItemRecord, string>;
  localScannedMedia!: Table<LocalScannedMediaRecord, string>;
  contentClassifications!: Table<ContentClassification, string>;
  userProgression!: Table<UserProgressionRecord, string>;
  userPreferences!: Table<UserPreferencesRecord, string>;
  playlists!: Table<PlaylistRecord, string>;
  searchHistory!: Table<SearchHistoryRecord, string>;

  constructor() {
    super("LantawonDB");

    // ── v1 (legacy — never change) ──────────────────────────────────────────
    this.version(1).stores({
      watchHistory: "id, mediaId, mediaType, lastWatchedAt, completed",
      libraryItems: "id, mediaType, inWatchlist, isFavorite, addedAt",
      localScannedMedia: "downloadId, id, title, mediaType, quality, status, createdAt",
      contentClassifications: "mediaId, primaryRating, overallSeverity, lastUpdated",
      userProgression: "id, level, rank, totalXp",
      userPreferences: "id",
    });

    // ── v2 (added playlists + searchHistory) ────────────────────────────────
    this.version(2).stores({
      watchHistory: "id, mediaId, mediaType, lastWatchedAt, completed",
      libraryItems: "id, mediaType, inWatchlist, isFavorite, addedAt",
      localScannedMedia: "downloadId, id, title, mediaType, quality, status, createdAt",
      contentClassifications: "mediaId, primaryRating, overallSeverity, lastUpdated",
      userProgression: "id, level, rank, totalXp",
      userPreferences: "id",
      playlists: "id, title, isSystem, createdAt, updatedAt",
      searchHistory: "id, query, timestamp",
    });

    // ── v3 (userId scoping, dedup, prefs upgrade) ───────────────────────────
    this.version(3)
      .stores({
        // userId index on every table enables future multi-user / server-sync
        watchHistory:
          "id, userId, mediaId, mediaType, lastWatchedAt, completed",
        libraryItems:
          "id, userId, mediaId, mediaType, inWatchlist, isFavorite, addedAt",
        localScannedMedia:
          "downloadId, userId, id, title, mediaType, quality, status, createdAt",
        contentClassifications:
          "mediaId, primaryRating, overallSeverity, lastUpdated",
        userProgression:
          "id, userId, level, rank, totalXp",
        userPreferences:
          "id, userId",
        playlists:
          "id, userId, title, isSystem, createdAt, updatedAt",
        searchHistory:
          "id, userId, normalizedQuery, timestamp",
      })
      .upgrade(async (tx) => {
        // ── Backfill userId = GUEST_USER_ID on all existing rows ─────────────

        await tx.table("watchHistory").toCollection().modify((r) => {
          if (!r.userId) r.userId = GUEST_USER_ID;
        });

        await tx.table("libraryItems").toCollection().modify((r) => {
          if (!r.userId) r.userId = GUEST_USER_ID;
          if (!r.mediaId) r.mediaId = r.id; // old records had plain TMDB id as `id`
        });

        await tx.table("localScannedMedia").toCollection().modify((r) => {
          if (!r.userId) r.userId = GUEST_USER_ID;
        });

        await tx.table("userProgression").toCollection().modify((r) => {
          // Old key was hardcoded "current_user" — keep it valid, just tag userId
          if (!r.userId) r.userId = GUEST_USER_ID;
        });

        await tx.table("userPreferences").toCollection().modify((r) => {
          if (!r.userId) r.userId = GUEST_USER_ID;
        });

        await tx.table("playlists").toCollection().modify((r) => {
          if (!r.userId) r.userId = GUEST_USER_ID;
        });

        await tx.table("searchHistory").toCollection().modify((r) => {
          if (!r.userId) r.userId = GUEST_USER_ID;
          // Backfill normalizedQuery for deduplication
          if (!r.normalizedQuery) {
            r.normalizedQuery = (r.query ?? "").toLowerCase().trim();
          }
        });
      });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Build a user-scoped history key: `${userId}_${mediaId}_${season}_${episode}`
   */
  static historyKey(
    userId: string,
    mediaId: string,
    season?: number,
    episode?: number
  ): string {
    return `${userId}_${mediaId}_${season ?? 0}_${episode ?? 0}`;
  }

  /**
   * Build a user-scoped library key: `${userId}_${mediaId}`
   */
  static libraryKey(userId: string, mediaId: string): string {
    return `${userId}_${mediaId}`;
  }

  /**
   * Build a user-scoped playlist key: `${userId}_${slug}`
   */
  static playlistKey(userId: string, slug: string): string {
    return `${userId}_${slug}`;
  }

  // ─── Migrations ────────────────────────────────────────────────────────────

  /**
   * Migrate legacy localStorage records into IndexedDB.
   * Safe to call multiple times — records are upserted.
   */
  async migrateFromLocalStorage(userId = GUEST_USER_ID): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      if (localStorage.getItem("lantawon_dexie_migrated_v3") === "true") {
        return;
      }

      // 1. Migrate downloads
      const rawDownloads =
        localStorage.getItem("cinemind_downloads") ||
        localStorage.getItem("lantawon_downloads");
      if (rawDownloads) {
        const parsed = JSON.parse(rawDownloads);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            await this.localScannedMedia.put({ ...item, userId });
          }
        }
        localStorage.removeItem("cinemind_downloads");
        localStorage.removeItem("lantawon_downloads");
      }

      // 2. Migrate watchlist
      const rawWatchlist =
        localStorage.getItem("cinemind_watchlist") ||
        localStorage.getItem("lantawon_watchlist");
      if (rawWatchlist) {
        const parsed = JSON.parse(rawWatchlist);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const mediaId = String(item.id);
            await this.libraryItems.put({
              id: LantawonDatabase.libraryKey(userId, mediaId),
              userId,
              mediaId,
              mediaType: item.media_type || (item.title ? "movie" : "tv"),
              title: item.title || item.name || "Untitled",
              posterPath: item.poster_path || "",
              genres: [],
              rating: item.vote_average || 0,
              inWatchlist: true,
              isFavorite: false,
              addedAt: new Date().toISOString(),
            });
          }
        }
        localStorage.removeItem("cinemind_watchlist");
        localStorage.removeItem("lantawon_watchlist");
      }

      // 3. Migrate history
      const rawHistory =
        localStorage.getItem("cinemind_history") ||
        localStorage.getItem("lantawon_history");
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const mediaId = String(item.id);
            const key = LantawonDatabase.historyKey(
              userId,
              mediaId,
              item.season,
              item.episode
            );
            await this.watchHistory.put({
              id: key,
              userId,
              mediaId,
              mediaType: item.media_type || "movie",
              title: item.title || item.name || "Untitled",
              posterPath: item.poster_path || "",
              season: item.season,
              episode: item.episode,
              currentTime: item.currentTime || 0,
              duration: item.duration || 0,
              percentage: item.percentage || 0,
              lastWatchedAt: item.timestamp || new Date().toISOString(),
              completed: (item.percentage || 0) > 90,
            });
          }
        }
        localStorage.removeItem("cinemind_history");
        localStorage.removeItem("lantawon_history");
      }

      localStorage.setItem("lantawon_dexie_migrated_v3", "true");
    } catch (e) {
      console.warn("[Dexie Migration Warning]", e);
    }
  }

  // ─── Search History ────────────────────────────────────────────────────────

  /**
   * Add a search query to history with deduplication.
   * If the same normalized query already exists for this user today, it's updated in-place.
   */
  async addSearchHistory(query: string, userId = GUEST_USER_ID, resultCount?: number): Promise<void> {
    if (!query.trim()) return;
    const normalizedQuery = query.toLowerCase().trim();
    const todayPrefix = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Find an existing entry for this user+query today
    const existing = await this.searchHistory
      .where("normalizedQuery")
      .equals(normalizedQuery)
      .filter((r) => r.userId === userId && r.timestamp.startsWith(todayPrefix))
      .first();

    if (existing) {
      // Bump timestamp and update result count
      await this.searchHistory.update(existing.id, {
        timestamp: new Date().toISOString(),
        resultCount,
      });
    } else {
      const timestamp = new Date().toISOString();
      await this.searchHistory.put({
        id: `${userId}_${Date.now()}`,
        userId,
        query: query.trim(),
        normalizedQuery,
        resultCount,
        timestamp,
      });
    }

    // Keep only the latest 50 queries per user
    const all = await this.searchHistory
      .where("userId")
      .equals(userId)
      .sortBy("timestamp");
    if (all.length > 50) {
      const toDelete = all.slice(0, all.length - 50).map((r) => r.id);
      await this.searchHistory.bulkDelete(toDelete);
    }
  }

  // ─── Clear / Reset ─────────────────────────────────────────────────────────

  /**
   * Reset all watch history for a user
   */
  async clearAllHistory(userId = GUEST_USER_ID): Promise<void> {
    try {
      await this.watchHistory.where("userId").equals(userId).delete();
      await this.watchHistory.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("cinemind_history");
        localStorage.removeItem("lantawon_history");
        localStorage.removeItem("lantawon_sagas_watched_map");
      }
    } catch (e) {
      console.warn("[Dexie Clear History Error]", e);
    }
  }

  /**
   * Fetch playlists with automated deduplication and cleanup of legacy duplicate "Watch Later" records.
   */
  async getUnifiedPlaylists(userId = GUEST_USER_ID): Promise<PlaylistRecord[]> {
    try {
      const all = await this.playlists.toArray();
      const canonicalKey = LantawonDatabase.playlistKey(userId, "watch_later");

      // Find any system or duplicate "Watch Later" playlists
      const watchLaterEntries = all.filter(
        (p) =>
          p.id === canonicalKey ||
          p.id === "watch_later" ||
          (p.title && p.title.trim().toLowerCase() === "watch later")
      );

      // Merge items from all duplicate watch later entries into one
      const mergedItems: PlaylistItem[] = [];
      const seenItemIds = new Set<string | number>();
      for (const pl of watchLaterEntries) {
        if (Array.isArray(pl.items)) {
          for (const item of pl.items) {
            if (!seenItemIds.has(item.id)) {
              seenItemIds.add(item.id);
              mergedItems.push(item);
            }
          }
        }
      }

      // Purge any non-canonical duplicate entries from IndexedDB
      for (const pl of watchLaterEntries) {
        if (pl.id !== canonicalKey) {
          await this.playlists.delete(pl.id);
        }
      }

      // Upsert the single canonical Watch Later playlist
      const canonicalWatchLater: PlaylistRecord = {
        id: canonicalKey,
        userId,
        title: "Watch Later",
        description: "Default queue for saved movies & series",
        isSystem: true,
        itemCount: mergedItems.length,
        items: mergedItems,
        createdAt: watchLaterEntries[0]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.playlists.put(canonicalWatchLater);

      // Fetch fresh cleaned list
      const cleaned = await this.playlists.toArray();
      const customList = cleaned.filter((p) => p.id !== canonicalKey);

      return [canonicalWatchLater, ...customList];
    } catch (e) {
      console.warn("[Dexie Playlists Error]", e);
      return [];
    }
  }

  /**
   * Clear ALL device data for a user (full reset)
   */
  async clearAllDeviceData(userId = GUEST_USER_ID): Promise<void> {
    try {
      await this.watchHistory.where("userId").equals(userId).delete();
      await this.libraryItems.where("userId").equals(userId).delete();
      await this.localScannedMedia.where("userId").equals(userId).delete();
      await this.userProgression.where("userId").equals(userId).delete();
      await this.userPreferences.where("userId").equals(userId).delete();
      await this.playlists.where("userId").equals(userId).delete();
      await this.searchHistory.where("userId").equals(userId).delete();
      // contentClassifications are shared (not user-specific), so keep them

      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (e) {
      console.warn("[Dexie Clear All Data Error]", e);
    }
  }
}

export const db = new LantawonDatabase();
