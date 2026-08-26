export type MatchStatus =
  | "confirmed"        // User confirmed or persistent mapping
  | "high_confidence"  // >= 95%
  | "review_needed"    // 85% - 94%
  | "ambiguous"        // 60% - 84%
  | "unknown";         // < 60%

export interface CandidateMatch {
  tmdbId: number;
  title: string;
  originalTitle?: string;
  mediaType: "movie" | "tv";
  year: string;
  score: number; // 0 - 100
  posterPath?: string | null;
  overview?: string;
  matchSignals: {
    titleSimilarity: number;
    yearMatch: number;
    typeMatch: number;
    seasonEpisodeMatch: number;
    popularityBonus: number;
  };
}

export interface ParsedFilenameMetadata {
  rawFilename: string;
  cleanedTitle: string;
  mediaType: "movie" | "tv" | "anime";
  year?: string;
  season?: number;
  episode?: number;
  isOvaOrSpecial?: boolean;
  edition?: string;
  quality: string;
  extension: string;
}

export interface LocalMediaIdentity {
  localMediaId: string;
  fileFingerprint: string;
  fullPath: string;
  fileName: string;
  sizeBytes: number;
  sizeFormatted: string;
  mediaType: "movie" | "tv" | "anime";
  canonicalTitle: string;
  year?: string;
  season?: number;
  episode?: number;
  externalMetadataId?: string | number;
  posterPath?: string;
  backdropPath?: string;
  overview?: string;
  matchConfidence: number; // 0 - 100
  matchStatus: MatchStatus;
  candidates: CandidateMatch[];
  isUserOverridden: boolean;
  createdAt: string;
  lastScannedAt: string;
}
