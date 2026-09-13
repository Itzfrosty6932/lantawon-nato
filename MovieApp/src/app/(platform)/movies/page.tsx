"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MediaShelf } from "@/components/movie/MediaShelf";
import { HeroSpotlightCarousel } from "@/components/home/HeroSpotlightCarousel";
import { SectionCatalogView } from "@/components/catalog/SectionCatalogView";
import { HeroGenreNav, GenreOption } from "@/components/catalog/HeroGenreNav";
import { useAppModals } from "@/components/layout/AppShell";
import type { MediaItem } from "@/types/media";

interface MovieShelfConfig {
  key: string;
  title: string;
  subtitle?: string;
  seeAllHref: string;
  endpoint: string;
}

const MOVIE_GENRES: GenreOption[] = [
  { id: "4k", name: "4K UHD", endpoint: "/api/catalog/discover?media_type=movie&sort_by=vote_average.desc&vote_count_gte=500" },
  { id: "28", name: "Action", endpoint: "/api/catalog/discover?media_type=movie&genre=28&sort_by=popularity.desc" },
  { id: "12", name: "Adventure", endpoint: "/api/catalog/discover?media_type=movie&genre=12&sort_by=popularity.desc" },
  { id: "16", name: "Animation", endpoint: "/api/catalog/discover?media_type=movie&genre=16&sort_by=popularity.desc" },
  { id: "35", name: "Comedy", endpoint: "/api/catalog/discover?media_type=movie&genre=35&sort_by=popularity.desc" },
  { id: "80", name: "Crime", endpoint: "/api/catalog/discover?media_type=movie&genre=80&sort_by=popularity.desc" },
  { id: "99", name: "Documentary", endpoint: "/api/catalog/discover?media_type=movie&genre=99&sort_by=popularity.desc" },
  { id: "18", name: "Drama", endpoint: "/api/catalog/discover?media_type=movie&genre=18&sort_by=popularity.desc" },
  { id: "10751", name: "Family", endpoint: "/api/catalog/discover?media_type=movie&genre=10751&sort_by=popularity.desc" },
  { id: "14", name: "Fantasy", endpoint: "/api/catalog/discover?media_type=movie&genre=14&sort_by=popularity.desc" },
  { id: "36", name: "History", endpoint: "/api/catalog/discover?media_type=movie&genre=36&sort_by=popularity.desc" },
  { id: "27", name: "Horror", endpoint: "/api/catalog/discover?media_type=movie&genre=27&sort_by=popularity.desc" },
  { id: "10402", name: "Music", endpoint: "/api/catalog/discover?media_type=movie&genre=10402&sort_by=popularity.desc" },
  { id: "9648", name: "Mystery", endpoint: "/api/catalog/discover?media_type=movie&genre=9648&sort_by=popularity.desc" },
  { id: "10749", name: "Romance", endpoint: "/api/catalog/discover?media_type=movie&genre=10749&sort_by=popularity.desc" },
  { id: "878", name: "Science Fiction", endpoint: "/api/catalog/discover?media_type=movie&genre=878&sort_by=popularity.desc" },
  { id: "53", name: "Thriller", endpoint: "/api/catalog/discover?media_type=movie&genre=53&sort_by=popularity.desc" },
  { id: "10752", name: "War", endpoint: "/api/catalog/discover?media_type=movie&genre=10752&sort_by=popularity.desc" },
  { id: "37", name: "Western", endpoint: "/api/catalog/discover?media_type=movie&genre=37&sort_by=popularity.desc" },
  { id: "ph", name: "Filipino Cinema", endpoint: "/api/catalog/discover?media_type=movie&country=PH&sort_by=popularity.desc" },
  { id: "kr", name: "Korean Cinema", endpoint: "/api/catalog/discover?media_type=movie&country=KR&sort_by=popularity.desc" },
];

const MOVIE_SHELVES_CONFIG: MovieShelfConfig[] = [
  {
    key: "trendingMovies",
    title: "Trending Movies",
    subtitle: "What the world is watching right now",
    seeAllHref: "/movies?section=trendingMovies",
    endpoint: "/api/catalog/trending?media_type=movie&time_window=day",
  },
  {
    key: "topMovies",
    title: "Top-Rated Cinema Masterpieces",
    subtitle: "Critically acclaimed all-time best movies",
    seeAllHref: "/movies?section=topMovies",
    endpoint: "/api/catalog/discover?media_type=movie&sort_by=vote_average.desc&vote_count_gte=500",
  },
  {
    key: "actionBlockbusters",
    title: "Action & High-Octane Blockbusters",
    subtitle: "Thrills, explosions, and adrenaline rushes",
    seeAllHref: "/movies?section=actionBlockbusters",
    endpoint: "/api/catalog/discover?media_type=movie&genre=28,12&sort_by=popularity.desc",
  },
  {
    key: "localPinoy",
    title: "Filipino Cinema & Pinoy Hits",
    subtitle: "Tagalog blockbusters and indie favorites",
    seeAllHref: "/movies?section=localPinoy",
    endpoint: "/api/catalog/discover?media_type=movie&country=PH&sort_by=popularity.desc",
  },
  {
    key: "koreanCinema",
    title: "Korean Cinema & Thrillers",
    subtitle: "Award-winning South Korean films",
    seeAllHref: "/movies?section=koreanCinema",
    endpoint: "/api/catalog/discover?media_type=movie&country=KR&sort_by=popularity.desc",
  },
  {
    key: "scifiCyberpunk",
    title: "Sci-Fi & Cyberpunk Universes",
    subtitle: "Futuristic sagas, space exploration, and AI",
    seeAllHref: "/movies?section=scifiCyberpunk",
    endpoint: "/api/catalog/discover?media_type=movie&genre=878&sort_by=popularity.desc",
  },
  {
    key: "horrorSuspense",
    title: "Horror & Psychological Suspense",
    subtitle: "Chilling hauntings and twisted storylines",
    seeAllHref: "/movies?section=horrorSuspense",
    endpoint: "/api/catalog/discover?media_type=movie&genre=27,53&sort_by=popularity.desc",
  },
  {
    key: "comedyFeelGood",
    title: "Comedy & Feel-Good Laughs",
    subtitle: "Hilarious hits and comfort cinema",
    seeAllHref: "/movies?section=comedyFeelGood",
    endpoint: "/api/catalog/discover?media_type=movie&genre=35&sort_by=popularity.desc",
  },
  {
    key: "romanceDrama",
    title: "Romance & Heartfelt Dramas",
    subtitle: "Passionate love stories and emotional journeys",
    seeAllHref: "/movies?section=romanceDrama",
    endpoint: "/api/catalog/discover?media_type=movie&genre=10749,18&sort_by=popularity.desc",
  },
  {
    key: "crimeHeist",
    title: "Crime, Heists & Mafia",
    subtitle: "Underworld schemes and detective thrillers",
    seeAllHref: "/movies?section=crimeHeist",
    endpoint: "/api/catalog/discover?media_type=movie&genre=80&sort_by=popularity.desc",
  },
  {
    key: "familyAnimation",
    title: "Kids & Family Animation",
    subtitle: "Magical animated tales for all ages",
    seeAllHref: "/movies?section=familyAnimation",
    endpoint: "/api/catalog/discover?media_type=movie&genre=10751,16&sort_by=popularity.desc",
  },
  {
    key: "warMilitary",
    title: "War & Military Epics",
    subtitle: "Historical battles and heroic accounts",
    seeAllHref: "/movies?section=warMilitary",
    endpoint: "/api/catalog/discover?media_type=movie&genre=10752,36&sort_by=popularity.desc",
  },
];

function MoviesDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSectionKey = searchParams.get("section");
  const activeGenreId = searchParams.get("genre");
  const { openTrailer } = useAppModals();

  const [spotlightItems, setSpotlightItems] = useState<MediaItem[]>([]);
  const [shelvesData, setShelvesData] = useState<Record<string, MediaItem[]>>({});
  const [loading, setLoading] = useState(true);

  // If a specific section or genre is selected, display its dedicated SectionCatalogView
  const selectedSection = MOVIE_SHELVES_CONFIG.find((s) => s.key === activeSectionKey);
  const selectedGenre = MOVIE_GENRES.find((g) => g.id === activeGenreId);

  useEffect(() => {
    let isMounted = true;

    async function loadMoviesDashboard() {
      try {
        setLoading(true);

        // 1. Fetch Spotlight Movies
        const spotRes = await fetch("/api/catalog/trending?media_type=movie&time_window=day");
        if (spotRes.ok) {
          const data = await spotRes.json();
          if (isMounted) {
            const list = data.results || [];
            setSpotlightItems(list.slice(0, 10));
          }
        }

        // 2. Fetch all movie shelves concurrently
        const fetches = MOVIE_SHELVES_CONFIG.map(async (shelf) => {
          try {
            const res = await fetch(shelf.endpoint);
            if (!res.ok) return { key: shelf.key, items: [] };
            const json = await res.json();
            return { key: shelf.key, items: (json.results || json.items || []).slice(0, 20) };
          } catch {
            return { key: shelf.key, items: [] };
          }
        });

        const results = await Promise.all(fetches);
        if (isMounted) {
          const map: Record<string, MediaItem[]> = {};
          for (const r of results) {
            map[r.key] = r.items;
          }
          setShelvesData(map);
        }
      } catch (err) {
        console.error("Failed to load movies dashboard:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMoviesDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  if (selectedSection) {
    return (
      <SectionCatalogView
        title={selectedSection.title}
        subtitle={selectedSection.subtitle}
        endpoint={selectedSection.endpoint}
        backHref="/movies"
        backLabel="Back to Movies"
        onOpenTrailer={openTrailer}
      />
    );
  }

  if (selectedGenre) {
    return (
      <SectionCatalogView
        title={`${selectedGenre.name} Movies`}
        subtitle={`Browse all ${selectedGenre.name} feature films and releases`}
        endpoint={selectedGenre.endpoint || `/api/catalog/discover?media_type=movie&genre=${selectedGenre.id}&sort_by=popularity.desc`}
        backHref="/movies"
        backLabel="Back to Movies"
        onOpenTrailer={openTrailer}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col select-none">
        <div className="aspect-[21/9] bg-neutral-900/50 animate-pulse" />
        <div className="relative z-20 -mt-14 sm:-mt-20 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
          {MOVIE_SHELVES_CONFIG.slice(0, 3).map((shelf) => (
            <div key={shelf.key} className="animate-pulse space-y-4">
              <div className="h-6 bg-neutral-800 w-1/4 rounded" />
              <div className="h-48 bg-neutral-900/50 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col select-none relative">
      {/* ─── Hero Title & Genres Dropdown Pill Header (Screenshots 1 & 2) ─── */}
      <div className="absolute top-20 sm:top-24 left-4 sm:left-8 lg:left-12 z-30 pointer-events-auto">
        <HeroGenreNav
          title="Movies"
          genres={MOVIE_GENRES}
          onSelectGenre={(g) => router.push(`/movies?genre=${g.id}`)}
          selectedGenreId={activeGenreId}
        />
      </div>

      {/* ─── 1. Full-Bleed Cinema Hero Spotlight ─── */}
      <HeroSpotlightCarousel
        items={spotlightItems}
        onOpenTrailer={openTrailer}
      />

      {/* ─── 2. Sequential Category Media Shelves Container ─── */}
      <div className="relative z-20 mt-4 sm:-mt-12 lg:-mt-16 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
        {MOVIE_SHELVES_CONFIG.map((shelf) => {
          const items = shelvesData[shelf.key] || [];
          if (items.length === 0) return null;

          return (
            <MediaShelf
              key={shelf.key}
              title={shelf.title}
              subtitle={shelf.subtitle}
              seeAllHref={shelf.seeAllHref}
              items={items}
              onOpenTrailer={openTrailer}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col select-none">
          <div className="aspect-[21/9] bg-neutral-900/50 animate-pulse" />
          <div className="relative z-20 -mt-14 sm:-mt-20 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-neutral-800 w-1/4 rounded" />
              <div className="h-48 bg-neutral-900/50 rounded-lg" />
            </div>
          </div>
        </div>
      }
    >
      <MoviesDashboard />
    </Suspense>
  );
}
