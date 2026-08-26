export type MediaType = "all" | "movie" | "tv" | "anime" | "animation" | "documentary";

export interface MediaItem {
  id: number | string;
  title: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  overview: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  media_type?: "movie" | "tv" | "anime" | "person";
  origin_country?: string[];
  original_language?: string;
  adult?: boolean;
  popularity?: number;
  isLocalFile?: boolean;
  localPath?: string;
  quality?: string;
  character?: string;
  job?: string;
}

export interface Genre {
  id: number;
  name: string;
  icon?: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string | null;
  order: number;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path?: string | null;
  air_date?: string;
  vote_average: number;
  runtime?: number;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path?: string | null;
  episode_count: number;
  air_date?: string;
  episodes?: Episode[];
}

export interface Network {
  id: number;
  name: string;
  logo_path?: string | null;
  origin_country?: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path?: string | null;
  origin_country?: string;
}

export interface MovieDetails extends MediaItem {
  tagline?: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  status?: string;
  original_language?: string;
  genres: Genre[];
  production_companies?: ProductionCompany[];
  credits?: {
    cast: CastMember[];
  };
  recommendations?: {
    results: MediaItem[];
  };
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
  } | null;
  collection?: FranchiseCollection | null;
}

export interface TvDetails extends MediaItem {
  tagline?: string;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  original_language?: string;
  genres: Genre[];
  seasons: Season[];
  last_air_date?: string;
  next_episode_to_air?: Episode | null;
  last_episode_to_air?: Episode | null;
  networks?: Network[];
  production_companies?: ProductionCompany[];
  credits?: {
    cast: CastMember[];
  };
  recommendations?: {
    results: MediaItem[];
  };
}

export interface FranchiseCollection {
  id: number;
  name: string;
  overview: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  parts: MediaItem[];
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday?: string;
  place_of_birth?: string;
  profile_path?: string | null;
  known_for_department: string;
  combined_credits?: {
    cast: MediaItem[];
    crew: MediaItem[];
  };
}
