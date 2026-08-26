/**
 * LANTAWON LANG — CANONICAL DOMAIN TYPES
 * 
 * Master domain entities decoupled from external metadata APIs.
 * Invariant: Internal Content ID (UUID) is the canonical primary key.
 * External IDs (TMDB, IMDB, MAL, etc.) are mapped separately via ContentExternalId.
 */

// ─── Content Classification & Types ──────────────────────────────────────────

export type CanonicalMediaType =
  | "movie"
  | "tv"
  | "episode"
  | "anime"
  | "anime_episode"
  | "cartoon"
  | "documentary"
  | "special"
  | "short";

export type ContentStatus =
  | "released"
  | "upcoming"
  | "in_production"
  | "post_production"
  | "returning_series"
  | "ended"
  | "canceled"
  | "planned";

export type ContentMedium =
  | "film"
  | "series"
  | "anime"
  | "cartoon"
  | "documentary"
  | "special";

// ─── Master Canonical Content Entity ─────────────────────────────────────────

export interface CanonicalContent {
  id: string; // UUID (canonical internal primary key)
  contentType: CanonicalMediaType;
  title: string;
  originalTitle?: string;
  originalLanguage?: string; // ISO 639-1 (e.g., 'en', 'ja', 'ko', 'tl')
  synopsis: string;
  tagline?: string;
  releaseDate?: string;      // YYYY-MM-DD (Movies / Short films)
  firstAirDate?: string;     // YYYY-MM-DD (TV / Anime Series)
  lastAirDate?: string;      // YYYY-MM-DD
  runtimeMinutes?: number;
  certification?: string;    // MPAA / MTRCB (e.g. 'PG-13', 'R', 'TV-MA')
  status: ContentStatus;
  popularityScore: number;
  voteAverage: number;
  voteCount: number;
  revenue?: number;
  budget?: number;
  adultFlag: boolean;
  posterPath?: string | null;
  backdropPath?: string | null;
  trailerUrl?: string | null;
  metadataSource: string;    // 'tmdb' | 'internal' | 'custom'
  metadataSourceId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Decoupled External ID Mapping ───────────────────────────────────────────

export type ExternalSourceType = "tmdb" | "imdb" | "mal" | "tvdb" | "anilist" | "internal" | "custom";

export interface ContentExternalId {
  id?: string;
  contentId: string;         // References CanonicalContent.id
  source: ExternalSourceType;
  externalId: string;
  fetchedAt: string;
  payloadHash?: string;
}

// ─── TV Seasons & Episodes Hierarchy ─────────────────────────────────────────

export interface CanonicalSeason {
  id: string;
  contentId: string;         // References CanonicalContent.id
  seasonNumber: number;
  name: string;
  overview?: string;
  posterPath?: string | null;
  airDate?: string;
  episodeCount: number;
  episodes?: CanonicalEpisode[];
}

export interface CanonicalEpisode {
  id: string;
  contentId: string;         // References CanonicalContent.id
  seasonId: string;          // References CanonicalSeason.id
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview?: string;
  airDate?: string;
  runtimeMinutes?: number;
  stillPath?: string | null;
  voteAverage: number;
  voteCount: number;
  watched?: boolean;
  progressSeconds?: number;
}

// ─── People & Filmography Credits Database ───────────────────────────────────

export type DepartmentType =
  | "acting"
  | "directing"
  | "writing"
  | "producing"
  | "sound_music"
  | "camera_visuals"
  | "editing"
  | "art_animation"
  | "creator"
  | "crew";

export interface CanonicalPerson {
  id: string;
  externalId?: string;
  displayName: string;
  profilePath?: string | null;
  biography?: string;
  birthday?: string;
  deathday?: string;
  birthplace?: string;
  knownForDepartment: DepartmentType;
  gender?: number;           // 1: Female, 2: Male, 3: Non-binary, 0: Unspecified
  popularity: number;
  source: string;
  updatedAt: string;
}

export interface PersonAlias {
  personId: string;
  alias: string;
  language?: string;
}

export interface CanonicalCredit {
  id: string;
  personId: string;          // References CanonicalPerson.id
  contentId: string;         // References CanonicalContent.id
  department: DepartmentType;
  job: string;               // e.g., 'Director', 'Screenplay', 'Executive Producer'
  characterName?: string;    // for actors / voice actors
  creditOrder: number;
  person?: CanonicalPerson;
  content?: CanonicalContent;
}

// ─── Companies, Studios & Networks Database ──────────────────────────────────

export type CompanyType =
  | "studio"
  | "production_company"
  | "network"
  | "broadcaster"
  | "distributor"
  | "streamer"
  | "publisher";

export interface CanonicalCompany {
  id: string;
  externalId?: string;
  name: string;
  logoPath?: string | null;
  countryCode?: string;      // ISO 3166-1 alpha-2
  companyType: CompanyType;
  parentCompanyId?: string;
  description?: string;
  website?: string;
  updatedAt: string;
}

// ─── Streaming Availability Hub (Where to Watch) ─────────────────────────────

export type AvailabilityType =
  | "subscription"
  | "free"
  | "free_with_ads"
  | "rent"
  | "buy"
  | "broadcast"
  | "official_source"
  | "user_local";

export interface CanonicalProvider {
  id: string;
  name: string;
  logoPath?: string | null;
  website?: string;
  providerType: "streamer" | "vod_store" | "tv_network" | "free_platform";
}

export interface ContentAvailability {
  id: string;
  contentId: string;
  episodeId?: string | null;
  providerId: string;
  countryCode: string;       // ISO 3166-1 alpha-2 (e.g. 'PH', 'US', 'JP')
  availabilityType: AvailabilityType;
  deepLink?: string;
  price?: number | null;
  currency?: string | null;
  qualityBadge?: string;     // '4K', 'HD', 'SD'
  lastCheckedAt: string;
  provider?: CanonicalProvider;
}

// ─── Technical Media Specifications ──────────────────────────────────────────

export type HdrType = "none" | "HDR" | "HDR10" | "HDR10+" | "Dolby Vision";
export type AudioFormat = "Stereo" | "5.1" | "7.1" | "Dolby Atmos" | "DTS:X";

export interface CanonicalMediaSpecs {
  contentId: string;
  sourceId?: string | null;
  resolution: "480p" | "720p" | "1080p" | "1440p" | "4K";
  width?: number;
  height?: number;
  hdrType: HdrType;
  videoCodec?: string;       // 'H.264', 'H.265 / HEVC', 'AV1', 'VP9'
  audioCodec?: string;       // 'AAC', 'E-AC-3', 'FLAC', 'TrueHD'
  audioChannels: AudioFormat;
  aspectRatio?: string;      // '16:9', '2.39:1', '4:3'
  frameRate?: number;        // 23.976, 24, 60
  bitrateKbps?: number;
  subtitleLanguages: string[];
}

// ─── Content Advisory & Age Ratings ──────────────────────────────────────────

export type AdvisoryType =
  | "violence"
  | "gore"
  | "nudity"
  | "sexual_content"
  | "profanity"
  | "substance_use"
  | "frightening_content"
  | "mature_themes"
  | "self_harm";

export type AdvisorySeverity = "none" | "mild" | "moderate" | "severe";

export interface CanonicalAdvisory {
  contentId: string;
  advisoryType: AdvisoryType;
  severity: AdvisorySeverity;
  source: string;
  notes?: string;
}

// ─── Collections, Franchises & Universes ─────────────────────────────────────

export type CollectionType =
  | "franchise"
  | "universe"
  | "saga"
  | "editorial"
  | "genre_collection"
  | "decade"
  | "country"
  | "seasonal";

export interface CanonicalCollection {
  id: string;
  name: string;
  description?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  collectionType: CollectionType;
  items?: CollectionItem[];
}

export interface CollectionItem {
  collectionId: string;
  contentId: string;
  position: number;
  relationshipType: "prequel" | "sequel" | "spinoff" | "main_canon" | "entry";
  content?: CanonicalContent;
}
