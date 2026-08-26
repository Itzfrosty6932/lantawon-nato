/**
 * LANTAWON LANG — SEARCH QUERY PARSER & NLP INTENT EXTRACTOR
 * 
 * Translates natural language queries and raw strings into structured SearchAST
 * and normalized SearchQueryObject contracts. (Sections 5, 82, 83)
 */

import { CORE_GENRES, ANIME_TAXONOMY, CONTENT_THEMES, ISO_COUNTRIES, ISO_LANGUAGES } from "../../lib/constants/taxonomies";
import type { CanonicalMediaType, ContentStatus } from "../../types/canonical";
import type { SearchQueryObject, SearchSortOption } from "../../types/search-contract";

export type QueryIntentType =
  | "TITLE_DIRECT"
  | "PERSON_SEARCH"
  | "SIMILARITY_SEARCH"
  | "GENRE_COUNTRY"
  | "MOOD_THEME"
  | "NATURAL_LANGUAGE"
  | "COLLECTION_SEARCH";

export interface SearchAST {
  rawQuery: string;
  normalizedQuery: string;
  intentType: QueryIntentType;
  seedTitle?: string;
  personName?: string;
  mediaType: CanonicalMediaType | "all";
  genres: number[];
  genreNames: string[];
  genreLogic: "ANY" | "ALL";
  country?: string;
  language?: string;
  yearStart?: number;
  yearEnd?: number;
  decade?: string;
  minRating?: number;
  mood?: string;
  status?: ContentStatus;
  certification?: string;
  withoutGore?: boolean;
  withoutNudity?: boolean;
  violence?: string;
  sexualContent?: string;
  explanation: string[];
}

export class SearchQueryParser {
  /**
   * Normalizes raw search text and parses it into a structured SearchAST.
   */
  static parse(queryText: string): SearchAST {
    const raw = queryText || "";
    let q = raw.toLowerCase().trim();

    const ast: SearchAST = {
      rawQuery: raw,
      normalizedQuery: q,
      intentType: "TITLE_DIRECT",
      mediaType: "all",
      genres: [],
      genreNames: [],
      genreLogic: "ANY",
      explanation: [],
    };

    if (!q) return ast;

    // 1. Check Similarity Intent ("movies like Inception", "shows similar to Breaking Bad")
    const simRegex = /(?:movies?|shows?|series|anime|cinema)?\s*(?:like|similar to|in the style of)\s+([a-zA-Z0-9\s:_-]+?)(?:\s+(?:under|in|from|with|directed by|starring)|$)/i;
    const simMatch = q.match(simRegex);
    if (simMatch && simMatch[1].trim().length > 1) {
      ast.intentType = "SIMILARITY_SEARCH";
      ast.seedTitle = simMatch[1].trim();
      ast.explanation.push(`Similarity anchor: "${ast.seedTitle}"`);
    }

    // 2. Check Person / Creator Intent ("movies with Keanu Reeves", "directed by Christopher Nolan")
    const personRegex = /(?:directed by|starring|movies with|shows with|actor|director|writer)\s+([a-zA-Z\s.-]+?)(?:\s+(?:under|in|from|released)|$)/i;
    const personMatch = q.match(personRegex);
    if (personMatch && personMatch[1].trim().length > 2) {
      ast.intentType = "PERSON_SEARCH";
      ast.personName = personMatch[1].trim();
      ast.explanation.push(`Person intent: "${ast.personName}"`);
    }

    // 3. Media Type Extraction
    if (/\banime\b/i.test(q)) {
      ast.mediaType = "anime";
      ast.country = "JP";
      ast.language = "ja";
      ast.explanation.push("Media: Japanese Anime");
      q = q.replace(/\banime\b/gi, "");
    } else if (/\b(cartoon|cartoons|animated series|animation)\b/i.test(q)) {
      ast.mediaType = "cartoon";
      ast.explanation.push("Media: Cartoons / Animation");
      q = q.replace(/\b(cartoon|cartoons|animated series|animation)\b/gi, "");
    } else if (/\b(documentary|docuseries|documentaries|docu)\b/i.test(q)) {
      ast.mediaType = "documentary";
      ast.explanation.push("Media: Documentaries");
      q = q.replace(/\b(documentary|docuseries|documentaries|docu)\b/gi, "");
    } else if (/\b(series|show|shows|tv show|tv series)\b/i.test(q)) {
      ast.mediaType = "tv";
      ast.explanation.push("Media: TV & Streaming Series");
      q = q.replace(/\b(series|show|shows|tv show|tv series)\b/gi, "");
    } else if (/\b(movie|movies|film|films|cinema|feature)\b/i.test(q)) {
      ast.mediaType = "movie";
      ast.explanation.push("Media: Feature Films");
      q = q.replace(/\b(movie|movies|film|films|cinema|feature)\b/gi, "");
    }

    // 4. Era & Decade Extraction
    if (/\b(1990s|90s|nineties)\b/i.test(q)) {
      ast.yearStart = 1990;
      ast.yearEnd = 1999;
      ast.decade = "1990s";
      ast.explanation.push("Era: 1990s");
      q = q.replace(/\b(1990s|90s|nineties)\b/gi, "");
    } else if (/\b(1980s|80s|eighties)\b/i.test(q)) {
      ast.yearStart = 1980;
      ast.yearEnd = 1989;
      ast.decade = "1980s";
      ast.explanation.push("Era: 1980s");
      q = q.replace(/\b(1980s|80s|eighties)\b/gi, "");
    } else if (/\b(2000s|00s|early 2000s)\b/i.test(q)) {
      ast.yearStart = 2000;
      ast.yearEnd = 2009;
      ast.decade = "2000s";
      ast.explanation.push("Era: 2000s");
      q = q.replace(/\b(2000s|00s|early 2000s)\b/gi, "");
    } else if (/\b(2010s|tens)\b/i.test(q)) {
      ast.yearStart = 2010;
      ast.yearEnd = 2019;
      ast.decade = "2010s";
      ast.explanation.push("Era: 2010s");
      q = q.replace(/\b(2010s|tens)\b/gi, "");
    } else if (/\b(latest|new|recent|2024|2025|2026)\b/i.test(q)) {
      ast.yearStart = 2023;
      ast.yearEnd = 2026;
      ast.explanation.push("Era: Recent Releases");
    }

    // 5. Country & Regional Origin Extraction
    if (/\b(philippines|filipino|tagalog|pinoy)\b/i.test(q)) {
      ast.country = "PH";
      ast.language = "tl";
      ast.explanation.push("Country: Philippines (🇵🇭)");
    } else if (/\b(korean|korea|k-drama)\b/i.test(q)) {
      ast.country = "KR";
      ast.language = "ko";
      ast.explanation.push("Country: South Korea (🇰🇷)");
    } else if (/\b(japanese|japan)\b/i.test(q) && ast.country !== "JP") {
      ast.country = "JP";
      ast.language = "ja";
      ast.explanation.push("Country: Japan (🇯🇵)");
    } else if (/\b(british|uk|england|united kingdom)\b/i.test(q)) {
      ast.country = "GB";
      ast.explanation.push("Country: United Kingdom (🇬🇧)");
    } else if (/\b(french|france)\b/i.test(q)) {
      ast.country = "FR";
      ast.language = "fr";
      ast.explanation.push("Country: France (🇫🇷)");
    } else if (/\b(spanish|spain)\b/i.test(q)) {
      ast.country = "ES";
      ast.language = "es";
      ast.explanation.push("Country: Spain (🇪🇸)");
    }

    // 6. Mood, Themes & Core Genres
    if (/\b(mind-bending|psychological|twist|twists|cerebral)\b/i.test(q)) {
      ast.mood = "mind-bending";
      ast.genres.push(9648, 53); // Mystery, Thriller
      ast.genreNames.push("Mystery", "Thriller");
      ast.explanation.push("Mood: Mind-Bending");
    }
    if (/\b(horror|scary|spooky)\b/i.test(q)) {
      ast.genres.push(27);
      ast.genreNames.push("Horror");
    }
    if (/\b(sci-fi|science fiction|space)\b/i.test(q)) {
      ast.genres.push(878);
      ast.genreNames.push("Science Fiction");
    }
    if (/\b(action|explosive)\b/i.test(q)) {
      ast.genres.push(28);
      ast.genreNames.push("Action");
    }
    if (/\b(comedy|funny|hilarious)\b/i.test(q)) {
      ast.genres.push(35);
      ast.genreNames.push("Comedy");
    }
    if (/\b(romance|romantic|love)\b/i.test(q)) {
      ast.genres.push(10749);
      ast.genreNames.push("Romance");
    }

    // 7. Content Advisory Intent
    if (/\b(no gore|without gore|zero gore)\b/i.test(q)) {
      ast.withoutGore = true;
      ast.explanation.push("Excluding: Gore");
    }
    if (/\b(no nudity|without nudity|no sex|no sexual content)\b/i.test(q)) {
      ast.withoutNudity = true;
      ast.sexualContent = "none";
      ast.explanation.push("Excluding: Nudity/Sex");
    }
    if (/\b(strong violence|intense violence)\b/i.test(q)) {
      ast.violence = "strong";
      ast.explanation.push("Advisory: Strong Violence");
    }

    // Deduplicate genres
    ast.genres = Array.from(new Set(ast.genres));
    ast.genreNames = Array.from(new Set(ast.genreNames));

    // Determine Intent Type
    if (ast.intentType === "TITLE_DIRECT") {
      if (ast.genres.length > 0 && ast.country) {
        ast.intentType = "GENRE_COUNTRY";
      } else if (ast.mood) {
        ast.intentType = "MOOD_THEME";
      } else if (ast.explanation.length > 1) {
        ast.intentType = "NATURAL_LANGUAGE";
      }
    }

    return ast;
  }

  /**
   * Converts SearchAST into a standardized SearchQueryObject contract.
   */
  static toSearchQueryObject(ast: SearchAST): SearchQueryObject {
    return {
      query: ast.normalizedQuery,
      mediaTypes: ast.mediaType !== "all" ? [ast.mediaType] : undefined,
      genres: ast.genreNames.length > 0 ? ast.genreNames : undefined,
      countries: ast.country ? [ast.country] : undefined,
      languages: ast.language ? [ast.language] : undefined,
      yearFrom: ast.yearStart || undefined,
      yearTo: ast.yearEnd || undefined,
      ratingMin: ast.minRating || undefined,
      status: ast.status || undefined,
    };
  }
}
