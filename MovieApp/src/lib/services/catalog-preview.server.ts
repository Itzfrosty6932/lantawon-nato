import { fetchTmdb } from "@/lib/api/tmdb";
import type { MediaItem } from "@/types/media";

interface TrendingResponse {
  results: MediaItem[];
}

const FALLBACK_TRENDING_MOVIES: MediaItem[] = [
  {
    id: 693134,
    title: "Dune: Part Two",
    name: "Dune: Part Two",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5200fr.jpg",
    vote_average: 8.2,
    vote_count: 5600,
    release_date: "2024-02-27",
    overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    genre_ids: [878, 12],
    media_type: "movie",
  },
  {
    id: 872585,
    title: "Oppenheimer",
    name: "Oppenheimer",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    vote_average: 8.1,
    vote_count: 9200,
    release_date: "2023-07-19",
    overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    genre_ids: [18, 36],
    media_type: "movie",
  },
  {
    id: 533535,
    title: "Deadpool & Wolverine",
    name: "Deadpool & Wolverine",
    poster_path: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdrop_path: "/yDHYTfA3R0jFYba16jBB1jv82aC.jpg",
    vote_average: 7.7,
    vote_count: 4800,
    release_date: "2024-07-24",
    overview: "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.",
    genre_ids: [28, 35, 878],
    media_type: "movie",
  },
  {
    id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    name: "Spider-Man: Across the Spider-Verse",
    poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    backdrop_path: "/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    vote_average: 8.4,
    vote_count: 7100,
    release_date: "2023-05-31",
    overview: "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse.",
    genre_ids: [16, 28, 12, 878],
    media_type: "movie",
  },
  {
    id: 912649,
    title: "Venom: The Last Dance",
    name: "Venom: The Last Dance",
    poster_path: "/aosm8Vh9yIHvrstFXA2hMcpJbHk.jpg",
    backdrop_path: "/v9acaWVxdua5Bfv54964Nq8jMgh.jpg",
    vote_average: 6.8,
    vote_count: 2400,
    release_date: "2024-10-22",
    overview: "Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced into a devastating decision that will bring the curtains down on Venom and Eddie's last dance.",
    genre_ids: [28, 878, 12],
    media_type: "movie",
  },
  {
    id: 1022789,
    title: "Inside Out 2",
    name: "Inside Out 2",
    poster_path: "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    backdrop_path: "/stKGOm8wqGGOvYm6qegGRORq7IC.jpg",
    vote_average: 7.6,
    vote_count: 5300,
    release_date: "2024-06-11",
    overview: "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions!",
    genre_ids: [16, 10751, 12, 35],
    media_type: "movie",
  },
  {
    id: 85,
    title: "Demon Slayer: Kimetsu no Yaiba",
    name: "Demon Slayer: Kimetsu no Yaiba",
    poster_path: "/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
    backdrop_path: "/nTvM4mhqZlHIvUkI1gVnWumQUAe.jpg",
    vote_average: 8.7,
    vote_count: 6200,
    first_air_date: "2019-04-06",
    overview: "Tanjiro Kamado, a young boy whose family was slaughtered by demons, joins the Demon Slayer Corps to turn his sister Nezuko back into a human.",
    genre_ids: [16, 10759, 10765],
    media_type: "tv",
  },
  {
    id: 1184918,
    title: "The Wild Robot",
    name: "The Wild Robot",
    poster_path: "/wTnV3PCVW5O92JMrFvvrRil39io.jpg",
    backdrop_path: "/417tYZ4XUyJrtyZXj7HpvWf1E8f.jpg",
    vote_average: 8.3,
    vote_count: 3900,
    release_date: "2024-09-12",
    overview: "After a shipwreck, an intelligent robot called Roz is stranded on an uninhabited island and must learn to adapt to the harsh surroundings.",
    genre_ids: [16, 878, 10751],
    media_type: "movie",
  },
  {
    id: 945961,
    title: "Alien: Romulus",
    name: "Alien: Romulus",
    poster_path: "/b33nnKl1GSFbao8l3fZkyqsY7Ge.jpg",
    backdrop_path: "/9SSEUrSqhljBMzRe4aBTh17rUaC.jpg",
    vote_average: 7.3,
    vote_count: 3100,
    release_date: "2024-08-13",
    overview: "While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.",
    genre_ids: [27, 878],
    media_type: "movie",
  },
  {
    id: 762441,
    title: "A Quiet Place: Day One",
    name: "A Quiet Place: Day One",
    poster_path: "/hU1Q9YVzdYwh89696o89h1129w.jpg",
    backdrop_path: "/2RVcJbWFmICRDsEjRI8oqBTYUpA.jpg",
    vote_average: 6.8,
    vote_count: 2800,
    release_date: "2024-06-26",
    overview: "As New York City is invaded by alien creatures who hunt by sound, a woman named Sam must survive an uncanny journey through the city.",
    genre_ids: [27, 878, 53],
    media_type: "movie",
  },
];

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
      const filtered = (data?.results || [])
        .filter((item) => {
          if (!item.poster_path || !(item.title || item.name)) return false;
          if (item.adult === true) return false;
          const overview = (item.overview || "").toLowerCase();
          const title = (item.title || item.name || "").toLowerCase();
          return !explicitTerms.some((t) => overview.includes(t) || title.includes(t));
        })
        .slice(0, limit);

      if (filtered.length > 0) return filtered;
      return FALLBACK_TRENDING_MOVIES.slice(0, limit);
    } catch (error) {
      console.error("[CatalogPreview] Failed to fetch trending movies, using curated list:", error);
      return FALLBACK_TRENDING_MOVIES.slice(0, limit);
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
