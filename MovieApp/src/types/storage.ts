import type { MatchStatus, CandidateMatch } from "@/types/resolver";

/**
 * The guest user ID used when no authenticated user is present.
 * This constant is the single source of truth — never hardcode "guest" or "current_user" elsewhere.
 */
export const GUEST_USER_ID = "guest";

/**
 * Returns the effective user ID: either the authenticated user's ID or the guest fallback.
 */
export function resolveUserId(userId?: string | null): string {
  return userId && userId.trim().length > 0 ? userId.trim() : GUEST_USER_ID;
}

// ─── Watch History ────────────────────────────────────────────────────────────

export interface WatchHistoryRecord {
  id: string; // `${userId}_${mediaId}_${season}_${episode}`
  userId: string; // GUEST_USER_ID for local-only sessions
  mediaId: string;
  mediaType: "movie" | "tv" | "anime";
  title: string;
  posterPath: string;
  backdropPath?: string;
  season?: number;
  episode?: number;
  currentTime: number;
  duration: number;
  percentage: number;
  lastWatchedAt: string; // ISO 8601
  completed: boolean;
}

// ─── Library ──────────────────────────────────────────────────────────────────

export interface LibraryItemRecord {
  id: string; // `${userId}_${mediaId}`
  userId: string;
  mediaId: string; // original TMDB id
  mediaType: "movie" | "tv" | "anime";
  title: string;
  year?: string;
  posterPath: string;
  genres: string[];
  rating: number;
  inWatchlist: boolean;
  isFavorite: boolean;
  userRating?: number; // 1-10 personal rating
  addedAt: string;
}

// ─── Local Scanned Media ──────────────────────────────────────────────────────

export interface LocalScannedMediaRecord {
  downloadId: string;
  userId: string;
  id: string;
  isLocalFile: boolean;
  fileFingerprint?: string;
  title: string;
  canonicalTitle?: string;
  year?: string;
  mediaType: "movie" | "tv" | "anime";
  season?: number;
  episode?: number;
  quality: string;
  fullRelativePath: string;
  fileName: string;
  sizeBytes: number;
  sizeFormatted: string;
  poster_path: string;
  backdrop_path?: string;
  overview?: string;
  status: "completed" | "downloading";
  progress: number;
  matchConfidence?: number;
  matchStatus?: MatchStatus;
  candidates?: CandidateMatch[];
  isUserOverridden?: boolean;
  createdAt: string;
}

// ─── User Progression (XP, Levels, Achievements) ─────────────────────────────

export interface UserProgressionRecord {
  id: string; // userId (resolveUserId result)
  userId: string;
  totalXp: number;
  level: number;
  rank: string;
  unlockedAchievements: string[];
  lastActiveDate: string;
  currentStreak: number;
  longestStreak: number;
}

// ─── Playlists ────────────────────────────────────────────────────────────────

export interface PlaylistItem {
  id: string; // mediaId
  mediaType: "movie" | "tv" | "anime";
  title: string;
  posterPath: string;
  year?: string;
  rating?: number;
  addedAt: string;
}

export interface PlaylistRecord {
  id: string; // `${userId}_${uuid}` or `${userId}_watch_later`
  userId: string;
  title: string;
  description?: string;
  isSystem?: boolean; // true for auto-created playlists like "Watch Later"
  itemCount: number;
  items: PlaylistItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Search History ───────────────────────────────────────────────────────────

export interface SearchHistoryRecord {
  id: string; // `${userId}_${timestamp}`
  userId: string;
  query: string;
  normalizedQuery: string; // lowercase trimmed — used for deduplication
  resultCount?: number;
  timestamp: string;
}

// ─── User Preferences ────────────────────────────────────────────────────────

export interface UserPreferencesRecord {
  id: string; // userId
  userId: string;
  storageBudgetGB: number;
  audioEffectsEnabled: boolean;
  theme: "cinematic-dark";
  subtitlesLanguage?: string;
  autoPlayNextEpisode: boolean;
  preferredStreamQuality?: "auto" | "4k" | "1080p" | "720p" | "480p";
  preferredAudioLanguage?: string;
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { ContentClassification } from "@/types/content-guide";
