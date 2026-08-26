export interface TaxonomyFormat {
  id: string;
  name: string;
  badge: string;
}

export interface TaxonomyGenre {
  id: number | string; // number = TMDB genre ID, string = anime keyword
  name: string;
  category: "universal" | "anime";
  tmdbKeyword?: number; // TMDB keyword ID for keyword-based filter
}

export interface TaxonomyEra {
  id: string;
  label: string;
  range: string;
  shortLabel: string;
}

export interface TaxonomyRegion {
  code: string;
  label: string;
  name?: string;
  flag: string;
}

export interface TaxonomyMood {
  id: string;
  label: string;
  emoji: string;
}

export const TAXONOMY = {
  formats: [
    { id: "all",         name: "All Formats",    badge: "Universal" },
    { id: "movie",       name: "Feature Films",   badge: "Cinema" },
    { id: "tv",          name: "TV & Series",     badge: "Episodic" },
    { id: "anime",       name: "Anime",           badge: "Japanese" },
    { id: "animation",   name: "Cartoons",        badge: "Animated" },
  ] as TaxonomyFormat[],

  // ── Universal genres (TMDB native genre IDs) ──────────────────────────────
  genres: [
    // Standard/Universal
    { id: 28,    name: "Action",         category: "universal" },
    { id: 12,    name: "Adventure",      category: "universal" },
    { id: 35,    name: "Comedy",         category: "universal" },
    { id: 80,    name: "Crime",          category: "universal" },
    { id: 18,    name: "Drama",          category: "universal" },
    { id: 10751, name: "Family",         category: "universal" },
    { id: 14,    name: "Fantasy",        category: "universal" },
    { id: 36,    name: "History",        category: "universal" },
    { id: 27,    name: "Horror",         category: "universal" },
    { id: 10402, name: "Music",          category: "universal" },
    { id: 9648,  name: "Mystery",        category: "universal" },
    { id: 10749, name: "Romance",        category: "universal" },
    { id: 878,   name: "Sci-Fi",         category: "universal" },
    { id: 53,    name: "Thriller",       category: "universal" },
    { id: 10752, name: "War",            category: "universal" },
    { id: 37,    name: "Western",        category: "universal" },
    { id: 16,    name: "Animation",      category: "universal" },
    { id: 10765, name: "Sci-Fi & Fantasy (TV)", category: "universal" },
    { id: 10759, name: "Action & Adventure (TV)", category: "universal" },
    { id: 10768, name: "War & Politics", category: "universal" },
    { id: 10764, name: "Reality",        category: "universal" },
    { id: 10762, name: "Kids",           category: "universal" },
    { id: "sports", name: "Sports",      category: "universal", tmdbKeyword: 6075 },

    // ── Anime & Manga Themes (keyword-based) ─────────────────────────────
    { id: "anime_action",         name: "Action",         category: "anime", tmdbKeyword: 210024 },
    { id: "anime_adult_cast",     name: "Adult Cast",     category: "anime" },
    { id: "anime_adventure",      name: "Adventure",      category: "anime" },
    { id: "anime_anthropomorphic",name: "Anthropomorphic",category: "anime" },
    { id: "anime_avant_garde",    name: "Avant Garde",    category: "anime" },
    { id: "anime_boys_love",      name: "Boys Love",      category: "anime", tmdbKeyword: 9715 },
    { id: "anime_cgdct",          name: "CGDCT",          category: "anime" },
    { id: "anime_comedy",         name: "Comedy",         category: "anime" },
    { id: "anime_drama",          name: "Drama",          category: "anime" },
    { id: "anime_ecchi",          name: "Ecchi",          category: "anime", tmdbKeyword: 9717 },
    { id: "anime_erotica",        name: "Erotica",        category: "anime" },
    { id: "anime_fantasy",        name: "Fantasy",        category: "anime" },
    { id: "anime_girls_love",     name: "Girls Love",     category: "anime", tmdbKeyword: 9716 },
    { id: "anime_gore",           name: "Gore",           category: "anime" },
    { id: "anime_gourmet",        name: "Gourmet",        category: "anime" },
    { id: "anime_harem",          name: "Harem",          category: "anime", tmdbKeyword: 9718 },
    { id: "anime_historical",     name: "Historical",     category: "anime" },
    { id: "anime_horror",         name: "Horror",         category: "anime" },
    { id: "anime_isekai",         name: "Isekai",         category: "anime", tmdbKeyword: 226917 },
    { id: "anime_iyashikei",      name: "Iyashikei",      category: "anime" },
    { id: "anime_josei",          name: "Josei",          category: "anime", tmdbKeyword: 9721 },
    { id: "anime_love_status_quo",name: "Love Status Quo",category: "anime" },
    { id: "anime_mahou_shoujo",   name: "Mahou Shoujo",   category: "anime", tmdbKeyword: 210025 },
    { id: "anime_martial_arts",   name: "Martial Arts",   category: "anime", tmdbKeyword: 9714 },
    { id: "anime_mecha",          name: "Mecha",          category: "anime", tmdbKeyword: 9713 },
    { id: "anime_military",       name: "Military",       category: "anime", tmdbKeyword: 9726 },
    { id: "anime_music",          name: "Music",          category: "anime" },
    { id: "anime_mystery",        name: "Mystery",        category: "anime" },
    { id: "anime_mythology",      name: "Mythology",      category: "anime" },
    { id: "anime_organized_crime",name: "Organized Crime",category: "anime" },
    { id: "anime_otaku_culture",  name: "Otaku Culture",  category: "anime" },
    { id: "anime_parody",         name: "Parody",         category: "anime" },
    { id: "anime_performing_arts",name: "Performing Arts",category: "anime" },
    { id: "anime_psychological",  name: "Psychological",  category: "anime", tmdbKeyword: 9725 },
    { id: "anime_reincarnation",  name: "Reincarnation",  category: "anime" },
    { id: "anime_romance",        name: "Romance",        category: "anime" },
    { id: "anime_school",         name: "School",         category: "anime", tmdbKeyword: 9723 },
    { id: "anime_sci_fi",         name: "Sci-Fi",         category: "anime" },
    { id: "anime_seinen",         name: "Seinen",         category: "anime", tmdbKeyword: 9720 },
    { id: "anime_shoujo",         name: "Shoujo",         category: "anime", tmdbKeyword: 9719 },
    { id: "anime_shounen",        name: "Shounen",        category: "anime", tmdbKeyword: 9712 },
    { id: "anime_slice_of_life",  name: "Slice of Life",  category: "anime", tmdbKeyword: 9722 },
    { id: "anime_sports",         name: "Sports",         category: "anime", tmdbKeyword: 6075 },
    { id: "anime_super_power",    name: "Super Power",    category: "anime" },
    { id: "anime_supernatural",   name: "Supernatural",   category: "anime", tmdbKeyword: 9724 },
    { id: "anime_suspense",       name: "Suspense",       category: "anime" },
    { id: "anime_time_travel",    name: "Time Travel",    category: "anime" },
    { id: "anime_urban_fantasy",  name: "Urban Fantasy",  category: "anime" },
    { id: "anime_villainess",     name: "Villainess",     category: "anime" },
    { id: "anime_visual_arts",    name: "Visual Arts",    category: "anime" },
  ] as TaxonomyGenre[],

  // ── Eras ─────────────────────────────────────────────────────────────────
  eras: [
    { id: "all-time",   label: "All Eras (1890–Present)",         shortLabel: "All Eras",  range: "1890-2026" },
    { id: "latest",     label: "Latest (2024–2026)",              shortLabel: "Latest",    range: "2024-2026" },
    { id: "2020s",      label: "2020s  (2020–2029)",              shortLabel: "2020s",     range: "2020-2029" },
    { id: "2010s",      label: "2010s  (2010–2019)",              shortLabel: "2010s",     range: "2010-2019" },
    { id: "2000s",      label: "2000s  (2000–2009)",              shortLabel: "2000s",     range: "2000-2009" },
    { id: "1990s",      label: "1990s  (1990–1999)",              shortLabel: "1990s",     range: "1990-1999" },
    { id: "1980s",      label: "1980s  (1980–1989)",              shortLabel: "1980s",     range: "1980-1989" },
    { id: "1970s",      label: "1970s  (1970–1979)",              shortLabel: "1970s",     range: "1970-1979" },
    { id: "golden-age", label: "Classic Cinema (1930–1969)",      shortLabel: "Classic",   range: "1930-1969" },
    { id: "silent-era", label: "Silent Film Era (1890–1929)",     shortLabel: "Silent",    range: "1890-1929" },
  ] as TaxonomyEra[],

  // ── Regions ───────────────────────────────────────────────────────────────
  regions: [
    { code: "ALL", label: "Worldwide",       flag: "🌐" },
    { code: "US",  label: "United States",   flag: "🇺🇸" },
    { code: "JP",  label: "Japan",           flag: "🇯🇵" },
    { code: "KR",  label: "South Korea",     flag: "🇰🇷" },
    { code: "CN",  label: "China",           flag: "🇨🇳" },
    { code: "GB",  label: "United Kingdom",  flag: "🇬🇧" },
    { code: "FR",  label: "France",          flag: "🇫🇷" },
    { code: "IN",  label: "India",           flag: "🇮🇳" },
    { code: "PH",  label: "Philippines",     flag: "🇵🇭" },
    { code: "IT",  label: "Italy",           flag: "🇮🇹" },
    { code: "ES",  label: "Spain",           flag: "🇪🇸" },
    { code: "DE",  label: "Germany",         flag: "🇩🇪" },
    { code: "MX",  label: "Mexico",          flag: "🇲🇽" },
    { code: "BR",  label: "Brazil",          flag: "🇧🇷" },
    { code: "TH",  label: "Thailand",        flag: "🇹🇭" },
    { code: "TW",  label: "Taiwan",          flag: "🇹🇼" },
    { code: "HK",  label: "Hong Kong",       flag: "🇭🇰" },
  ] as TaxonomyRegion[],

  moods: [
    { id: "mind-bending",  label: "Mind-Bending",   emoji: "🧠" },
    { id: "dark-gritty",   label: "Dark & Gritty",  emoji: "💀" },
    { id: "feel-good",     label: "Feel-Good",      emoji: "☀️" },
    { id: "adrenaline",    label: "Adrenaline",     emoji: "⚡" },
    { id: "emotional",     label: "Tear-Jerker",    emoji: "😭" },
    { id: "spine-chilling",label: "Spine-Chilling", emoji: "👻" },
    { id: "relaxing",      label: "Cozy & Relaxing",emoji: "☕" },
    { id: "epic-adventure",label: "Epic Worlds",    emoji: "🏔️" },
  ] as TaxonomyMood[],
};

// ── Helpers ────────────────────────────────────────────────────────────────
export const UNIVERSAL_GENRES = TAXONOMY.genres.filter((g) => g.category === "universal");
export const ANIME_GENRES     = TAXONOMY.genres.filter((g) => g.category === "anime");

// Unified, deduplicated full list of all 60+ genres sorted alphabetically
export const ALL_GENRES_ORDERED: { id: string | number; name: string }[] = [
  { id: 28,                       name: "Action" },
  { id: "anime_adult_cast",       name: "Adult Cast" },
  { id: 12,                       name: "Adventure" },
  { id: 16,                       name: "Animation" },
  { id: "anime_anthropomorphic",  name: "Anthropomorphic" },
  { id: "anime_avant_garde",      name: "Avant Garde" },
  { id: "anime_boys_love",        name: "Boys Love (BL)" },
  { id: "anime_cgdct",          name: "CGDCT" },
  { id: 35,                       name: "Comedy" },
  { id: 80,                       name: "Crime" },
  { id: 99,                       name: "Documentary" },
  { id: 18,                       name: "Drama" },
  { id: "anime_ecchi",            name: "Ecchi" },
  { id: "anime_erotica",          name: "Erotica" },
  { id: 10751,                    name: "Family" },
  { id: 14,                       name: "Fantasy" },
  { id: "anime_girls_love",       name: "Girls Love (GL)" },
  { id: "anime_gore",             name: "Gore" },
  { id: "anime_gourmet",          name: "Gourmet" },
  { id: "anime_harem",            name: "Harem" },
  { id: "anime_historical",       name: "Historical" },
  { id: 36,                       name: "History" },
  { id: 27,                       name: "Horror" },
  { id: "anime_isekai",           name: "Isekai" },
  { id: "anime_iyashikei",        name: "Iyashikei" },
  { id: "anime_josei",            name: "Josei" },
  { id: 10762,                    name: "Kids" },
  { id: "anime_love_status_quo",  name: "Love Status Quo" },
  { id: "anime_mahou_shoujo",     name: "Mahou Shoujo" },
  { id: "anime_martial_arts",     name: "Martial Arts" },
  { id: "anime_mecha",            name: "Mecha" },
  { id: "anime_military",         name: "Military" },
  { id: 10402,                    name: "Music" },
  { id: 9648,                     name: "Mystery" },
  { id: "anime_mythology",        name: "Mythology" },
  { id: "anime_organized_crime",  name: "Organized Crime" },
  { id: "anime_otaku_culture",    name: "Otaku Culture" },
  { id: "anime_parody",           name: "Parody" },
  { id: "anime_performing_arts",  name: "Performing Arts" },
  { id: "anime_psychological",    name: "Psychological" },
  { id: 10764,                    name: "Reality" },
  { id: "anime_reincarnation",    name: "Reincarnation" },
  { id: 10749,                    name: "Romance" },
  { id: "anime_school",           name: "School" },
  { id: 878,                      name: "Sci-Fi" },
  { id: 10765,                    name: "Sci-Fi & Fantasy (TV)" },
  { id: 10759,                    name: "Action & Adventure (TV)" },
  { id: "anime_seinen",           name: "Seinen" },
  { id: "anime_shoujo",           name: "Shoujo" },
  { id: "anime_shounen",          name: "Shounen" },
  { id: "anime_slice_of_life",    name: "Slice of Life" },
  { id: "sports",                 name: "Sports" },
  { id: "anime_sports",           name: "Sports (Anime)" },
  { id: "anime_super_power",      name: "Super Power" },
  { id: "anime_supernatural",     name: "Supernatural" },
  { id: "anime_suspense",         name: "Suspense" },
  { id: 53,                       name: "Thriller" },
  { id: "anime_time_travel",      name: "Time Travel" },
  { id: "anime_urban_fantasy",    name: "Urban Fantasy" },
  { id: "anime_villainess",       name: "Villainess" },
  { id: "anime_visual_arts",      name: "Visual Arts" },
  { id: 10752,                    name: "War" },
  { id: 10768,                    name: "War & Politics" },
  { id: 37,                       name: "Western" },
];

/** Returns true if a genre ID string represents an anime keyword genre */
export function isAnimeGenre(id: string | number): boolean {
  return typeof id === "string" && String(id).startsWith("anime_");
}

/** Get the display name for any genre ID */
export function getGenreName(id: string | number): string {
  const found = ALL_GENRES_ORDERED.find((g) => String(g.id) === String(id));
  if (found) return found.name;
  return TAXONOMY.genres.find((g) => String(g.id) === String(id))?.name ?? String(id);
}
