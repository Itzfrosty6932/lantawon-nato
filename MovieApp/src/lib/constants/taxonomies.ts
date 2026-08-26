/**
 * LANTAWON LANG — TAXONOMY & NORMALIZATION REGISTRIES
 * 
 * Hierarchical genre definitions, anime tags, themes, ISO country codes,
 * and language constants. Corresponds to Sections 7, 9, 11, 24 of the blueprint.
 */

// ─── Core Genres ─────────────────────────────────────────────────────────────

export interface TaxonomyEntry {
  id: string;
  name: string;
  tmdbId?: number;
  description?: string;
}

export const CORE_GENRES: TaxonomyEntry[] = [
  { id: "action", name: "Action", tmdbId: 28 },
  { id: "adventure", name: "Adventure", tmdbId: 12 },
  { id: "animation", name: "Animation", tmdbId: 16 },
  { id: "comedy", name: "Comedy", tmdbId: 35 },
  { id: "crime", name: "Crime", tmdbId: 80 },
  { id: "drama", name: "Drama", tmdbId: 18 },
  { id: "family", name: "Family", tmdbId: 10751 },
  { id: "fantasy", name: "Fantasy", tmdbId: 14 },
  { id: "history", name: "History", tmdbId: 36 },
  { id: "horror", name: "Horror", tmdbId: 27 },
  { id: "music", name: "Music", tmdbId: 10402 },
  { id: "mystery", name: "Mystery", tmdbId: 9648 },
  { id: "romance", name: "Romance", tmdbId: 10749 },
  { id: "sci-fi", name: "Science Fiction", tmdbId: 878 },
  { id: "thriller", name: "Thriller", tmdbId: 53 },
  { id: "war", name: "War", tmdbId: 10752 },
  { id: "western", name: "Western", tmdbId: 37 },
  { id: "reality", name: "Reality TV", tmdbId: 10764 }
];

// ─── Anime Taxonomy ──────────────────────────────────────────────────────────

export const ANIME_TAXONOMY: TaxonomyEntry[] = [
  { id: "isekai", name: "Isekai", description: "Transported to another world" },
  { id: "shounen", name: "Shounen", description: "Young male demographic" },
  { id: "seinen", name: "Seinen", description: "Mature adult demographic" },
  { id: "shoujo", name: "Shoujo", description: "Young female demographic" },
  { id: "josei", name: "Josei", description: "Adult female demographic" },
  { id: "mecha", name: "Mecha", description: "Giant robots & machines" },
  { id: "slice_of_life", name: "Slice of Life", description: "Everyday moments" },
  { id: "mahou_shoujo", name: "Mahou Shoujo", description: "Magical girl" },
  { id: "iyashikei", name: "Iyashikei", description: "Healing and soothing" },
  { id: "psychological", name: "Psychological", description: "Mind games & tension" },
  { id: "sports", name: "Sports", description: "Athletics and competition" },
  { id: "super_power", name: "Super Power", description: "Extraordinary abilities" },
  { id: "supernatural", name: "Supernatural", description: "Occult and ghosts" },
  { id: "time_travel", name: "Time Travel", description: "Chronological leaps" },
  { id: "cgdct", name: "Cute Girls Doing Cute Things" }
];

// ─── Content Tone & Themes ───────────────────────────────────────────────────

export const CONTENT_THEMES: TaxonomyEntry[] = [
  { id: "dark", name: "Dark" },
  { id: "lighthearted", name: "Lighthearted" },
  { id: "feel_good", name: "Feel-Good" },
  { id: "gritty", name: "Gritty" },
  { id: "intense", name: "Intense" },
  { id: "emotional", name: "Emotional" },
  { id: "suspenseful", name: "Suspenseful" },
  { id: "experimental", name: "Experimental" },
  { id: "mythology", name: "Mythology & Folklore" },
  { id: "organized_crime", name: "Organized Crime" },
  { id: "urban_fantasy", name: "Urban Fantasy" },
  { id: "survival", name: "Survival" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "space_opera", name: "Space Opera" },
  { id: "post_apocalyptic", name: "Post-Apocalyptic" }
];

// ─── ISO 3166-1 Alpha-2 Country Codes ────────────────────────────────────────

export interface CountryEntry {
  code: string;
  name: string;
  flagEmoji?: string;
}

export const ISO_COUNTRIES: CountryEntry[] = [
  { code: "PH", name: "Philippines", flagEmoji: "🇵🇭" },
  { code: "US", name: "United States", flagEmoji: "🇺🇸" },
  { code: "JP", name: "Japan", flagEmoji: "🇯🇵" },
  { code: "KR", name: "South Korea", flagEmoji: "🇰🇷" },
  { code: "GB", name: "United Kingdom", flagEmoji: "🇬🇧" },
  { code: "FR", name: "France", flagEmoji: "🇫🇷" },
  { code: "IN", name: "India", flagEmoji: "🇮🇳" },
  { code: "IT", name: "Italy", flagEmoji: "🇮🇹" },
  { code: "ES", name: "Spain", flagEmoji: "🇪🇸" },
  { code: "DE", name: "Germany", flagEmoji: "🇩🇪" },
  { code: "CN", name: "China", flagEmoji: "🇨🇳" },
  { code: "TH", name: "Thailand", flagEmoji: "🇹🇭" },
  { code: "TW", name: "Taiwan", flagEmoji: "🇹🇼" },
  { code: "HK", name: "Hong Kong", flagEmoji: "🇭🇰" },
  { code: "CA", name: "Canada", flagEmoji: "🇨🇦" },
  { code: "AU", name: "Australia", flagEmoji: "🇦🇺" },
  { code: "BR", name: "Brazil", flagEmoji: "🇧🇷" },
  { code: "MX", name: "Mexico", flagEmoji: "🇲🇽" }
];

// ─── ISO 639-1 Language Codes ────────────────────────────────────────────────

export interface LanguageEntry {
  code: string;
  name: string;
  nativeName?: string;
}

export const ISO_LANGUAGES: LanguageEntry[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "tl", name: "Filipino / Tagalog", nativeName: "Tagalog" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Mandarin Chinese", nativeName: "中文" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "th", name: "Thai", nativeName: "ไทย" }
];

// ─── Rating Presets ──────────────────────────────────────────────────────────

export const RATING_PRESETS = [
  { label: "9.0+ Masterpiece", value: 9.0 },
  { label: "8.5+ Acclaimed", value: 8.5 },
  { label: "8.0+ Outstanding", value: 8.0 },
  { label: "7.5+ Very Good", value: 7.5 },
  { label: "7.0+ Recommended", value: 7.0 },
  { label: "6.0+ Good", value: 6.0 },
  { label: "5.0+ Average", value: 5.0 }
];
