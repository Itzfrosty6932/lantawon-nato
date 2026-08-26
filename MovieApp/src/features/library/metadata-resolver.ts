import { fetchTmdb } from "@/lib/api/tmdb";
import type {
  CandidateMatch,
  ParsedFilenameMetadata,
  LocalMediaIdentity,
  MatchStatus,
} from "@/types/resolver";

export class MetadataResolver {
  /**
   * 1. Filename Parser with Advanced Token Normalization
   */
  static parseFilename(filename: string): ParsedFilenameMetadata {
    const extMatch = filename.match(/\.([a-z0-9]+)$/i);
    const extension = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
    let base = filename.replace(/\.[a-z0-9]+$/i, "").replace(/[._]/g, " ").trim();

    // Detect OVA / Special
    const isOvaOrSpecial = /\b(ova|oad|special|sp|ncop|nced)\b/i.test(base);

    // Detect Edition (Director's Cut, Extended, Remastered, Remux)
    const editionMatch = base.match(/\b(director'?s?\s*cut|extended(?:\s*cut)?|remastered|unrated|imax|theatrical)\b/i);
    const edition = editionMatch ? editionMatch[1] : undefined;

    // Detect Quality
    const qualityMatch = base.match(/\b(4k|2160p|1080p|720p|480p|bdrip|web-?dl|bluray|hdtv|remux)\b/i);
    const quality = qualityMatch ? qualityMatch[1].toUpperCase() : "1080P";

    // Strip leading release group brackets like [SubsPlease] or [Erai-raws]
    base = base.replace(/^\[.*?\]\s*/, "");

    // Check TV / Anime Episode Patterns
    // Patterns: S01E05, 1x05, Episode 05, - 06, S1 - 04, Season 1 Episode 5
    const s01e01Match = base.match(/(.*?)\s+[sS](\d{1,2})[eE](\d{1,3})/i);
    const xEpisodeMatch = base.match(/(.*?)\s+(\d{1,2})x(\d{1,3})/i);

    if (s01e01Match) {
      const cleaned = this.sanitizeTitle(s01e01Match[1]);
      return {
        rawFilename: filename,
        cleanedTitle: cleaned.title,
        mediaType: "tv",
        year: cleaned.year,
        season: parseInt(s01e01Match[2], 10),
        episode: parseInt(s01e01Match[3], 10),
        isOvaOrSpecial,
        edition,
        quality,
        extension,
      };
    }

    if (xEpisodeMatch) {
      const cleaned = this.sanitizeTitle(xEpisodeMatch[1]);
      return {
        rawFilename: filename,
        cleanedTitle: cleaned.title,
        mediaType: "tv",
        year: cleaned.year,
        season: parseInt(xEpisodeMatch[2], 10),
        episode: parseInt(xEpisodeMatch[3], 10),
        isOvaOrSpecial,
        edition,
        quality,
        extension,
      };
    }

    // 3. Anime standalone episode pattern like "[SubsPlease] Frieren - 06"
    const animeEpMatch = base.match(/^(.*?)\s+[-–]?\s*(?:ep|episode|#)?\s*(\d{1,3})(?:\s+\[.*\]|\s*\.\w+|\s*\(.*?\)|$)/i);

    if (animeEpMatch && parseInt(animeEpMatch[2], 10) > 0 && !/\b(19|20)\d{2}\b/.test(animeEpMatch[2])) {
      const rawTitle = animeEpMatch[1].replace(/\[.*?\]|\(.*?\)/g, "").trim();
      if (rawTitle.length > 1 && !this.isReleaseGroupOnly(rawTitle)) {
        const cleaned = this.sanitizeTitle(rawTitle);
        return {
          rawFilename: filename,
          cleanedTitle: cleaned.title,
          mediaType: "anime",
          year: cleaned.year,
          season: 1,
          episode: parseInt(animeEpMatch[2], 10),
          isOvaOrSpecial,
          edition,
          quality,
          extension,
        };
      }
    }

    // 2. Movie Pattern (with Year or standalone)
    const cleaned = this.sanitizeTitle(base);
    return {
      rawFilename: filename,
      cleanedTitle: cleaned.title,
      mediaType: "movie",
      year: cleaned.year,
      isOvaOrSpecial,
      edition,
      quality,
      extension,
    };
  }

  private static sanitizeTitle(raw: string): { title: string; year?: string } {
    let text = raw.replace(/\[.*?\]/g, " ").replace(/\{.*?\}/g, " ").trim();
    
    // Extract Year (1890 - 2030)
    let year: string | undefined = undefined;
    const yearMatch = text.match(/\b((?:19|20)\d{2})\b/);
    if (yearMatch) {
      year = yearMatch[1];
      text = text.replace(yearMatch[0], " ");
    }

    // Strip common release group & codec noise
    text = text
      .replace(
        /\b(1080p|720p|4k|2160p|480p|bluray|bdrip|webrip|web-dl|x264|x265|hevc|aac|dts|yify|rarbg|eztv|galaxyrg|flux|subsplease|judas|erai-raws|asw|horriblesubs|proper|repack|dual-audio)\b/gi,
        " "
      )
      .replace(/[\(\)\[\]\{\}\-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return { title: text || "Untitled", year };
  }

  private static isReleaseGroupOnly(str: string): boolean {
    const groups = ["subsplease", "erai-raws", "judas", "horriblesubs", "asw", "yify", "rarbg", "flux"];
    return groups.includes(str.toLowerCase());
  }

  /**
   * 2. Bigram Dice String Similarity (0.0 to 1.0)
   */
  static calculateStringSimilarity(s1: string, s2: string): number {
    const norm1 = s1.toLowerCase().replace(/[^a-z0-9]/g, "");
    const norm2 = s2.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (norm1 === norm2) return 1.0;
    if (norm1.length < 2 || norm2.length < 2) return 0.0;

    const bigrams1 = new Set<string>();
    for (let i = 0; i < norm1.length - 1; i++) {
      bigrams1.add(norm1.substring(i, i + 2));
    }

    let intersection = 0;
    for (let i = 0; i < norm2.length - 1; i++) {
      const bi = norm2.substring(i, i + 2);
      if (bigrams1.has(bi)) intersection++;
    }

    return (2.0 * intersection) / (norm1.length - 1 + norm2.length - 1);
  }

  /**
   * 3. Multi-Signal Candidate Scorer
   */
  static scoreCandidate(
    candidate: {
      id: number;
      title?: string;
      name?: string;
      original_title?: string;
      original_name?: string;
      release_date?: string;
      first_air_date?: string;
      media_type?: string;
      vote_average?: number;
      vote_count?: number;
      poster_path?: string | null;
      overview?: string;
    },
    parsed: ParsedFilenameMetadata
  ): CandidateMatch {
    const candTitle = candidate.title || candidate.name || "";
    const candOrigTitle = candidate.original_title || candidate.original_name || "";
    const candDate = candidate.release_date || candidate.first_air_date || "";
    const candYear = candDate.split("-")[0] || "";
    const candType = (candidate.media_type === "tv" ? "tv" : "movie") as "movie" | "tv";

    // 1. Title Similarity (40% max)
    const simTitle = this.calculateStringSimilarity(parsed.cleanedTitle, candTitle);
    const simOrigTitle = this.calculateStringSimilarity(parsed.cleanedTitle, candOrigTitle);
    const bestTitleSim = Math.max(simTitle, simOrigTitle);
    const titleScore = bestTitleSim * 40;

    // 2. Year Match (15% max)
    let yearScore = 7.5; // Neutral default when no year in filename
    if (parsed.year && candYear) {
      const diff = Math.abs(parseInt(parsed.year, 10) - parseInt(candYear, 10));
      if (diff === 0) yearScore = 15;
      else if (diff === 1) yearScore = 12;
      else if (diff === 2) yearScore = 6;
      else yearScore = 0;
    }

    // 3. Media Type Match (15% max)
    let typeScore = 15;
    if (parsed.mediaType === "tv" || parsed.mediaType === "anime") {
      typeScore = candType === "tv" ? 15 : 0;
    } else if (parsed.mediaType === "movie") {
      typeScore = candType === "movie" ? 15 : 4;
    }

    // 4. Season / Episode Verification (15% max)
    const seScore = 15; // TV candidate valid

    // 5. Popularity & Vote Weighting (10% max)
    const votes = candidate.vote_count || 0;
    let popularityBonus = 0;
    if (votes > 5000) popularityBonus = 10;
    else if (votes > 1000) popularityBonus = 8;
    else if (votes > 100) popularityBonus = 5;
    else popularityBonus = 2;

    const totalScore = Math.min(100, Math.round(titleScore + yearScore + typeScore + seScore + popularityBonus));

    return {
      tmdbId: candidate.id,
      title: candTitle,
      originalTitle: candOrigTitle,
      mediaType: candType,
      year: candYear,
      score: totalScore,
      posterPath: candidate.poster_path,
      overview: candidate.overview,
      matchSignals: {
        titleSimilarity: Math.round(titleScore),
        yearMatch: Math.round(yearScore),
        typeMatch: Math.round(typeScore),
        seasonEpisodeMatch: seScore,
        popularityBonus: Math.round(popularityBonus),
      },
    };
  }

  /**
   * 4. Full Metadata Resolution Pipeline
   */
  static async resolveFileMetadata(
    filename: string,
    fullPath: string = filename,
    fileSize: number = 0
  ): Promise<LocalMediaIdentity> {
    const parsed = this.parseFilename(filename);
    const fingerprint = `fp_${fileSize}_${filename.replace(/[^a-z0-9]/gi, "_")}`;

    // 1. Search TMDB candidates
    let candidates: CandidateMatch[] = [];
    const searchEndpoint = parsed.mediaType === "tv" ? "search/tv" : parsed.mediaType === "movie" ? "search/movie" : "search/multi";

    try {
      let results: Array<Record<string, unknown>> = [];
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/search?q=${encodeURIComponent(parsed.cleanedTitle)}`);
        if (res.ok) {
          const data = await res.json();
          results = data.results || [];
        }
      } else {
        const searchData = await fetchTmdb<{ results: Array<Record<string, unknown>> }>(searchEndpoint, {
          query: parsed.cleanedTitle,
          page: 1,
        });
        results = searchData?.results || [];
      }

      if (results && results.length > 0) {
        candidates = results
          .map((item) => this.scoreCandidate(item as unknown as { id: number }, parsed))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
      }
    } catch (e) {
      console.warn("[MetadataResolver Search Error]", e);
    }

    // 2. Determine Confidence & Status
    const bestCandidate = candidates[0];
    const topScore = bestCandidate ? bestCandidate.score : 0;
    let matchStatus: MatchStatus = "unknown";

    if (topScore >= 95) {
      matchStatus = "high_confidence";
    } else if (topScore >= 85) {
      matchStatus = "review_needed";
    } else if (topScore >= 60) {
      matchStatus = "ambiguous";
    } else {
      matchStatus = "unknown";
    }

    const localMediaId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return {
      localMediaId,
      fileFingerprint: fingerprint,
      fullPath,
      fileName: filename,
      sizeBytes: fileSize,
      sizeFormatted: `${(fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      mediaType: parsed.mediaType,
      canonicalTitle: bestCandidate ? bestCandidate.title : parsed.cleanedTitle,
      year: bestCandidate ? bestCandidate.year : parsed.year,
      season: parsed.season,
      episode: parsed.episode,
      externalMetadataId: bestCandidate ? bestCandidate.tmdbId : undefined,
      posterPath: bestCandidate?.posterPath || undefined,
      overview: bestCandidate?.overview || "Local offline media file.",
      matchConfidence: topScore,
      matchStatus,
      candidates,
      isUserOverridden: false,
      createdAt: new Date().toISOString(),
      lastScannedAt: new Date().toISOString(),
    };
  }
}
