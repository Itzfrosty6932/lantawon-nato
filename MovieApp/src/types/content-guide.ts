export type RatingSystem =
  | "MTRCB"
  | "MPAA"
  | "BBFC"
  | "TV_PG"
  | "KMRB"
  | "OTHER";

export type SeverityLevel =
  | "none"
  | "mild"
  | "moderate"
  | "strong"
  | "severe"
  | "unknown";

export type ProvenanceSource =
  | "official_source"
  | "trusted_metadata"
  | "curated_metadata"
  | "local_video_analysis"
  | "ai_inference"
  | "user_correction";

export interface OfficialRatingRecord {
  system: RatingSystem;
  value: string;
  region: string;
  source: string;
  verified: boolean;
  meaning?: string;
}

export interface DimensionProvenance {
  level: SeverityLevel;
  source: ProvenanceSource;
  confidence: number; // 0.0 - 1.0
  timestamp: string;
  verified: boolean;
  explanation?: string;
}

export interface ContentDimensions {
  theme: SeverityLevel;
  language: SeverityLevel;
  violence: SeverityLevel;
  sexualContent: SeverityLevel;
  horror: SeverityLevel;
  drugs: SeverityLevel;
}

export type ContentFlag =
  | "strong-language"
  | "profanity"
  | "violence"
  | "graphic-violence"
  | "gore"
  | "torture"
  | "horror"
  | "jumpscare"
  | "disturbing-imagery"
  | "nudity"
  | "sexual-content"
  | "sexual-references"
  | "romance"
  | "drug-use"
  | "drug-references"
  | "smoking"
  | "alcohol"
  | "self-harm"
  | "suicide"
  | "domestic-abuse"
  | "bullying"
  | "crime"
  | "weapons"
  | "war"
  | "death"
  | "blood"
  | "body-horror"
  | "psychological-distress";

export interface SceneAdvisoryEvent {
  startTimeSec: number;
  endTimeSec: number;
  dimension: keyof ContentDimensions;
  severity: SeverityLevel;
  flags: ContentFlag[];
  confidence: number;
  description?: string;
}

export interface ContentClassification {
  mediaId: string;
  mediaType: "movie" | "tv" | "anime" | "documentary";
  officialRatings: OfficialRatingRecord[];
  primaryRating?: string;
  primaryRatingSystem?: RatingSystem;
  dimensions: ContentDimensions;
  dimensionProvenance: Record<keyof ContentDimensions, DimensionProvenance>;
  flags: ContentFlag[];
  sceneEvents?: SceneAdvisoryEvent[];
  overallSeverity: SeverityLevel;
  analysisStatus: "not_analyzed" | "partially_analyzed" | "analyzed" | "needs_review";
  isUserOverridden: boolean;
  lastUpdated: string;
}
