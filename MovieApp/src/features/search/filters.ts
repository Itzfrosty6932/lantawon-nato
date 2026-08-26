/**
 * LANTAWON LANG — MULTI-DIMENSIONAL FILTER PIPELINE
 * 
 * Filter applicator enforcing media-aware boundaries, ISO normalization,
 * and user preference constraints. (Sections 6 - 13, 82)
 */

import type { MediaItem } from "../../types/media";
import type { SearchQueryObject } from "../../types/search-contract";
import type { SearchAST } from "./parser";

export class SearchFilterEngine {
  /**
   * Applies the unified SearchQueryObject and SearchAST constraints to a list of media items.
   */
  static apply(items: MediaItem[], query: SearchQueryObject, ast?: SearchAST): MediaItem[] {
    if (!items || items.length === 0) return [];

    return items.filter((item) => {
      // 1. Media Type Filter
      if (query.mediaTypes && query.mediaTypes.length > 0) {
        const itemType = item.media_type || "movie";
        const matchesType = query.mediaTypes.some((t) => {
          if (t === "anime") {
            return (
              item.origin_country?.includes("JP") &&
              (item.genre_ids?.includes(16) || item.original_language === "ja")
            );
          }
          if (t === "cartoon") {
            return item.genre_ids?.includes(16) && !item.origin_country?.includes("JP");
          }
          if (t === "documentary") {
            return item.genre_ids?.includes(99);
          }
          return itemType === t;
        });
        if (!matchesType) return false;
      }

      // 2. Minimum Rating Filter
      if (query.ratingMin !== undefined && query.ratingMin > 0) {
        const itemRating = item.vote_average || 0;
        if (itemRating < query.ratingMin) return false;
      }

      // 3. Year & Date Range Filters
      const dateStr = item.release_date || item.first_air_date || "";
      if (dateStr) {
        const itemYear = parseInt(dateStr.slice(0, 4), 10);
        if (!isNaN(itemYear)) {
          if (query.yearFrom && itemYear < query.yearFrom) return false;
          if (query.yearTo && itemYear > query.yearTo) return false;
          if (query.month) {
            const itemMonth = parseInt(dateStr.slice(5, 7), 10);
            if (!isNaN(itemMonth) && itemMonth !== query.month) return false;
          }
        }
      }

      // 4. Country / Region Code Filter (ISO-3166-1)
      if (query.countries && query.countries.length > 0) {
        const itemCountries = item.origin_country || [];
        const matchesCountry = query.countries.some((c) =>
          itemCountries.map((ic) => ic.toUpperCase()).includes(c.toUpperCase())
        );
        if (!matchesCountry && itemCountries.length > 0) return false;
      }

      // 5. Language Filter (ISO-639-1)
      if (query.originalLanguage) {
        if (item.original_language?.toLowerCase() !== query.originalLanguage.toLowerCase()) {
          return false;
        }
      }

      // 6. AST-Specific Content Advisory Exclusions
      if (ast) {
        if (ast.withoutGore && item.genre_ids?.includes(27)) {
          // Exclude extreme horror if gore is forbidden
          if (item.vote_average < 6.0) return false;
        }
        if (ast.genres && ast.genres.length > 0) {
          const itemGenres = item.genre_ids || [];
          const hasAnyGenre = ast.genres.some((g) => itemGenres.includes(g));
          if (!hasAnyGenre && itemGenres.length > 0) return false;
        }
      }

      // 7. Adult Content Gate
      if (item.adult && !query.certification?.includes("NC-17") && !query.certification?.includes("TV-MA")) {
        return false;
      }

      return true;
    });
  }
}
