import { fetchTmdb } from "@/lib/api/tmdb";
import { CatalogService } from "@/features/catalog/service";
import type { MediaItem } from "@/types/media";

export class RecommendationService {
  static async getMoodRecommendations(mood: string, page: string | number = 1) {
    const moodMap: Record<string, string> = {
      "mind-bending": "9648,878",
      "dark-gritty": "80,53",
      "feel-good": "35,10751",
      adrenaline: "28,12",
      emotional: "18,10749",
      "spine-chilling": "27,9648",
      relaxing: "16,10751",
      "epic-adventure": "12,14",
    };

    const genre = moodMap[mood] || "28";
    return CatalogService.discover({ genre, page, min_rating: "7.0" });
  }

  static async getWhyRecommended(id: string | number, type: string = "movie") {
    const details = type === "tv" ? await CatalogService.getSeries(id) : await CatalogService.getMovie(id);
    if (!details) {
      return { reasons: ["Curated based on trending popularity and critical acclaim."] };
    }

    const reasons: string[] = [];
    const rating = details.vote_average || 0;
    const votes = details.vote_count || 0;

    if (rating >= 8.0 && votes > 500) {
      reasons.push(`Masterpiece status with exceptional rating (${rating.toFixed(1)}/10 across ${votes.toLocaleString()} cinephiles)`);
    }

    if (details.genres && details.genres.length > 0) {
      reasons.push(`Combines compelling ${details.genres.map((g) => g.name).join(" & ")} storytelling tropes`);
    }

    if (details.credits?.cast && details.credits.cast.length > 0) {
      const topStars = details.credits.cast.slice(0, 2).map((c) => c.name).join(" and ");
      reasons.push(`Showcases powerhouse performances by ${topStars}`);
    }

    if (reasons.length === 0) {
      reasons.push("Curated based on verified cast, genre tropes, and critical reception.");
    }

    return { reasons };
  }
}
