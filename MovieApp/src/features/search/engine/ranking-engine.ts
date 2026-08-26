import type { MediaItem } from "@/types/media";

export interface RankedItem extends MediaItem {
  relevanceScore: number;
  matchReasons: string[];
}

export class RankingEngine {
  /**
   * Calculates Levenshtein Distance for typo tolerance.
   */
  static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Check for typo suggestions (e.g., "interstelar" -> "Interstellar").
   */
  static detectTypoCorrection(query: string, candidateTitles: string[]): { suggested: string; original: string } | null {
    const q = query.trim().toLowerCase();
    if (q.length < 4) return null;

    let closestTitle: string | null = null;
    let minDistance = 999;

    for (const title of candidateTitles) {
      const t = title.toLowerCase();
      if (t === q) return null; // Exact match already exists

      const dist = this.levenshtein(q, t);
      // If 1 or 2 typos and candidate length is close
      if (dist > 0 && dist <= 2 && Math.abs(t.length - q.length) <= 2) {
        if (dist < minDistance) {
          minDistance = dist;
          closestTitle = title;
        }
      }
    }

    if (closestTitle) {
      return { suggested: closestTitle, original: query };
    }
    return null;
  }

  /**
   * Scores and ranks media items according to multi-factor relevance.
   */
  static rankResults(items: MediaItem[], query: string, sortBy: string = "best_match"): RankedItem[] {
    const q = query.trim().toLowerCase();

    const ranked: RankedItem[] = items.map((item) => {
      let score = 0;
      const reasons: string[] = [];
      const title = (item.title || item.name || "").toLowerCase();
      const originalTitle = (item.original_title || item.original_name || "").toLowerCase();
      const overview = (item.overview || "").toLowerCase();

      if (q) {
        // 1. Exact Title Match
        if (title === q || originalTitle === q) {
          score += 120;
          reasons.push("Exact Title Match");
        }
        // 2. Starts With
        else if (title.startsWith(q) || originalTitle.startsWith(q)) {
          score += 70;
          reasons.push("Title Starts With Query");
        }
        // 3. Contains Full Query Phrase
        else if (title.includes(q) || originalTitle.includes(q)) {
          score += 45;
          reasons.push("Title Contains Query");
        }
        // 4. Word-by-word Match
        else {
          const queryWords = q.split(/\s+/).filter((w) => w.length > 2);
          let matchedWords = 0;
          for (const w of queryWords) {
            if (title.includes(w)) matchedWords++;
          }
          if (matchedWords > 0) {
            score += matchedWords * 15;
            reasons.push(`${matchedWords} Keywords Matched`);
          }
        }

        // Overview Match (lower weight)
        if (overview.includes(q) && score === 0) {
          score += 15;
          reasons.push("Overview Match");
        }
      } else {
        score = 50; // Neutral baseline when browsing filters
      }

      // 5. Popularity Factor (logarithmic scaling)
      const pop = item.popularity || 0;
      const popScore = Math.min(25, Math.log10(pop + 1) * 8);
      score += popScore;

      // 6. Rating Factor (★ 8.0+ gets bonus)
      const rating = item.vote_average || 0;
      if (rating >= 8.0) {
        score += 15;
      } else if (rating >= 7.0) {
        score += 8;
      }

      // 7. Vote Count Credibility
      const voteCount = item.vote_count || 0;
      if (voteCount > 1000) {
        score += 10;
      } else if (voteCount > 100) {
        score += 5;
      }

      // 8. Official Poster Artwork Credibility
      if (item.poster_path) {
        score += 25;
      } else if (!item.backdrop_path && voteCount === 0) {
        score -= 50; // Heavy penalty for scrap
      }

      return {
        ...item,
        relevanceScore: Math.round(score),
        matchReasons: reasons,
      };
    });

    // Apply sorting
    if (sortBy === "popularity.desc" || sortBy === "trending") {
      return ranked.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
    if (sortBy === "vote_average.desc" || sortBy === "top_rated") {
      return ranked.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    }
    if (sortBy === "primary_release_date.desc" || sortBy === "recent") {
      return ranked.sort((a, b) => {
        const da = a.release_date || a.first_air_date || "";
        const db = b.release_date || b.first_air_date || "";
        return db.localeCompare(da);
      });
    }
    if (sortBy === "primary_release_date.asc" || sortBy === "oldest") {
      return ranked.sort((a, b) => {
        const da = a.release_date || a.first_air_date || "";
        const db = b.release_date || b.first_air_date || "";
        return da.localeCompare(db);
      });
    }
    if (sortBy === "title.asc" || sortBy === "name_asc") {
      return ranked.sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
    }
    if (sortBy === "title.desc" || sortBy === "name_desc") {
      return ranked.sort((a, b) => (b.title || b.name || "").localeCompare(a.title || a.name || ""));
    }

    // Default: Best Match
    return ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}
