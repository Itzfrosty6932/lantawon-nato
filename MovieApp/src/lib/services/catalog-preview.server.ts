import { fetchTmdb } from "@/lib/api/tmdb";
import type { MediaItem } from "@/types/media";

interface TrendingResponse {
  results: MediaItem[];
}

/**
 * Server-side catalog preview service for landing page
 * Fetches real trending/popular content to showcase the platform
 */
export class CatalogPreviewService {
  /**
   * Get trending movies for preview
   */
  static async getTrendingMovies(limit: number = 10): Promise<MediaItem[]> {
    try {
      const data = await fetchTmdb<TrendingResponse>("trending/all/day", { page: 1 });
      const explicitTerms = ["softcore", "erotica", "pornography", "explicit nudity", "hotel desire", "hentai"];
      return (data?.results || [])
        .filter((item) => {
          if (!item.poster_path || !(item.title || item.name)) return false;
          if (item.adult === true) return false;
          const overview = (item.overview || "").toLowerCase();
          const title = (item.title || item.name || "").toLowerCase();
          return !explicitTerms.some((t) => overview.includes(t) || title.includes(t));
        })
        .slice(0, limit);
    } catch (error) {
      console.error("[CatalogPreview] Failed to fetch trending movies:", error);
      return [];
    }
  }

  /**
   * Get popular series for preview
   */
  static async getPopularSeries(limit: number = 10): Promise<MediaItem[]> {
    try {
      const data = await fetchTmdb<TrendingResponse>("tv/popular", { page: 1 });
      return (data?.results || []).slice(0, limit);
    } catch (error) {
      console.error("[CatalogPreview] Failed to fetch popular series:", error);
      return [];
    }
  }

  /**
   * Get trending anime (Japanese TV with animation genre)
   */
  static async getTrendingAnime(limit: number = 10): Promise<MediaItem[]> {
    try {
      const data = await fetchTmdb<TrendingResponse>("discover/tv", {
        with_original_language: "ja",
        with_genres: "16",
        sort_by: "popularity.desc",
        page: 1,
      });
      return (data?.results || []).slice(0, limit);
    } catch (error) {
      console.error("[CatalogPreview] Failed to fetch anime:", error);
      return [];
    }
  }

  /**
   * Get top rated movies
   */
  static async getTopRatedMovies(limit: number = 10): Promise<MediaItem[]> {
    try {
      const data = await fetchTmdb<TrendingResponse>("movie/top_rated", { page: 1 });
      return (data?.results || []).slice(0, limit);
    } catch (error) {
      console.error("[CatalogPreview] Failed to fetch top rated:", error);
      return [];
    }
  }

  /**
   * Get all preview sections in parallel
   */
  static async getAllPreviewSections() {
    const [trending, popular, anime, topRated] = await Promise.all([
      this.getTrendingMovies(10),
      this.getPopularSeries(10),
      this.getTrendingAnime(10),
      this.getTopRatedMovies(10),
    ]);

    return {
      trendingMovies: trending,
      popularSeries: popular,
      anime,
      topRated,
    };
  }
}
