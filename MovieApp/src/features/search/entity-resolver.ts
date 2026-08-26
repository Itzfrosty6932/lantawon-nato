/**
 * LANTAWON LANG — SEARCH ENTITY RESOLVER & DISAMBIGUATION
 * 
 * Groups multi-entity search results into structured sections (Top Result, Movies,
 * Shows, Anime, People, Studios, Networks, Collections). (Sections 14, 64, 82)
 */

import type { MediaItem } from "@/types/media";
import type { SearchEntityResult, GroupedSearchResults } from "@/types/search-contract";
import type { SearchAST } from "./parser";

export class SearchEntityResolver {
  /**
   * Converts a MediaItem into a standardized SearchEntityResult.
   */
  static mediaToEntity(item: MediaItem, score = 80): SearchEntityResult {
    const isTv = item.media_type === "tv";
    const route = isTv ? `/show/${item.id}` : `/title/${item.id}`;
    const year = (item.release_date || item.first_air_date || "").slice(0, 4);

    return {
      entityType: "title",
      entityId: String(item.id),
      displayName: item.title || item.name || "Untitled",
      originalName: item.original_title || item.original_name,
      subtitle: year ? `${year} • ${isTv ? "TV Series" : "Movie"}` : isTv ? "TV Series" : "Movie",
      imagePath: item.poster_path,
      score,
      route,
      mediaType: item.media_type === "tv" ? "tv" : "movie",
      year,
      rating: item.vote_average,
      region: item.origin_country?.[0],
    };
  }

  /**
   * Converts person records into SearchEntityResult objects.
   */
  static personToEntity(person: { id: number | string; name: string; profile_path?: string | null; known_for_department?: string }): SearchEntityResult {
    return {
      entityType: "person",
      entityId: String(person.id),
      displayName: person.name,
      subtitle: person.known_for_department || "Actor / Creator",
      imagePath: person.profile_path,
      score: 85,
      route: `/person/${person.id}`,
    };
  }

  /**
   * Groups a flat array of search results and auxiliary entities into categorized sections.
   */
  static groupResults(
    query: string,
    mediaItems: MediaItem[],
    people: Array<{ id: number; name: string; profile_path?: string | null; known_for_department?: string }> = [],
    collections: Array<{ id: number; name: string; poster_path?: string | null; backdrop_path?: string | null; overview?: string }> = [],
    ast?: SearchAST
  ): GroupedSearchResults {
    const movies: SearchEntityResult[] = [];
    const shows: SearchEntityResult[] = [];
    const anime: SearchEntityResult[] = [];
    const documentaries: SearchEntityResult[] = [];
    const peopleResults: SearchEntityResult[] = people.map(this.personToEntity);
    const collectionResults: SearchEntityResult[] = collections.map((c) => ({
      entityType: "collection",
      entityId: String(c.id),
      displayName: c.name,
      subtitle: "Franchise / Universe Collection",
      imagePath: c.poster_path || c.backdrop_path,
      score: 75,
      route: `/collection/${c.id}`,
    }));

    mediaItems.forEach((item) => {
      const entity = this.mediaToEntity(item);
      const isAnime =
        item.origin_country?.includes("JP") &&
        (item.genre_ids?.includes(16) || item.original_language === "ja");
      const isDoc = item.genre_ids?.includes(99);

      if (isAnime) {
        anime.push(entity);
      } else if (isDoc) {
        documentaries.push(entity);
      } else if (item.media_type === "tv") {
        shows.push(entity);
      } else {
        movies.push(entity);
      }
    });

    // Determine Top Result
    let topResult: SearchEntityResult | null = null;
    if (peopleResults.length > 0 && ast?.intentType === "PERSON_SEARCH") {
      topResult = peopleResults[0];
    } else if (movies.length > 0) {
      topResult = movies[0];
    } else if (shows.length > 0) {
      topResult = shows[0];
    } else if (anime.length > 0) {
      topResult = anime[0];
    } else if (peopleResults.length > 0) {
      topResult = peopleResults[0];
    }

    const totalHits =
      movies.length +
      shows.length +
      anime.length +
      documentaries.length +
      peopleResults.length +
      collectionResults.length;

    return {
      query,
      totalHits,
      topResult,
      movies,
      shows,
      anime,
      documentaries,
      people: peopleResults,
      studios: [],
      networks: [],
      collections: collectionResults,
      keywords: [],
      providers: [],
    };
  }
}
