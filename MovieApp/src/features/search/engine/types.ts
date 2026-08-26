import type { MediaItem } from "@/types/media";

export type QueryIntentType =
  | "TITLE_DIRECT"
  | "PERSON_SEARCH"
  | "SIMILARITY_SEARCH"
  | "GENRE_COUNTRY"
  | "MOOD_THEME"
  | "NATURAL_LANGUAGE"
  | "COLLECTION_SEARCH";

export interface SearchAST {
  rawQuery: string;
  normalizedQuery: string;
  intentType: QueryIntentType;
  seedTitle?: string;
  personName?: string;
  mediaType: "all" | "movie" | "tv" | "anime" | "animation" | "documentary";
  genres: number[];
  genreNames: string[];
  genreLogic: "ANY" | "ALL";
  country?: string;
  language?: string;
  yearStart?: number;
  yearEnd?: number;
  decade?: string;
  minRating?: number;
  mood?: string;
  status?: string;
  certification?: string;
  withoutGore?: boolean;
  withoutNudity?: boolean;
  explanation: string[];
}

export interface UniversalFilterParams {
  q?: string;
  tab?: string;
  type?: string;
  media_type?: string;
  genre?: string;
  genres?: string;
  year?: string;
  month?: string;
  year_start?: string;
  year_end?: string;
  era?: string;
  decade?: string;
  country?: string;
  origin_country?: string;
  language?: string;
  min_rating?: string;

  rating?: string;
  sort_by?: string;
  sort?: string;
  status?: string;
  company?: string;
  network?: string;
  personal_filter?: "all" | "watchlist" | "favorites" | "watched" | "local";
  page?: string | number;
}

export interface SearchTabCounts {
  all: number;
  movie: number;
  tv: number;
  anime: number;
  person: number;
  collection: number;
}

export interface SmartRelaxationSuggestion {
  label: string;
  action: "lower_rating" | "expand_year" | "clear_genre" | "include_all_media";
  modifiedParams: Record<string, string>;
  message: string;
}

export interface UnifiedSearchResponse {
  success: boolean;
  ast: SearchAST;
  tab: string;
  tabCounts: SearchTabCounts;
  didYouMean?: {
    suggested: string;
    original: string;
  };
  results: MediaItem[];
  people?: Array<{
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
    known_for: MediaItem[];
  }>;
  collections?: Array<{
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview?: string;
  }>;
  relaxation?: SmartRelaxationSuggestion[];
  totalResults: number;
  page: number;
  totalPages: number;
}

export type SearchLayoutViewMode = "grid" | "list" | "compact";
