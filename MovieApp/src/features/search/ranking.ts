/**
 * LANTAWON LANG — MULTI-SIGNAL SEARCH RANKING ENGINE
 * 
 * Scores and orders search candidate results using exact matching, fuzzy distance,
 * popularity logarithmic weighting, regional affinity, and query intent. (Sections 10, 63, 82)
 */

import type { MediaItem } from "@/types/media";
import type { SearchSortOption } from "@/types/search-contract";
import type { SearchAST } from "./parser";

export interface RankedMediaItem extends MediaItem {
  _relevanceScore?: number;
  _scoreBreakdown?: {
    exactMatch: number;
    prefixMatch: number;
    fuzzyMatch: number;
    popularityBonus: number;
    ratingBonus: number;
    regionBonus: number;
  };
}

export class SearchRankingEngine {
  /**
   * Calculates Levenshtein distance for fuzzy typo correction and match scoring.
   */
  static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    const lenA = a.length;
    const lenB = b.length;

    for (let i = 0; i <= lenB; i++) matrix[i] = [i];
    for (let j = 0; j <= lenA; j++) matrix[0][j] = j;

    for (let i = 1; i <= lenB; i++) {
      for (let j = 1; j <= lenA; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion / deletion
          );
        }
      }
    }

    return matrix[lenB][lenA];
  }

  /**
   * Computes a multi-signal relevance score (0 - 100+) for a single item against a search query.
   */
  static scoreItem(item: MediaItem, query: string, ast?: SearchAST, userRegion = "PH"): RankedMediaItem {
    const title = (item.title || item.original_title || item.name || "").toLowerCase().trim();
    const cleanQuery = query.toLowerCase().trim();

    let exactMatch = 0;
    let prefixMatch = 0;
    let fuzzyMatch = 0;
    let popularityBonus = 0;
    let ratingBonus = 0;
    let regionBonus = 0;

    if (cleanQuery) {
      if (title === cleanQuery) {
        exactMatch = 100;
      } else if (title.startsWith(cleanQuery)) {
        prefixMatch = 75;
      } else if (title.includes(cleanQuery)) {
        prefixMatch = 50;
      } else {
        // Fuzzy distance calculation
        const distance = this.levenshtein(title, cleanQuery);
        const maxLen = Math.max(title.length, cleanQuery.length);
        if (maxLen > 0) {
          const similarity = Math.max(0, 1 - distance / maxLen);
          if (similarity >= 0.7) {
            fuzzyMatch = Math.round(similarity * 60);
          }
        }
      }
    }

    // Popularity Logarithmic scale (0 to 15 bonus points)
    if (item.popularity && item.popularity > 0) {
      popularityBonus = Math.min(15, Math.round(Math.log10(item.popularity + 1) * 5));
    }

    // Rating quality bonus (0 to 10 points)
    if (item.vote_average && item.vote_average >= 7.0 && (item.vote_count || 0) >= 50) {
      ratingBonus = Math.min(10, Math.round((item.vote_average - 6.0) * 2.5));
    }

    // Region affinity bonus
    if (userRegion && item.origin_country?.includes(userRegion)) {
      regionBonus = 5;
    }

    const totalScore = exactMatch + prefixMatch + fuzzyMatch + popularityBonus + ratingBonus + regionBonus;

    return {
      ...item,
      _relevanceScore: totalScore,
      _scoreBreakdown: {
        exactMatch,
        prefixMatch,
        fuzzyMatch,
        popularityBonus,
        ratingBonus,
        regionBonus,
      },
    };
  }

  /**
   * Ranks and sorts an array of media items based on the requested sort option.
   */
  static rankAndSort(
    items: MediaItem[],
    query: string,
    sortOption: SearchSortOption = "relevance",
    ast?: SearchAST,
    userRegion = "PH"
  ): MediaItem[] {
    if (!items || items.length === 0) return [];

    // Score all items
    const scored = items.map((item) => this.scoreItem(item, query, ast, userRegion));

    // Sort according to requested option
    return scored.sort((a, b) => {
      switch (sortOption) {
        case "popularity_desc":
          return (b.popularity || 0) - (a.popularity || 0);

        case "popularity_asc":
          return (a.popularity || 0) - (b.popularity || 0);

        case "rating_desc":
          return (b.vote_average || 0) - (a.vote_average || 0);

        case "rating_asc":
          return (a.vote_average || 0) - (b.vote_average || 0);

        case "newest": {
          const dateA = a.release_date || a.first_air_date || "";
          const dateB = b.release_date || b.first_air_date || "";
          return dateB.localeCompare(dateA);
        }

        case "oldest": {
          const dateA = a.release_date || a.first_air_date || "";
          const dateB = b.release_date || b.first_air_date || "";
          return dateA.localeCompare(dateB);
        }

        case "title_asc": {
          const titleA = a.title || a.name || "";
          const titleB = b.title || b.name || "";
          return titleA.localeCompare(titleB);
        }

        case "title_desc": {
          const titleA = a.title || a.name || "";
          const titleB = b.title || b.name || "";
          return titleB.localeCompare(titleA);
        }

        case "relevance":
        default:
          return (b._relevanceScore || 0) - (a._relevanceScore || 0);
      }
    });
  }
}
