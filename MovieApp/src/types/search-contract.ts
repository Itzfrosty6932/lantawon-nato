/**
 * LANTAWON LANG — UNIFIED SEARCH & FILTER CONTRACT
 * 
 * Standardized interface and types for the universal multi-dimensional search engine.
 * Corresponds directly to Section 83 & Section 64 of the master blueprint.
 */

import type {
  CanonicalMediaType,
  AvailabilityType,
  ContentStatus,
  CanonicalContent,
  CanonicalPerson,
  CanonicalCompany,
  CanonicalProvider,
  CanonicalCollection
} from "./canonical";

// ─── Canonical Search Query Object (Section 83) ──────────────────────────────

export type SearchSortOption =
  | "relevance"
  | "popularity_desc"
  | "popularity_asc"
  | "rating_desc"
  | "rating_asc"
  | "newest"
  | "oldest"
  | "title_asc"
  | "title_desc"
  | "most_watched"
  | "most_added"
  | "most_completed"
  | "most_favorited";

export type RatingPreset =
  | "9.0"
  | "8.5"
  | "8.0"
  | "7.5"
  | "7.0"
  | "6.0"
  | "5.0"
  | "any";

export type RuntimePreset =
  | "under_30"
  | "30_60"
  | "60_90"
  | "90_120"
  | "over_120"
  | "any";

export interface SearchQueryObject {
  /** Full text query or keywords */
  query?: string;
  /** Filter by specific content classifications */
  mediaTypes?: CanonicalMediaType[];
  /** Core high-level genre IDs/slugs */
  genres?: string[];
  /** Specialized subgenres (e.g. Cyberpunk, Isekai, Space Opera) */
  subgenres?: string[];
  /** Content Tone / Theme (e.g. Dark, Gritty, Lighthearted, Feel-Good) */
  themes?: string[];
  /** Content keywords */
  keywords?: string[];
  /** ISO 3166-1 alpha-2 country codes (e.g. 'PH', 'US', 'JP', 'KR') */
  countries?: string[];
  /** ISO 639-1 language codes (e.g. 'en', 'ja', 'ko', 'tl', 'fr') */
  languages?: string[];
  /** Filter by original spoken tongue */
  originalLanguage?: string;
  /** Person IDs (Actors, Directors, Writers, Producers) */
  people?: string[];
  /** Specific roles for people (e.g. director only) */
  personRole?: "actor" | "director" | "writer" | "producer" | "composer";
  /** Company IDs (Studios, Production Companies, Networks, Broadcasters) */
  companies?: string[];
  /** Streaming Provider IDs (Netflix, Disney+, Prime, Crunchyroll, etc.) */
  providers?: string[];
  /** Availability models (subscription, free, rent, buy, broadcast, etc.) */
  availabilityTypes?: AvailabilityType[];
  /** Minimum rating preset or number (e.g. 8.0) */
  ratingMin?: number;
  /** Rating source specification */
  ratingSource?: "platform" | "external" | "critic" | "user";
  /** Release / Air year range */
  yearFrom?: number;
  yearTo?: number;
  /** Month filter (1 to 12) */
  month?: number;
  /** Production / Broadcast status */
  status?: ContentStatus;
  /** Runtime range in minutes */
  runtimeMin?: number;
  runtimeMax?: number;
  /** Age certification (e.g. 'G', 'PG', 'PG-13', 'R', 'TV-MA') */
  certification?: string[];
  /** Content advisories to exclude */
  excludedAdvisories?: string[];
  /** Quality capabilities (e.g. 4K, 1080p) */
  quality?: Array<"480p" | "720p" | "1080p" | "1440p" | "2160p">;
  /** HDR formats (e.g. Dolby Vision, HDR10+) */
  hdr?: Array<"HDR" | "HDR10" | "HDR10+" | "Dolby Vision">;
  /** Audio configurations */
  audio?: Array<"Stereo" | "5.1" | "7.1" | "Atmos">;
  /** Collection or franchise ID */
  collectionId?: string;
  /** Sorting mode */
  sort?: SearchSortOption;
  /** Pagination */
  page?: number;
  limit?: number;
}

// ─── Search Result Entity Types (Section 64) ─────────────────────────────────

export type SearchEntityType =
  | "title"
  | "person"
  | "company"
  | "network"
  | "genre"
  | "keyword"
  | "collection"
  | "provider";

export interface SearchEntityResult {
  entityType: SearchEntityType;
  entityId: string;
  displayName: string;
  originalName?: string;
  subtitle?: string;
  imagePath?: string | null;
  score: number;             // Relevance match score (0 - 100)
  route: string;             // Client navigation route (e.g., '/title/abc-123')
  mediaType?: CanonicalMediaType;
  year?: string;
  rating?: number;
  region?: string;
  badge?: string;
  metadata?: Record<string, unknown>;
}

export interface GroupedSearchResults {
  query: string;
  totalHits: number;
  topResult?: SearchEntityResult | null;
  movies: SearchEntityResult[];
  shows: SearchEntityResult[];
  anime: SearchEntityResult[];
  documentaries: SearchEntityResult[];
  people: SearchEntityResult[];
  studios: SearchEntityResult[];
  networks: SearchEntityResult[];
  collections: SearchEntityResult[];
  keywords: SearchEntityResult[];
  providers: SearchEntityResult[];
}
