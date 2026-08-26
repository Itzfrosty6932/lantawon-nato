import { fetchTmdb } from "@/lib/api/tmdb";
import { QueryParser } from "./query-parser";
import { FilterEngine } from "./filter-engine";
import { RankingEngine } from "./ranking-engine";
import type { MediaItem } from "@/types/media";
import type {
  UniversalFilterParams,
  UnifiedSearchResponse,
  SearchTabCounts,
} from "./types";

const MOVIE_TO_TV_GENRE_MAP: Record<number, number> = {
  28: 10759, // Action -> Action & Adventure
  12: 10759, // Adventure -> Action & Adventure
  878: 10765, // Sci-Fi -> Sci-Fi & Fantasy
  14: 10765, // Fantasy -> Sci-Fi & Fantasy
  10752: 10768, // War -> War & Politics
};

export class SearchEngine {
  static async execute(params: UniversalFilterParams): Promise<UnifiedSearchResponse> {
    const rawQuery = (params.q || "").trim();
    const ast = QueryParser.parse(rawQuery);
    const activeTab = params.tab || "all";
    const sortBy = params.sort_by || "best_match";
    const page = parseInt(String(params.page || 1), 10);

    let rawMediaItems: MediaItem[] = [];
    let peopleResults: Array<any> = [];
    let collectionResults: Array<any> = [];
    let totalPages = 10;

    // 1. QUERY EXECUTION BASED ON INTENT
    if (ast.intentType === "SIMILARITY_SEARCH" && ast.seedTitle) {
      const seedSearch = await fetchTmdb<{ results: MediaItem[] }>("search/multi", {
        query: ast.seedTitle,
        page: 1,
      });
      if (seedSearch?.results && seedSearch.results.length > 0) {
        const seed = seedSearch.results[0];
        const recEndpoint = `${seed.media_type || "movie"}/${seed.id}/recommendations`;
        const recs = await fetchTmdb<{ results: MediaItem[]; total_pages: number }>(recEndpoint, { page });
        rawMediaItems = (recs?.results || []).map((i) => ({
          ...i,
          media_type: i.media_type || seed.media_type || "movie",
          title: i.title || i.name || "Untitled",
        }));
        totalPages = recs?.total_pages || 1;
      }
    } else if (ast.intentType === "PERSON_SEARCH" && ast.personName) {
      const personSearch = await fetchTmdb<{ results: Array<{ id: number; name: string; profile_path: string | null; known_for_department: string; known_for: MediaItem[] }> }>(
        "search/person",
        { query: ast.personName, page: 1 }
      );
      if (personSearch?.results && personSearch.results.length > 0) {
        const person = personSearch.results[0];
        peopleResults = personSearch.results.slice(0, 4);

        const credits = await fetchTmdb<{ cast?: MediaItem[]; crew?: MediaItem[] }>(
          `person/${person.id}/combined_credits`
        );
        const filmography = [...(credits?.cast || []), ...(credits?.crew || [])];
        const seen = new Set<string | number>();
        rawMediaItems = filmography.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return item.media_type === "movie" || item.media_type === "tv";
        });
        totalPages = 1;
      }
    } else if (ast.intentType === "NATURAL_LANGUAGE") {
      if (ast.mediaType === "anime") {
        const [tvAnime, movieAnime] = await Promise.all([
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/tv", {
            page,
            sort_by: sortBy === "best_match" ? "popularity.desc" : sortBy,
            with_genres: "16",
            with_origin_country: "JP",
            with_original_language: "ja",
            ...(ast.yearStart ? { "first_air_date.gte": `${ast.yearStart}-01-01` } : {}),
            ...(ast.yearEnd ? { "first_air_date.lte": `${ast.yearEnd}-12-31` } : {}),
            ...(ast.minRating ? { "vote_average.gte": ast.minRating } : {}),
          }),
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/movie", {
            page,
            sort_by: "popularity.desc",
            with_genres: "16",
            with_origin_country: "JP",
            with_original_language: "ja",
            ...(ast.yearStart ? { "primary_release_date.gte": `${ast.yearStart}-01-01` } : {}),
            ...(ast.yearEnd ? { "primary_release_date.lte": `${ast.yearEnd}-12-31` } : {}),
            ...(ast.minRating ? { "vote_average.gte": ast.minRating } : {}),
          }),
        ]);

        const tvItems = (tvAnime?.results || []).map((i) => ({ ...i, media_type: "tv" as const, title: i.title || i.name || "Untitled" }));
        const movieItems = (movieAnime?.results || []).map((i) => ({ ...i, media_type: "movie" as const, title: i.title || i.name || "Untitled" }));
        rawMediaItems = [...tvItems, ...movieItems];
        totalPages = Math.max(tvAnime?.total_pages || 1, movieAnime?.total_pages || 1);
      } else {
        const isTv = ast.mediaType === "tv";
        const targetEndpoint = isTv ? "discover/tv" : "discover/movie";
        const tvGenres = ast.genres.map((g) => MOVIE_TO_TV_GENRE_MAP[g] || g);

        const discoverParams: Record<string, string | number | undefined> = {
          page,
          sort_by: sortBy === "best_match" ? "popularity.desc" : sortBy,
        };

        if (ast.genres.length > 0) {
          discoverParams.with_genres = (isTv ? tvGenres : ast.genres).join("|");
        }
        if (ast.country) discoverParams.with_origin_country = ast.country;
        if (ast.yearStart) discoverParams[isTv ? "first_air_date.gte" : "primary_release_date.gte"] = `${ast.yearStart}-01-01`;
        if (ast.yearEnd) discoverParams[isTv ? "first_air_date.lte" : "primary_release_date.lte"] = `${ast.yearEnd}-12-31`;
        if (ast.minRating) discoverParams["vote_average.gte"] = ast.minRating;

        const discoverData = await fetchTmdb<{ results: MediaItem[]; total_pages: number }>(targetEndpoint, discoverParams);
        rawMediaItems = (discoverData?.results || []).map((i) => ({
          ...i,
          media_type: isTv ? ("tv" as const) : ("movie" as const),
          title: i.title || i.name || "Untitled",
        }));
        totalPages = discoverData?.total_pages || 1;
      }
    } else if (rawQuery || params.company || params.network) {
      const cleanCompanyQuery = rawQuery ? rawQuery.replace(/[\–\—\-]/g, " ").replace(/\s+/g, " ").trim() : "";
      const [multiSearch, collectionSearch, personSearch, companySearch] = await Promise.all([
        rawQuery ? fetchTmdb<{ results: MediaItem[]; total_pages: number }>("search/multi", { query: rawQuery, page }) : Promise.resolve(null),
        rawQuery ? fetchTmdb<{ results: Array<any> }>("search/collection", { query: rawQuery, page: 1 }).catch(() => null) : Promise.resolve(null),
        rawQuery ? fetchTmdb<{ results: Array<any> }>("search/person", { query: rawQuery, page: 1 }).catch(() => null) : Promise.resolve(null),
        (rawQuery && !params.company) ? fetchTmdb<{ results: Array<{ id: number; name: string; logo_path?: string | null }> }>("search/company", { query: cleanCompanyQuery, page: 1 }).catch(() => null) : Promise.resolve(null),
      ]);

      if (multiSearch?.results) {
        rawMediaItems = multiSearch.results
          .filter((i) => i.media_type === "movie" || i.media_type === "tv")
          .map((i) => ({ ...i, title: i.title || i.name || "Untitled" }));
        totalPages = multiSearch.total_pages || 1;
      }

      // If multiSearch returned very few/0 results or explicit company/network provided, discover movies by company/network
      const matchedCompanyId = params.company || (companySearch?.results && companySearch.results.length > 0 ? companySearch.results[0].id : null);
      if (matchedCompanyId && (rawMediaItems.length === 0 || params.company)) {
        const [compMovies, compTv] = await Promise.all([
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/movie", {
            page,
            sort_by: sortBy === "best_match" ? "popularity.desc" : sortBy,
            with_companies: matchedCompanyId,
          }).catch(() => null),
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/tv", {
            page,
            sort_by: sortBy === "best_match" ? "popularity.desc" : sortBy,
            with_companies: matchedCompanyId,
          }).catch(() => null),
        ]);

        const compItems: MediaItem[] = [
          ...(compMovies?.results || []).map((m) => ({ ...m, media_type: "movie" as const, title: m.title || "Untitled" })),
          ...(compTv?.results || []).map((t) => ({ ...t, media_type: "tv" as const, title: t.name || "Untitled" })),
        ];

        if (compItems.length > 0) {
          rawMediaItems = [...rawMediaItems, ...compItems];
          totalPages = Math.max(totalPages, compMovies?.total_pages || 1, compTv?.total_pages || 1);
        }
      }

      if (params.network) {
        const netTv = await fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/tv", {
          page,
          sort_by: sortBy === "best_match" ? "popularity.desc" : sortBy,
          with_networks: params.network,
        }).catch(() => null);

        if (netTv?.results) {
          const netItems: MediaItem[] = netTv.results.map((t) => ({ ...t, media_type: "tv" as const, title: t.name || "Untitled" }));
          rawMediaItems = [...rawMediaItems, ...netItems];
          totalPages = Math.max(totalPages, netTv.total_pages || 1);
        }
      }

      if (collectionSearch?.results) {
        const sortedCollections = [...collectionSearch.results].sort((a, b) => {
          if (a.poster_path && !b.poster_path) return -1;
          if (!a.poster_path && b.poster_path) return 1;
          return 0;
        });
        collectionResults = sortedCollections.slice(0, 4);
      }
      if (personSearch?.results) {
        const sortedPeople = [...personSearch.results].sort((a, b) => {
          if (a.profile_path && !b.profile_path) return -1;
          if (!a.profile_path && b.profile_path) return 1;
          return (b.popularity || 0) - (a.popularity || 0);
        });
        peopleResults = sortedPeople.slice(0, 4);
      }
    } else {
      // ── E. BROWSE CATALOG (no text query) ────────────────────────────────
      const tmdbSort = sortBy === "best_match" ? "popularity.desc" : sortBy;

      // Split genres: numeric IDs go to with_genres, string theme IDs go to with_keywords
      const allGenreIds = params.genre ? params.genre.split(",").map((g) => g.trim()) : [];
      const tmdbGenreIds   = allGenreIds.filter((g) => /^\d+$/.test(g));
      const themeKeywords  = allGenreIds
        .filter((g) => !/^\d+$/.test(g))
        .map((g) => {
          // Verified TMDB keyword IDs for genres, sports & anime themes
          const kwMap: Record<string, number> = {
            sports: 6075,
            anime_sports: 6075,
            anime_isekai: 237451,
            anime_shounen: 207826,
            anime_seinen: 195668,
            anime_shoujo: 206437,
            anime_josei: 9721,
            anime_mecha: 10046,
            anime_slice_of_life: 9914,
            anime_school: 10873,
            anime_supernatural: 6152,
            anime_psychological: 272553,
            anime_military: 162365,
            anime_harem: 9194,
            anime_ecchi: 195669,
            anime_martial_arts: 779,
            anime_boys_love: 365317,
            anime_girls_love: 280003,
            anime_historical: 15126,
            anime_mystery: 316332,
            anime_romance: 9840,
            anime_time_travel: 4379,
            anime_super_power: 33637,
            anime_parody: 9755,
            anime_mahou_shoujo: 210025,
            anime_reincarnation: 237451,
            anime_otaku_culture: 207826,
          };
          return kwMap[g];
        })
        .filter(Boolean) as number[];

      const todayStr = new Date().toISOString().split("T")[0];

      const buildDiscoverParams = (isTV: boolean): Record<string, string | number | undefined> => {
        const p: Record<string, string | number | undefined> = {
          page,
          sort_by: tmdbSort,
        };

        // Translate genres for target media format
        if (tmdbGenreIds.length > 0) {
          const mappedGenreIds = tmdbGenreIds.map((idStr) => {
            const num = parseInt(idStr, 10);
            if (isTV) {
              if (num === 10752) return 10768; // War -> War & Politics
              if (num === 878 || num === 14) return 10765; // Sci-Fi / Fantasy -> Sci-Fi & Fantasy
              if (num === 28 || num === 12) return 10759; // Action / Adventure -> Action & Adventure
              return num;
            } else {
              if (num === 10768) return 10752; // War & Politics -> War
              if (num === 10765) return 878;
              if (num === 10759) return 28;
              return num;
            }
          });
          p.with_genres = mappedGenreIds.join(",");
        }

        // Keyword IDs (sports, anime themes, etc.)
        if (themeKeywords.length > 0) p.with_keywords = themeKeywords.join(",");

        // Country
        if (params.country && params.country !== "ALL") p.with_origin_country = params.country;

        // Rating
        if (params.min_rating) {
          p["vote_average.gte"] = params.min_rating;
          p["vote_count.gte"] = "5"; // Accessible to international and indie titles
        }

        // Era/Year — strict per-endpoint date field, capped to today so 2027-2038 unreleased films never appear
        const dateGte = isTV ? "first_air_date.gte" : "primary_release_date.gte";
        const dateLte = isTV ? "first_air_date.lte" : "primary_release_date.lte";
        if (params.year_start) p[dateGte] = `${params.year_start}-01-01`;
        p[dateLte] = params.year_end ? `${params.year_end}-12-31` : todayStr;

        if (params.company) p.with_companies = params.company;
        if (params.network) p.with_networks = params.network;

        // Exclude explicit erotica, softcore, and heavy nudity from general discover browse
        p.without_keywords = "190370,265738,18035,190013,9913,286461,10738,228232,237887";

        return p;
      };

      const isAnimeTheme = allGenreIds.some((g) => g.startsWith("anime_"));

      if (params.media_type === "anime" || (isAnimeTheme && (!params.media_type || params.media_type === "all"))) {
        const animeBase: Record<string, string | number | undefined> = {
          page, sort_by: tmdbSort,
          with_genres: "16",
          with_origin_country: "JP",
          with_original_language: "ja",
        };
        if (themeKeywords.length > 0)  animeBase.with_keywords       = themeKeywords.join(",");
        if (params.min_rating)         animeBase["vote_average.gte"] = params.min_rating;
        if (params.min_rating)         animeBase["vote_count.gte"]   = "50";
        if (params.year_start)         animeBase["first_air_date.gte"] = `${params.year_start}-01-01`;
        if (params.year_end)           animeBase["first_air_date.lte"] = `${params.year_end}-12-31`;

        const animeMovieBase = { ...animeBase };
        if (params.year_start) { delete animeMovieBase["first_air_date.gte"]; animeMovieBase["primary_release_date.gte"] = `${params.year_start}-01-01`; }
        if (params.year_end)   { delete animeMovieBase["first_air_date.lte"]; animeMovieBase["primary_release_date.lte"] = `${params.year_end}-12-31`; }

        const [tvData, movieData] = await Promise.all([
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/tv",    animeBase),
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/movie", animeMovieBase),
        ]);
        const tvItems    = (tvData?.results    || []).map((i) => ({ ...i, media_type: "tv"    as const, title: i.title || i.name || "Untitled" }));
        const movieItems = (movieData?.results || []).map((i) => ({ ...i, media_type: "movie" as const, title: i.title || i.name || "Untitled" }));
        rawMediaItems = [...tvItems, ...movieItems];
        totalPages = Math.max(tvData?.total_pages || 1, movieData?.total_pages || 1);

      } else if (params.media_type === "tv") {
        const data = await fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/tv", buildDiscoverParams(true));
        rawMediaItems = (data?.results || []).map((i) => ({ ...i, media_type: "tv" as const, title: i.title || i.name || "Untitled" }));
      } else if (params.media_type === "movie") {
        const data = await fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/movie", buildDiscoverParams(false));
        rawMediaItems = (data?.results || []).map((i) => ({ ...i, media_type: "movie" as const, title: i.title || i.name || "Untitled" }));
        totalPages = data?.total_pages || 1;

      } else if (params.media_type === "documentary") {
        const docMovieParams = { ...buildDiscoverParams(false), with_genres: "99" };
        const docTvParams    = { ...buildDiscoverParams(true),  with_genres: "99" };
        const [movieData, tvData] = await Promise.all([
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/movie", docMovieParams),
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/tv",    docTvParams),
        ]);
        const movieItems = (movieData?.results || []).map((i) => ({ ...i, media_type: "movie" as const, title: i.title || i.name || "Untitled" }));
        const tvItems    = (tvData?.results    || []).map((i) => ({ ...i, media_type: "tv"    as const, title: i.title || i.name || "Untitled" }));
        rawMediaItems = [...movieItems, ...tvItems];
        totalPages = Math.max(movieData?.total_pages || 1, tvData?.total_pages || 1);

      } else if (params.media_type === "animation") {
        const animMovieParams = { ...buildDiscoverParams(false), with_genres: "16" };
        const animTvParams    = { ...buildDiscoverParams(true),  with_genres: "16" };
        const [movieData, tvData] = await Promise.all([
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/movie", animMovieParams),
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/tv",    animTvParams),
        ]);
        const movieItems = (movieData?.results || []).map((i) => ({ ...i, media_type: "movie" as const, title: i.title || i.name || "Untitled" }));
        const tvItems    = (tvData?.results    || []).map((i) => ({ ...i, media_type: "tv"    as const, title: i.title || i.name || "Untitled" }));
        rawMediaItems = [...movieItems, ...tvItems];
        totalPages = Math.max(movieData?.total_pages || 1, tvData?.total_pages || 1);

      } else {
        // media_type = "all" — query BOTH movie and tv, interleave
        const [movieData, tvData] = await Promise.all([
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/movie", buildDiscoverParams(false)),
          fetchTmdb<{ results: MediaItem[]; total_pages: number }>("discover/tv",    buildDiscoverParams(true)),
        ]);
        const movieItems = (movieData?.results || []).map((i) => ({ ...i, media_type: "movie" as const, title: i.title || i.name || "Untitled" }));
        const tvItems    = (tvData?.results    || []).map((i) => ({ ...i, media_type: "tv"    as const, title: i.title || i.name || "Untitled" }));
        const merged: MediaItem[] = [];
        const max = Math.max(movieItems.length, tvItems.length);
        for (let i = 0; i < max; i++) {
          if (movieItems[i]) merged.push(movieItems[i]);
          if (tvItems[i])    merged.push(tvItems[i]);
        }
        rawMediaItems = merged;
        totalPages = Math.max(movieData?.total_pages || 1, tvData?.total_pages || 1);
      }
    }

    // 2. RUN FILTER ENGINE
    const filteredItems = FilterEngine.applyFilters(rawMediaItems, params, ast);

    // 3. RUN RANKING ENGINE
    const rankedItems = RankingEngine.rankResults(filteredItems, rawQuery, sortBy);

    // 4. CHECK FOR TYPO CORRECTION
    const candidateTitles = rawMediaItems.map((i) => i.title || i.name || "");
    const typoCorrection = rawQuery
      ? RankingEngine.detectTypoCorrection(rawQuery, candidateTitles)
      : null;

    // 5. CALCULATE TAB COUNTS
    const tabCounts: SearchTabCounts = {
      all: rankedItems.length + peopleResults.length + collectionResults.length,
      movie: rankedItems.filter((i) => (i.media_type || (i.title ? "movie" : "tv")) === "movie").length,
      tv: rankedItems.filter((i) => (i.media_type || (i.title ? "movie" : "tv")) === "tv").length,
      anime: rankedItems.filter(
        (i) => i.origin_country?.includes("JP") || i.original_language === "ja" || i.genre_ids?.includes(16)
      ).length,
      person: peopleResults.length,
      collection: collectionResults.length,
    };

    // 6. FILTER BY SELECTED TAB
    let finalItems = rankedItems;
    if (activeTab === "movie") {
      finalItems = rankedItems.filter((i) => (i.media_type || "movie") === "movie");
    } else if (activeTab === "tv") {
      finalItems = rankedItems.filter((i) => i.media_type === "tv");
    } else if (activeTab === "anime") {
      finalItems = rankedItems.filter(
        (i) => i.origin_country?.includes("JP") || i.original_language === "ja" || i.genre_ids?.includes(16)
      );
    }

    // 7. SMART RELAXATION (If 0 results found)
    const relaxation =
      finalItems.length === 0 && rawMediaItems.length > 0
        ? FilterEngine.generateRelaxationSuggestions(rawMediaItems, params, ast)
        : undefined;

    return {
      success: true,
      ast,
      tab: activeTab,
      tabCounts,
      didYouMean: typoCorrection || undefined,
      results: finalItems,
      people: activeTab === "all" || activeTab === "person" ? peopleResults : [],
      collections: activeTab === "all" || activeTab === "collection" ? collectionResults : [],
      relaxation,
      totalResults: finalItems.length,
      page,
      totalPages: Math.min(totalPages, 50),
    };
  }
}
