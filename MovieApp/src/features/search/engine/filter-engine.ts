import type { MediaItem } from "@/types/media";
import type { SearchAST, UniversalFilterParams, SmartRelaxationSuggestion } from "./types";

export class FilterEngine {
  /**
   * Applies domain-specific and universal filter rules in-memory.
   */
  static applyFilters(
    items: MediaItem[],
    filters: UniversalFilterParams,
    ast?: SearchAST
  ): MediaItem[] {
    let filtered = [...items];

    // 0. Legitimate Cinema & Television Integrity Check
    // Filters out obscure direct-to-DVD promotional clips, audio podcasts, compilation discs, and unstreamable placeholder entries with 0 popularity/votes
    filtered = filtered.filter((item) => {
      const itemAny = item as any;
      if (itemAny.media_type === "person" || itemAny.media_type === "collection") return true;

      const hasArtwork = Boolean(item.poster_path || item.backdrop_path);
      const voteCount = Number(item.vote_count || 0);
      const popularity = Number(item.popularity || 0);
      const title = (item.title || item.name || "").toLowerCase();

      // Junk and non-movie patterns
      const isPodcastOrScrap =
        title.includes("podcast") ||
        title.includes("spotify") ||
        title.includes("talkshow") ||
        title.includes("audiobook") ||
        title.includes("bonus disc") ||
        title.includes("sampler") ||
        title.includes("dvd collection") ||
        title.includes("driving dave");

      // Reject entries with NO artwork AND 0 votes
      if (!hasArtwork && voteCount === 0) return false;
      if (isPodcastOrScrap && voteCount <= 2) return false;

      // Reject obscure compilation/promo/direct-to-video shorts that have <= 2 votes and very low popularity (< 1.0)
      if (voteCount <= 2 && popularity < 1.0) {
        return false;
      }

      // In general browse mode (no specific query), hide explicit sex & nudity titles from carousel/shelves
      const isSearchMode = Boolean(filters.q && filters.q.trim().length > 0);
      if (!isSearchMode) {
        if (item.adult === true) return false;
        const overview = (item.overview || "").toLowerCase();
        const explicitEroticaTerms = [
          "softcore",
          "erotica",
          "erotic",
          "erotic romance",
          "erotic thriller",
          "erotic drama",
          "pornographic",
          "pornography",
          "explicit sexual",
          "explicit nudity",
          "sensual desire",
          "sensual affair",
          "hotel desire",
          "hentai",
          "sexually explicit",
          "vivamax",
          "viva max",
          "bomba film",
          "steamy romance",
          "steamy affair",
          "sexual obsession",
          "bold film",
          "bold movie",
          "carnal",
          "lustful",
          "scorpio nights",
          "silip",
        ];
        if (explicitEroticaTerms.some((term) => overview.includes(term) || title.includes(term))) {
          return false;
        }
      }

      return true;
    });


    // 1. Media Type Filter
    const targetType = filters.media_type || ast?.mediaType || "all";
    if (targetType !== "all") {
      filtered = filtered.filter((item) => {
        const itemType = item.media_type || (item.title ? "movie" : "tv");
        if (targetType === "anime") {
          return (
            (itemType === "tv" || itemType === "movie") &&
            (item.origin_country?.includes("JP") ||
              item.original_language === "ja" ||
              item.genre_ids?.includes(16))
          );
        }
        if (targetType === "documentary") {
          return item.genre_ids?.includes(99);
        }
        if (targetType === "animation") {
          return item.genre_ids?.includes(16);
        }
        return itemType === targetType;
      });
    }

    // 2. Genre Filter (Supports ANY or ALL, bidirectional movie/tv genre equivalency, and keyword/theme strings)
    const genreStr = filters.genre;
    if (genreStr) {
      const rawGenres = genreStr.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean);
      const numericGenreIds = rawGenres.map((g) => parseInt(g, 10)).filter((n) => !isNaN(n));
      const hasSports = rawGenres.includes("sports") || rawGenres.includes("anime_sports");

      const GENRE_EQUIVALENTS: Record<number, number[]> = {
        28: [28, 10759], // Action <-> Action & Adventure (TV)
        12: [12, 10759], // Adventure <-> Action & Adventure (TV)
        10759: [10759, 28, 12],
        878: [878, 10765], // Sci-Fi <-> Sci-Fi & Fantasy (TV)
        14: [14, 10765], // Fantasy <-> Sci-Fi & Fantasy (TV)
        10765: [10765, 878, 14],
        10752: [10752, 10768], // War <-> War & Politics (TV)
        10768: [10768, 10752],
        16: [16], // Animation
      };

      // Expand all target genre IDs to include TV/Movie equivalent IDs
      const expandedTargetGenreIds = new Set<number>();
      for (const gid of numericGenreIds) {
        expandedTargetGenreIds.add(gid);
        const equivalents = GENRE_EQUIVALENTS[gid] || [];
        for (const eq of equivalents) {
          expandedTargetGenreIds.add(eq);
        }
      }

      if (expandedTargetGenreIds.size > 0 || hasSports) {
        filtered = filtered.filter((item) => {
          if (expandedTargetGenreIds.size > 0 && item.genre_ids && Array.isArray(item.genre_ids)) {
            const hasNumericMatch = item.genre_ids.some((gid) => expandedTargetGenreIds.has(gid));
            if (hasNumericMatch) return true;
          }
          if (hasSports) {
            const text = `${item.title || ""} ${item.name || ""} ${item.overview || ""}`.toLowerCase();
            const sportsTerms = [
              "sport", "athlete", "championship", "tournament", "football", "soccer",
              "basketball", "baseball", "boxing", "boxer", "racing", "racer", "volleyball",
              "swimming", "coach", "tennis", "olympic", "hockey", "rugby", "martial arts"
            ];
            if (sportsTerms.some((term) => text.includes(term))) return true;
          }
          return expandedTargetGenreIds.size === 0;
        });
      }
    }

    // 3. Year & Month Date Filter (Facebook Style)
    const exactYear = filters.year ? parseInt(filters.year, 10) : undefined;
    const exactMonth = filters.month ? filters.month.padStart(2, "0") : undefined;
    const startYear = filters.year_start ? parseInt(filters.year_start, 10) : ast?.yearStart;
    const endYear = filters.year_end ? parseInt(filters.year_end, 10) : ast?.yearEnd;
    const todayStr = new Date().toISOString().split("T")[0];

    filtered = filtered.filter((item) => {
      const dateStr = item.release_date || item.first_air_date;
      if (!dateStr) return true;

      // Filter out unreleased future dates unless explicitly requested
      if (!endYear && !exactYear && dateStr > todayStr) return false;

      const [yStr, mStr] = dateStr.split("-");
      const year = parseInt(yStr, 10);
      if (isNaN(year)) return true;

      // Exact Year Check
      if (exactYear && year !== exactYear) return false;

      // Exact Month Check
      if (exactMonth && mStr !== exactMonth) return false;

      // Year Range Check
      if (startYear && year < startYear) return false;
      if (endYear && year > endYear) return false;
      return true;
    });


    // 4. Minimum Rating Filter
    const minRating = filters.min_rating ? parseFloat(filters.min_rating) : ast?.minRating;
    if (minRating && minRating > 0) {
      filtered = filtered.filter((item) => {
        return (item.vote_average || 0) >= minRating;
      });
    }

    // 5. Origin / Country Filter (Resilient matching across country codes and primary native languages)
    const country = filters.country || ast?.country;
    if (country && country !== "ALL") {
      const COUNTRY_LANG_MAP: Record<string, string[]> = {
        PH: ["tl", "fil", "ceb", "tgl", "en"],
        JP: ["ja"],
        KR: ["ko"],
        CN: ["zh", "cn", "yue", "wuu"],
        HK: ["zh", "yue", "cn", "en"],
        TW: ["zh", "cn", "tw"],
        IN: ["hi", "ta", "te", "ml", "kn", "bn", "mr", "pa"],
        TH: ["th"],
        ID: ["id"],
        VN: ["vi"],
        FR: ["fr"],
        DE: ["de"],
        ES: ["es"],
        MX: ["es"],
        IT: ["it"],
        GB: ["en"],
        US: ["en"],
        CA: ["en", "fr"],
        AU: ["en"],
        BR: ["pt"],
        PT: ["pt"],
        RU: ["ru"],
        SE: ["sv"],
        NO: ["no"],
        DK: ["da"],
      };

      filtered = filtered.filter((item) => {
        // If origin_country array is present, check direct match
        if (item.origin_country && Array.isArray(item.origin_country)) {
          if (item.origin_country.includes(country)) return true;
        }
        // Check primary spoken/original language match for country
        const validLangs = COUNTRY_LANG_MAP[country];
        if (validLangs && item.original_language && validLangs.includes(item.original_language)) {
          return true;
        }
        // If origin_country is undefined in TMDB discover, accept it if fetched with with_origin_country
        if (!item.origin_country || item.origin_country.length === 0) {
          return true;
        }
        return false;
      });
    }

    // 6. Content Safety Flags
    if (ast?.withoutGore) {
      // Exclude extreme horror
      filtered = filtered.filter((item) => !item.genre_ids?.includes(27));
    }
    if (ast?.withoutNudity) {
      // Family safe
      filtered = filtered.filter((item) => !item.adult);
    }

    return filtered;
  }

  /**
   * Generates actionable smart relaxation suggestions when search returns 0 results.
   */
  static generateRelaxationSuggestions(
    allCandidates: MediaItem[],
    activeFilters: UniversalFilterParams,
    ast: SearchAST
  ): SmartRelaxationSuggestion[] {
    const suggestions: SmartRelaxationSuggestion[] = [];

    // 1. Check if lowering min rating produces matches
    if (activeFilters.min_rating && parseFloat(activeFilters.min_rating) > 6.5) {
      const relaxedRating = Math.max(6.0, parseFloat(activeFilters.min_rating) - 1.5).toString();
      const relaxed = this.applyFilters(
        allCandidates,
        { ...activeFilters, min_rating: relaxedRating },
        ast
      );
      if (relaxed.length > 0) {
        suggestions.push({
          label: `Lower rating to ★ ${relaxedRating}+ (${relaxed.length} matches)`,
          action: "lower_rating",
          modifiedParams: { min_rating: relaxedRating },
          message: `Lowering the minimum rating threshold reveals ${relaxed.length} relevant titles.`,
        });
      }
    }

    // 2. Check if expanding year range produces matches
    if (activeFilters.year_start || activeFilters.year_end) {
      const relaxedYear = this.applyFilters(
        allCandidates,
        { ...activeFilters, year_start: undefined, year_end: undefined },
        ast
      );
      if (relaxedYear.length > 0) {
        suggestions.push({
          label: `Expand to All-Time Era (${relaxedYear.length} matches)`,
          action: "expand_year",
          modifiedParams: { year_start: "", year_end: "" },
          message: `Expanding the release window across all years unlocks ${relaxedYear.length} titles.`,
        });
      }
    }

    // 3. Check if including all media formats produces matches
    if (activeFilters.media_type && activeFilters.media_type !== "all") {
      const relaxedFormat = this.applyFilters(
        allCandidates,
        { ...activeFilters, media_type: "all" },
        ast
      );
      if (relaxedFormat.length > 0) {
        suggestions.push({
          label: `Include Movies & TV Series (${relaxedFormat.length} matches)`,
          action: "include_all_media",
          modifiedParams: { media_type: "all" },
          message: `Searching across both movies and television series reveals ${relaxedFormat.length} titles.`,
        });
      }
    }

    return suggestions.slice(0, 3);
  }
}
