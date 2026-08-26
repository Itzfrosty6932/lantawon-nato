/**
 * LANTAWON LANG — SEARCH AUTOCOMPLETE & SMART RELAXATION
 * 
 * Instant suggestion generator, spellcheck relaxation, and query expansion. (Sections 82, 84)
 */

import { CORE_GENRES, ANIME_TAXONOMY, CONTENT_THEMES, ISO_COUNTRIES } from "../../lib/constants/taxonomies";
import type { SearchQueryObject } from "../../types/search-contract";

export interface AutocompleteSuggestion {
  text: string;
  type: "title" | "genre" | "person" | "country" | "theme" | "anime";
  label: string;
  badge?: string;
}

export interface SmartRelaxationSuggestion {
  label: string;
  action: "lower_rating" | "expand_year" | "clear_genre" | "include_all_media";
  modifiedParams: Partial<SearchQueryObject>;
  message: string;
}

export class SearchSuggestionEngine {
  /**
   * Generates instant autocomplete suggestions based on partial text input.
   */
  static getAutocomplete(partialQuery: string, limit = 8): AutocompleteSuggestion[] {
    const q = (partialQuery || "").toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const suggestions: AutocompleteSuggestion[] = [];

    // 1. Check Core Genres
    CORE_GENRES.forEach((genre) => {
      if (genre.name.toLowerCase().includes(q)) {
        suggestions.push({
          text: genre.name,
          type: "genre",
          label: `${genre.name} Movies & Series`,
          badge: "Genre",
        });
      }
    });

    // 2. Check Anime Taxonomy
    ANIME_TAXONOMY.forEach((anime) => {
      if (anime.name.toLowerCase().includes(q)) {
        suggestions.push({
          text: anime.name,
          type: "anime",
          label: `${anime.name} Anime`,
          badge: "Anime Tag",
        });
      }
    });

    // 3. Check Content Themes
    CONTENT_THEMES.forEach((theme) => {
      if (theme.name.toLowerCase().includes(q)) {
        suggestions.push({
          text: theme.name,
          type: "theme",
          label: `${theme.name} Cinema`,
          badge: "Theme",
        });
      }
    });

    // 4. Check Countries
    ISO_COUNTRIES.forEach((country) => {
      if (country.name.toLowerCase().includes(q)) {
        suggestions.push({
          text: country.name,
          type: "country",
          label: `Cinema from ${country.name}`,
          badge: country.flagEmoji || "Country",
        });
      }
    });

    return suggestions.slice(0, limit);
  }

  /**
   * Generates smart query relaxation advice when a search produces zero or minimal results.
   */
  static getRelaxationAdvice(query: SearchQueryObject, resultCount: number): SmartRelaxationSuggestion[] {
    if (resultCount > 3) return [];

    const suggestions: SmartRelaxationSuggestion[] = [];

    if (query.ratingMin && query.ratingMin >= 7.5) {
      suggestions.push({
        label: "Lower Minimum Rating",
        action: "lower_rating",
        modifiedParams: { ...query, ratingMin: 6.0 },
        message: "Try including titles with a 6.0+ user score.",
      });
    }

    if (query.yearFrom && query.yearTo && query.yearTo - query.yearFrom <= 2) {
      suggestions.push({
        label: "Expand Year Range",
        action: "expand_year",
        modifiedParams: {
          ...query,
          yearFrom: query.yearFrom - 5,
          yearTo: query.yearTo + 5,
        },
        message: "Broaden the release window by ±5 years.",
      });
    }

    if (query.genres && query.genres.length > 2) {
      suggestions.push({
        label: "Reduce Genre Filters",
        action: "clear_genre",
        modifiedParams: { ...query, genres: [query.genres[0]] },
        message: "Filter by only primary genre.",
      });
    }

    return suggestions;
  }
}
