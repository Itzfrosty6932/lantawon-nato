import { fetchTmdb } from "@/lib/api/tmdb";
import { parseNlpIntent } from "@/features/search/nlp-parser";
import { TAXONOMY } from "@/lib/constants/taxonomy";
import type { MediaItem, MovieDetails, TvDetails, Season, FranchiseCollection } from "@/types/media";

export interface DiscoverFilterParams {
  media_type?: string;
  genre?: string;
  country?: string;
  year?: string;
  month?: string;
  year_start?: string;
  year_end?: string;
  era?: string;
  min_rating?: string;
  sort_by?: string;
  page?: string | number;
  provider?: string;
  monetization?: string;
  watch_region?: string;
}


export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export class CatalogService {
  /**
   * Universal catalog discover engine with cross-media genre mapping,
   * keyword extraction, strict future-date cap (no 2027+ unreleased phantom films),
   * watch provider filtering, and resilient multi-country filtering.
   */
  static async discover(params: DiscoverFilterParams): Promise<TmdbPaginatedResponse<MediaItem>> {
    const mediaType = params.media_type || "all";
    const rawGenre = params.genre || "";
    const country = params.country || "";
    const year = params.year || "";
    const month = params.month || "";
    let yearStart = params.year_start || "";
    let yearEnd = params.year_end || "";
    const minRating = params.min_rating || "";
    const sortBy = params.sort_by || "popularity.desc";
    const page = params.page || "1";
    const provider = params.provider || "";
    const monetization = params.monetization || "";
    const watchRegion = params.watch_region || "US";

    const today = new Date().toISOString().split("T")[0]; // e.g., "2026-08-22"

    // If explicit year and/or month provided (Facebook style Date Filter)
    let explicitDateGte = "";
    let explicitDateLte = "";

    if (year) {
      if (month) {
        const mm = month.padStart(2, "0");
        const daysInMonth = new Date(parseInt(year, 10), parseInt(mm, 10), 0).getDate();
        explicitDateGte = `${year}-${mm}-01`;
        explicitDateLte = `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}`;
      } else {
        explicitDateGte = `${year}-01-01`;
        explicitDateLte = `${year}-12-31`;
      }
    }


    // Helper to translate genres and extract keyword IDs
    const processGenresAndKeywords = (targetEndpoint: "discover/movie" | "discover/tv") => {
      if (!rawGenre) return { genreParam: "", keywordParam: "" };

      const tokens = rawGenre.split(/[,|]/).map((t) => t.trim()).filter(Boolean);
      const genreIds: string[] = [];
      const keywordIds: string[] = [];

      for (const token of tokens) {
        const numId = parseInt(token, 10);
        if (!isNaN(numId)) {
          if (targetEndpoint === "discover/tv") {
            // Map Movie genres to TV equivalents
            if (numId === 10752) genreIds.push("10768"); // War -> War & Politics
            else if (numId === 878 || numId === 14) genreIds.push("10765"); // Sci-Fi / Fantasy -> Sci-Fi & Fantasy
            else if (numId === 28 || numId === 12) genreIds.push("10759"); // Action / Adventure -> Action & Adventure
            else genreIds.push(String(numId));
          } else {
            // Map TV genres to Movie equivalents
            if (numId === 10768) genreIds.push("10752"); // War & Politics -> War
            else if (numId === 10765) genreIds.push("878,14"); // Sci-Fi & Fantasy -> Sci-Fi, Fantasy
            else if (numId === 10759) genreIds.push("28,12"); // Action & Adventure -> Action, Adventure
            else genreIds.push(String(numId));
          }
        } else {
          // Check if token is an Anime theme or keyword
          const match = TAXONOMY.genres.find((g) => g.id === token);
          if (match && match.tmdbKeyword) {
            keywordIds.push(String(match.tmdbKeyword));
          }
        }
      }

      return {
        genreParam: genreIds.join("|"),
        keywordParam: keywordIds.join(","),
      };
    };

    // Build common query parameters
    const buildQueryParams = (targetEndpoint: "discover/movie" | "discover/tv") => {
      const { genreParam, keywordParam } = processGenresAndKeywords(targetEndpoint);
      const qp: Record<string, string | number | undefined> = {
        page,
        sort_by: sortBy,
      };

      if (mediaType === "anime") {
        qp.with_genres = genreParam ? `16,${genreParam}` : "16";
        qp.with_origin_country = "JP";
        qp.with_original_language = "ja";
      } else if (mediaType === "animation" || mediaType === "cartoons" || mediaType === "cartoon") {
        qp.with_genres = genreParam ? `16,${genreParam}` : "16";
      } else if (mediaType === "documentary" || mediaType === "documentaries") {
        qp.with_genres = genreParam ? `99,${genreParam}` : "99";
      } else if (mediaType === "asian" || mediaType === "asian-cinema") {
        qp.with_origin_country = country && country !== "ALL" ? country : "KR|JP|CN|HK|TW|TH|PH|ID|VN";
      } else if (genreParam) {
        qp.with_genres = genreParam;
      }

      if (keywordParam) {
        qp.with_keywords = keywordParam;
      }

      if (country && country !== "ALL" && mediaType !== "anime" && mediaType !== "asian" && mediaType !== "asian-cinema") {
        qp.with_origin_country = country;
      }

      // Date Range Bounding
      const dateFieldLte = targetEndpoint === "discover/tv" ? "first_air_date.lte" : "primary_release_date.lte";
      const dateFieldGte = targetEndpoint === "discover/tv" ? "first_air_date.gte" : "primary_release_date.gte";

      if (explicitDateGte) {
        qp[dateFieldGte] = explicitDateGte;
      } else if (yearStart && yearStart !== "all-time") {
        qp[dateFieldGte] = `${yearStart}-01-01`;
      }

      if (explicitDateLte) {
        // Cap with today if explicit end is in the future
        qp[dateFieldLte] = explicitDateLte > today ? today : explicitDateLte;
      } else if (yearEnd && yearEnd !== "all-time") {
        qp[dateFieldLte] = `${yearEnd}-12-31`;
      } else {
        // STRICT CAP: Default to today's date so unreleased placeholder films (2027-2038) never appear!
        qp[dateFieldLte] = today;
      }

      // Exclude documentaries (99), News (10763), Talk shows (10767) from general discovery ONLY if 99 is not explicitly requested
      const isDocRequested = qp.with_genres && String(qp.with_genres).includes("99");
      if (!isDocRequested) {
        if (targetEndpoint === "discover/tv") {
          qp.without_genres = "99,10763,10767";
        } else {
          qp.without_genres = "99";
        }
      }

      // Exclude explicit erotica, softcore, Vivamax, and heavy nudity keywords from public shelves & carousels
      qp.without_keywords = "190370,265738,18035,190013,9913,286461,10738,228232,237887,293883,314489";

      // Robust vote count baseline to prevent 1-vote 10.0 indie shorts from dominating Top Rated
      if (sortBy.includes("vote_average")) {
        qp["vote_count.gte"] = 300;
      } else if (minRating) {
        qp["vote_average.gte"] = minRating;
        qp["vote_count.gte"] = 50;
      } else if (sortBy.includes("popularity")) {
        qp["vote_count.gte"] = 20;
      }

      if ((params as any).vote_count_gte) {
        qp["vote_count.gte"] = (params as any).vote_count_gte;
      }

      if (provider) {
        qp.with_watch_providers = provider;
        qp.watch_region = watchRegion;
      }

      if (monetization) {
        qp.with_watch_monetization_types = monetization;
        qp.watch_region = watchRegion;
      }

      return qp;
    };

    if (mediaType === "tv") {
      const qp = buildQueryParams("discover/tv");
      const data = await fetchTmdb<TmdbPaginatedResponse<MediaItem>>("discover/tv", qp);
      return CatalogService.sanitizeResults(data, "tv", today);
    }

    if (mediaType === "movie" || mediaType === "documentary" || mediaType === "animation") {
      const qp = buildQueryParams("discover/movie");
      const data = await fetchTmdb<TmdbPaginatedResponse<MediaItem>>("discover/movie", qp);
      return CatalogService.sanitizeResults(data, "movie", today);
    }

    if (mediaType === "anime") {
      const qp = buildQueryParams("discover/tv");
      const data = await fetchTmdb<TmdbPaginatedResponse<MediaItem>>("discover/tv", qp);
      return CatalogService.sanitizeResults(data, "tv", today);
    }

    // Default "all" media type: Fetch both movie and TV concurrently and interleave for rich variety
    const [movieData, tvData] = await Promise.all([
      fetchTmdb<TmdbPaginatedResponse<MediaItem>>("discover/movie", buildQueryParams("discover/movie")),
      fetchTmdb<TmdbPaginatedResponse<MediaItem>>("discover/tv", buildQueryParams("discover/tv")),
    ]);

    const sanitizedMovies = CatalogService.sanitizeResults(movieData, "movie", today);
    const sanitizedTv = CatalogService.sanitizeResults(tvData, "tv", today);

    // Merge and rank by popularity
    const combinedResults: MediaItem[] = [];
    const maxLen = Math.max(sanitizedMovies.results.length, sanitizedTv.results.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < sanitizedMovies.results.length) combinedResults.push(sanitizedMovies.results[i]);
      if (i < sanitizedTv.results.length) combinedResults.push(sanitizedTv.results[i]);
    }

    return {
      page: Number(page),
      results: combinedResults.slice(0, 20),
      total_pages: Math.max(sanitizedMovies.total_pages, sanitizedTv.total_pages),
      total_results: sanitizedMovies.total_results + sanitizedTv.total_results,
    };
  }

  /**
   * Real TMDB trending algorithm (view-velocity based), NOT a popularity.desc
   * discover sort — those are different rankings. Used by Home/Shows'
   * "Trending" shelves and hero carousels so "trending" actually means it.
   */
  static async trending(
    mediaType: "all" | "movie" | "tv" = "all",
    timeWindow: "day" | "week" = "day"
  ): Promise<TmdbPaginatedResponse<MediaItem>> {
    const today = new Date().toISOString().split("T")[0];
    const data = await fetchTmdb<TmdbPaginatedResponse<MediaItem & { media_type?: string }>>(
      `trending/${mediaType}/${timeWindow}`
    );
    const withoutPeople: TmdbPaginatedResponse<MediaItem> = {
      ...data,
      results: (data.results || []).filter((item: any) => item.media_type !== "person"),
    };
    return CatalogService.sanitizeResults(withoutPeople, mediaType === "tv" ? "tv" : "movie", today);
  }

  /**
   * Helper to format titles, enforce media_type, and filter out unreleased future dates and explicit content from public carousels.
   */
  private static sanitizeResults(
    data: TmdbPaginatedResponse<MediaItem> | null,
    defaultType: "movie" | "tv",
    maxDate: string
  ): TmdbPaginatedResponse<MediaItem> {
    if (!data || !data.results) {
      return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }

    const explicitEroticaTerms = [
      "softcore",
      "erotica",
      "erotic romance",
      "erotic thriller",
      "erotic drama",
      "erotic",
      "pornographic",
      "pornography",
      "explicit sexual",
      "explicit nudity",
      "sensual desire",
      "sensual affair",
      "sensual",
      "hotel desire",
      "hentai",
      "sexually explicit",
      "vivamax",
      "viva max",
      "bomba film",
      "steamy romance",
      "steamy affair",
      "sexual obsession",
      "sexual",
      "bold film",
      "bold movie",
      "carnal",
      "lustful",
      "scorpio nights",
      "silip",
      "donselya",
      "pagnanasa",
      "hubad",
      "tukso",
      "patikim",
      "diligan",
      "palitan",
      "kiskisan",
      "haliparot",
      "virgin",
      "selina's gold",
      "18th rose",
    ];

    const filtered = data.results
      .filter((item) => {
        // 1. Enforce that release date is not in the future (no 2027+)
        const date = item.release_date || item.first_air_date || "";
        if (date && date > maxDate) return false;

        // 2. Reject items with no poster AND no backdrop (no blank/ugly cards)
        if (!item.poster_path && !item.backdrop_path) return false;

        // 3. Reject news / talk show genres (10763 = News, 10767 = Talk)
        if (item.genre_ids && (item.genre_ids.includes(10763) || item.genre_ids.includes(10767))) {
          return false;
        }

        // 4. Reject untitled, junk, or news broadcast titles
        const title = (item.title || item.name || "").trim().toLowerCase();
        if (!title || title === "untitled" || title === "tagesschau") return false;

        // 5. Filter out adult & explicit erotica from public browse carousels (still searchable by query)
        if (item.adult === true) return false;
        const overview = (item.overview || "").toLowerCase();
        if (explicitEroticaTerms.some((term) => overview.includes(term) || title.includes(term))) {
          return false;
        }

        return true;
      })
      .map((item) => ({
        ...item,
        media_type: item.media_type || defaultType,
        title: item.title || item.name || "Untitled",
      }));

    return {
      ...data,
      results: filtered,
    };
  }

  static async searchNLP(query: string) {
    const intent = parseNlpIntent(query);
    let searchData: TmdbPaginatedResponse<MediaItem> | null = null;

    if (intent.seedTitle) {
      const seedSearch = await fetchTmdb<TmdbPaginatedResponse<MediaItem>>("search/multi", { query: intent.seedTitle, page: 1 });
      if (seedSearch && seedSearch.results && seedSearch.results.length > 0) {
        const seed = seedSearch.results[0];
        searchData = await fetchTmdb<TmdbPaginatedResponse<MediaItem>>(
          `${seed.media_type || "movie"}/${seed.id}/recommendations`,
          { page: 1 }
        );
      }
    }

    if (!searchData || !searchData.results || searchData.results.length === 0) {
      const discoverParams: Record<string, string | number | undefined> = { page: 1, sort_by: "popularity.desc" };
      if (intent.mediaType === "anime") {
        discoverParams.with_genres = intent.genres.length > 0 ? `16,${intent.genres.join("|")}` : "16";
        discoverParams.with_origin_country = "JP";
        discoverParams.with_original_language = "ja";
      } else if (intent.genres.length > 0) {
        discoverParams.with_genres = intent.genres.join("|");
      }

      if (intent.country) discoverParams.with_origin_country = intent.country;
      if (intent.yearStart) discoverParams["primary_release_date.gte"] = `${intent.yearStart}-01-01`;
      if (intent.yearEnd) discoverParams["primary_release_date.lte"] = `${intent.yearEnd}-12-31`;
      else discoverParams["primary_release_date.lte"] = new Date().toISOString().split("T")[0];

      const targetEndpoint = intent.mediaType === "tv" || intent.mediaType === "anime" ? "discover/tv" : "discover/movie";
      searchData = await fetchTmdb<TmdbPaginatedResponse<MediaItem>>(targetEndpoint, discoverParams);
    }

    return {
      intent,
      results: (searchData?.results || []).map((item) => ({
        ...item,
        title: item.title || item.name || "Untitled",
        media_type: item.media_type || (intent.mediaType === "tv" ? "tv" : "movie"),
      })),
      total_results: searchData?.total_results || 0,
    };
  }

  static async getMovie(id: string | number): Promise<MovieDetails | null> {
    const movie = await fetchTmdb<MovieDetails>(`movie/${id}`, { append_to_response: "credits,recommendations,videos" });
    if (movie && movie.belongs_to_collection && movie.belongs_to_collection.id) {
      try {
        const collectionData = await fetchTmdb<FranchiseCollection>(`collection/${movie.belongs_to_collection.id}`);
        if (collectionData && collectionData.parts && collectionData.parts.length > 0) {
          movie.collection = {
            ...collectionData,
            parts: collectionData.parts
              .map((p) => ({
                ...p,
                media_type: "movie" as const,
                title: p.title || p.name || "Untitled",
              }))
              .sort((a, b) => {
                const dateA = a.release_date || "9999";
                const dateB = b.release_date || "9999";
                return dateA.localeCompare(dateB);
              }),
          };
        }
      } catch (err) {
        console.error("Failed to fetch collection for movie:", err);
      }
    }
    return movie;
  }

  static async getSeries(id: string | number): Promise<TvDetails | null> {
    return fetchTmdb<TvDetails>(`tv/${id}`, { append_to_response: "credits,recommendations,videos" });
  }

  static async getSeason(seriesId: string | number, seasonNumber: string | number): Promise<Season | null> {
    return fetchTmdb<Season>(`tv/${seriesId}/season/${seasonNumber}`);
  }

  static async searchMulti(query: string, page: string | number = 1): Promise<TmdbPaginatedResponse<MediaItem>> {
    const data = await fetchTmdb<TmdbPaginatedResponse<MediaItem>>("search/multi", { query, page });
    if (data && data.results) {
      data.results = data.results
        .filter((i) => i.media_type === "movie" || i.media_type === "tv")
        .map((i) => ({ ...i, title: i.title || i.name || "Untitled" }));
      return data;
    }
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }

  static async autocomplete(query: string) {
    if (!query || query.length < 2) return { suggestions: [] };
    const data = await fetchTmdb<TmdbPaginatedResponse<MediaItem>>("search/multi", { query, page: 1 });
    const suggestions = (data?.results || []).slice(0, 7).map((item) => ({
      id: item.id,
      title: item.title || item.name || "Untitled",
      media_type: item.media_type,
      poster_path: item.poster_path,
      year: (item.release_date || item.first_air_date || "").split("-")[0],
      rating: item.vote_average ? item.vote_average.toFixed(1) : null,
    }));
    return { suggestions };
  }
}
