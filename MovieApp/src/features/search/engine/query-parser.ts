import type { SearchAST, QueryIntentType } from "./types";

const KNOWN_PEOPLE = [
  "christopher nolan",
  "hayao miyazaki",
  "quentin tarantino",
  "denis villeneuve",
  "martin scorsese",
  "steven spielberg",
  "david fincher",
  "guillermo del toro",
  "tom holland",
  "cillian murphy",
  "leonardo dicaprio",
  "robert pattinson",
  "keanu reeves",
  "zendaya",
  "timothee chalamet",
  "makoto shinkai",
  "satoshi kon",
  "bong joon-ho",
  "park chan-wook",
  "stanley kubrick",
  "ridley scott",
  "james cameron",
];

const GENRE_MAP: Record<string, { id: number; name: string }> = {
  action: { id: 28, name: "Action" },
  adventure: { id: 12, name: "Adventure" },
  animation: { id: 16, name: "Animation" },
  comedy: { id: 35, name: "Comedy" },
  crime: { id: 80, name: "Crime" },
  documentary: { id: 99, name: "Documentary" },
  drama: { id: 18, name: "Drama" },
  family: { id: 10751, name: "Family" },
  fantasy: { id: 14, name: "Fantasy" },
  history: { id: 36, name: "History" },
  horror: { id: 27, name: "Horror" },
  music: { id: 10402, name: "Music" },
  mystery: { id: 9648, name: "Mystery" },
  romance: { id: 10749, name: "Romance" },
  "sci-fi": { id: 878, name: "Sci-Fi" },
  "science fiction": { id: 878, name: "Sci-Fi" },
  sports: { id: 6075, name: "Sports" },
  sport: { id: 6075, name: "Sports" },
  thriller: { id: 53, name: "Thriller" },
  war: { id: 10752, name: "War" },
  western: { id: 37, name: "Western" },
};

export class QueryParser {
  static parse(queryText: string): SearchAST {
    const raw = (queryText || "").trim();
    const q = raw.toLowerCase();

    const ast: SearchAST = {
      rawQuery: raw,
      normalizedQuery: raw,
      intentType: "TITLE_DIRECT",
      mediaType: "all",
      genres: [],
      genreNames: [],
      genreLogic: "ANY",
      explanation: [],
    };

    if (!raw) return ast;

    // 1. Check Similarity Search (e.g. "movies like Interstellar", "something like Death Note")
    const simMatch = q.match(/(?:movies|shows|series|anime|films|something)\s+(?:like|similar to)\s+(.+)/i) ||
                     q.match(/like\s+(.+)/i);
    if (simMatch && simMatch[1]) {
      ast.intentType = "SIMILARITY_SEARCH";
      ast.seedTitle = simMatch[1].trim();
      ast.explanation.push(`Finding titles similar to "${ast.seedTitle}"`);
      return ast;
    }

    // 2. Check Person Search (e.g. "directed by Christopher Nolan", or known person name)
    const personMatch = q.match(/(?:directed by|starring|actor|director|films of|by)\s+([a-z\s]+)/i);
    const matchedKnownPerson = KNOWN_PEOPLE.find((p) => q.includes(p));

    if (personMatch || matchedKnownPerson) {
      ast.intentType = "PERSON_SEARCH";
      ast.personName = (matchedKnownPerson || (personMatch ? personMatch[1] : q)).trim();
      ast.explanation.push(`Filtering filmography of "${ast.personName}"`);
    }

    // 3. Media Type Classification
    if (/\banime\b/i.test(q)) {
      ast.mediaType = "anime";
      ast.country = "JP";
      ast.language = "ja";
      ast.explanation.push("Media: Japanese Anime");
    } else if (/\b(cartoon|cartoons|animated series|animation)\b/i.test(q)) {
      ast.mediaType = "animation";
      ast.genres.push(16);
      ast.genreNames.push("Animation");
      ast.explanation.push("Format: Animation");
    } else if (/\b(series|show|shows|tv show|season|tv series)\b/i.test(q)) {
      ast.mediaType = "tv";
      ast.explanation.push("Media: Television Series");
    } else if (/\b(documentary|docuseries|documentaries|docu)\b/i.test(q)) {
      ast.mediaType = "documentary";
      ast.genres.push(99);
      ast.genreNames.push("Documentary");
      ast.explanation.push("Media: Documentaries");
    } else if (/\b(movie|movies|film|films|cinema|feature film)\b/i.test(q)) {
      ast.mediaType = "movie";
      ast.explanation.push("Media: Feature Films");
    }

    // 4. Era & Time Constraints
    if (/\b(1990s|90s|nineties)\b/i.test(q)) {
      ast.yearStart = 1990;
      ast.yearEnd = 1999;
      ast.decade = "1990s";
      ast.explanation.push("Timeframe: 1990s Decade");
    } else if (/\b(1980s|80s|eighties)\b/i.test(q)) {
      ast.yearStart = 1980;
      ast.yearEnd = 1989;
      ast.decade = "1980s";
      ast.explanation.push("Timeframe: 1980s Decade");
    } else if (/\b(2000s|00s|early 2000s)\b/i.test(q)) {
      ast.yearStart = 2000;
      ast.yearEnd = 2009;
      ast.decade = "2000s";
      ast.explanation.push("Timeframe: 2000s Decade");
    } else if (/\b(2010s|tens)\b/i.test(q)) {
      ast.yearStart = 2010;
      ast.yearEnd = 2019;
      ast.decade = "2010s";
      ast.explanation.push("Timeframe: 2010s Decade");
    } else if (/\b(latest|new|2024|2025|2026|recent)\b/i.test(q)) {
      ast.yearStart = 2023;
      ast.yearEnd = 2026;
      ast.explanation.push("Timeframe: Recent Releases (2023–2026)");
    }

    // 5. Origin & Country
    if (/\b(korean|k-drama|korea|south korea)\b/i.test(q)) {
      ast.country = "KR";
      ast.explanation.push("Origin: South Korea (🇰🇷)");
    } else if (/\b(japanese|japan)\b/i.test(q) && ast.mediaType !== "anime") {
      ast.country = "JP";
      ast.explanation.push("Origin: Japan (🇯🇵)");
    } else if (/\b(chinese|china|donghua)\b/i.test(q)) {
      ast.country = "CN";
      ast.explanation.push("Origin: China (🇨🇳)");
    } else if (/\b(british|uk|england|united kingdom)\b/i.test(q)) {
      ast.country = "GB";
      ast.explanation.push("Origin: United Kingdom (🇬🇧)");
    } else if (/\b(french|france)\b/i.test(q)) {
      ast.country = "FR";
      ast.explanation.push("Origin: France (🇫🇷)");
    } else if (/\b(filipino|pinoy|philippines)\b/i.test(q)) {
      ast.country = "PH";
      ast.explanation.push("Origin: Philippines (🇵🇭)");
    }

    // 6. Genres & Thematic Keywords
    for (const [key, value] of Object.entries(GENRE_MAP)) {
      const regex = new RegExp(`\\b${key}\\b`, "i");
      if (regex.test(q)) {
        if (!ast.genres.includes(value.id)) {
          ast.genres.push(value.id);
          ast.genreNames.push(value.name);
          ast.explanation.push(`Genre: ${value.name}`);
        }
      }
    }

    // 7. Mood / Tone
    if (/\b(mind-bending|psychological|cerebral|complex|twist)\b/i.test(q)) {
      ast.mood = "mind-bending";
      if (!ast.genres.includes(9648)) {
        ast.genres.push(9648);
        ast.genreNames.push("Mystery");
      }
      ast.explanation.push("Tone: Psychological & Mind-Bending");
    }
    if (/\b(dark|gritty|intense|noir|violent)\b/i.test(q)) {
      ast.mood = "dark";
      if (!ast.genres.includes(53)) {
        ast.genres.push(53);
        ast.genreNames.push("Thriller");
      }
      ast.explanation.push("Tone: Dark & Gritty");
    }

    // 8. Rating & Quality constraints
    if (/\b(top rated|masterpiece|best|masterpieces|critically acclaimed|high rated)\b/i.test(q)) {
      ast.minRating = 8.0;
      ast.explanation.push("Rating: Top Rated (★ 8.0+)");
    }

    // 9. Content Guide Safety Flags
    if (/\b(no gore|without gore|zero gore)\b/i.test(q)) {
      ast.withoutGore = true;
      ast.explanation.push("Content Guide: Exclude Extreme Gore");
    }
    if (/\b(no nudity|no sex|family friendly|clean)\b/i.test(q)) {
      ast.withoutNudity = true;
      ast.explanation.push("Content Guide: Clean / Family Friendly");
    }

    // Determine primary intent type if not person or similarity
    if (ast.intentType === "TITLE_DIRECT") {
      if (ast.genres.length > 0 || ast.country || ast.decade || ast.mood) {
        ast.intentType = "NATURAL_LANGUAGE";
      }
    }

    // Normalized search query with extracted noise stripped
    let cleaned = raw
      .replace(/\b(movies?|films?|series|shows?|anime|documentar(?:y|ies)|top rated|best|latest|new)\b/gi, "")
      .replace(/\b(in|from|with|directed by|starring|like|similar to)\b/gi, "")
      .trim();

    ast.normalizedQuery = cleaned || raw;

    return ast;
  }
}
