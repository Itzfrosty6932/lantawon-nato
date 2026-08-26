/**
 * LANTAWON LANG — UNIFIED SEARCH SERVICE ENTRY POINT
 * 
 * Orchestrates the modular search pipeline (Parser -> Filter -> Ranker -> Resolver -> Suggestions).
 * Corresponds to Section 82 & 83 of the master blueprint.
 */

import { SearchQueryParser } from "./parser";
import { SearchFilterEngine } from "./filters";
import { SearchRankingEngine } from "./ranking";
import { SearchEntityResolver } from "./entity-resolver";
import { SearchSuggestionEngine } from "./suggestions";
import { fetchTmdb } from "@/lib/api/tmdb";
import type { MediaItem } from "@/types/media";
import type {
  SearchQueryObject,
  GroupedSearchResults,
  SearchSortOption,
} from "@/types/search-contract";

export class SearchService {
  /**
   * Universal search execution pipeline.
   */
  static async search(queryInput: SearchQueryObject | string, userRegion = "PH"): Promise<{
    query: SearchQueryObject;
    grouped: GroupedSearchResults;
    items: MediaItem[];
    totalResults: number;
  }> {
    const queryObj: SearchQueryObject =
      typeof queryInput === "string"
        ? SearchQueryParser.toSearchQueryObject(SearchQueryParser.parse(queryInput))
        : queryInput;

    const rawQuery = queryObj.query || "";
    const ast = SearchQueryParser.parse(rawQuery);
    const page = queryObj.page || 1;
    const sort: SearchSortOption = queryObj.sort || "relevance";

    let rawMediaItems: MediaItem[] = [];
    let peopleResults: Array<{ id: number; name: string; profile_path: string | null; known_for_department: string }> = [];
    let collectionResults: Array<{ id: number; name: string; poster_path: string | null; backdrop_path: string | null; overview?: string }> = [];

    // 1. Upstream Metadata Fetch based on Intent
    if (ast.intentType === "SIMILARITY_SEARCH" && ast.seedTitle) {
      const seedSearch = await fetchTmdb<{ results: MediaItem[] }>("search/multi", {
        query: ast.seedTitle,
        page: 1,
      });
      if (seedSearch?.results && seedSearch.results.length > 0) {
        const seed = seedSearch.results[0];
        const endpoint = `${seed.media_type || "movie"}/${seed.id}/recommendations`;
        const recs = await fetchTmdb<{ results: MediaItem[] }>(endpoint, { page });
        rawMediaItems = recs?.results || [];
      }
    } else if (ast.intentType === "PERSON_SEARCH" && ast.personName) {
      const personSearch = await fetchTmdb<{
        results: Array<{ id: number; name: string; profile_path: string | null; known_for_department: string }>;
      }>("search/person", { query: ast.personName, page: 1 });

      if (personSearch?.results && personSearch.results.length > 0) {
        peopleResults = personSearch.results.slice(0, 5);
        const person = personSearch.results[0];
        const credits = await fetchTmdb<{ cast?: MediaItem[]; crew?: MediaItem[] }>(
          `person/${person.id}/combined_credits`
        );
        rawMediaItems = [...(credits?.cast || []), ...(credits?.crew || [])];
      }
    } else if (rawQuery) {
      const multi = await fetchTmdb<{ results: MediaItem[] }>("search/multi", {
        query: rawQuery,
        page,
      });
      rawMediaItems = multi?.results || [];
    } else {
      // Discover trending when query is blank
      const trending = await fetchTmdb<{ results: MediaItem[] }>("trending/all/day", { page });
      rawMediaItems = trending?.results || [];
    }

    // 2. Filter Application Pipeline
    const filtered = SearchFilterEngine.apply(rawMediaItems, queryObj, ast);

    // 3. Multi-Signal Ranking & Sorting
    const ranked = SearchRankingEngine.rankAndSort(filtered, rawQuery, sort, ast, userRegion);

    // 4. Entity Grouping & Disambiguation
    const grouped = SearchEntityResolver.groupResults(
      rawQuery,
      ranked,
      peopleResults,
      collectionResults,
      ast
    );

    return {
      query: queryObj,
      grouped,
      items: ranked,
      totalResults: ranked.length,
    };
  }

  /**
   * Fast autocomplete and relaxation generator.
   */
  static getSuggestions(partialQuery: string) {
    return SearchSuggestionEngine.getAutocomplete(partialQuery);
  }

  /**
   * Direct access to query parser.
   */
  static parseQuery(queryText: string) {
    return SearchQueryParser.parse(queryText);
  }
}

// Re-exports
export * from "./parser";
export * from "./filters";
export * from "./ranking";
export * from "./entity-resolver";
export * from "./suggestions";
