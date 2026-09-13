"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MediaShelf } from "@/components/movie/MediaShelf";
import { HeroSpotlightCarousel } from "@/components/home/HeroSpotlightCarousel";
import { SectionCatalogView } from "@/components/catalog/SectionCatalogView";
import { HeroGenreNav, GenreOption } from "@/components/catalog/HeroGenreNav";
import { useAppModals } from "@/components/layout/AppShell";
import type { MediaItem } from "@/types/media";

interface AnimeShelfConfig {
  key: string;
  title: string;
  subtitle?: string;
  seeAllHref: string;
  endpoint: string;
}

// Complete 9anime / AniWave / AnimeWatch Comprehensive Anime Genres & Themes
const ANIME_GENRES: GenreOption[] = [
  { id: "action", name: "Action", endpoint: "/api/catalog/discover?media_type=anime&genre=10759,28&sort_by=popularity.desc" },
  { id: "adventure", name: "Adventure", endpoint: "/api/catalog/discover?media_type=anime&genre=12,10759&sort_by=popularity.desc" },
  { id: "avant_garde", name: "Avant Garde", endpoint: "/api/catalog/discover?media_type=anime&genre=18&sort_by=popularity.desc" },
  { id: "boys_love", name: "Boys Love (BL)", endpoint: "/api/catalog/discover?media_type=anime&keyword=9715&sort_by=popularity.desc" },
  { id: "comedy", name: "Comedy", endpoint: "/api/catalog/discover?media_type=anime&genre=35&sort_by=popularity.desc" },
  { id: "demons", name: "Demons & Supernatural", endpoint: "/api/catalog/discover?media_type=anime&keyword=9724&sort_by=popularity.desc" },
  { id: "drama", name: "Drama", endpoint: "/api/catalog/discover?media_type=anime&genre=18&sort_by=popularity.desc" },
  { id: "ecchi", name: "Ecchi", endpoint: "/api/catalog/discover?media_type=anime&keyword=9717&sort_by=popularity.desc" },
  { id: "fantasy", name: "Fantasy", endpoint: "/api/catalog/discover?media_type=anime&genre=10765,14&sort_by=popularity.desc" },
  { id: "girls_love", name: "Girls Love (GL)", endpoint: "/api/catalog/discover?media_type=anime&keyword=9716&sort_by=popularity.desc" },
  { id: "gourmet", name: "Gourmet & Food", endpoint: "/api/catalog/discover?media_type=anime&keyword=food&sort_by=popularity.desc" },
  { id: "harem", name: "Harem", endpoint: "/api/catalog/discover?media_type=anime&keyword=9718&sort_by=popularity.desc" },
  { id: "historical", name: "Historical", endpoint: "/api/catalog/discover?media_type=anime&genre=36&sort_by=popularity.desc" },
  { id: "horror", name: "Horror", endpoint: "/api/catalog/discover?media_type=anime&genre=27&sort_by=popularity.desc" },
  { id: "isekai", name: "Isekai", endpoint: "/api/catalog/discover?media_type=anime&keyword=226917&sort_by=popularity.desc" },
  { id: "iyashikei", name: "Iyashikei (Healing)", endpoint: "/api/catalog/discover?media_type=anime&genre=35,18&sort_by=popularity.desc" },
  { id: "josei", name: "Josei", endpoint: "/api/catalog/discover?media_type=anime&keyword=9721&sort_by=popularity.desc" },
  { id: "kids", name: "Kids & Family", endpoint: "/api/catalog/discover?media_type=anime&genre=10762&sort_by=popularity.desc" },
  { id: "magic", name: "Magic & Mahou Shoujo", endpoint: "/api/catalog/discover?media_type=anime&keyword=210025&sort_by=popularity.desc" },
  { id: "martial_arts", name: "Martial Arts", endpoint: "/api/catalog/discover?media_type=anime&keyword=9714&sort_by=popularity.desc" },
  { id: "mecha", name: "Mecha", endpoint: "/api/catalog/discover?media_type=anime&keyword=9713&sort_by=popularity.desc" },
  { id: "military", name: "Military & War", endpoint: "/api/catalog/discover?media_type=anime&keyword=9726&sort_by=popularity.desc" },
  { id: "movies", name: "Anime Movies", endpoint: "/api/catalog/discover?media_type=movie&genre=16&country=JP&sort_by=popularity.desc" },
  { id: "music", name: "Music & Idol", endpoint: "/api/catalog/discover?media_type=anime&genre=10402&sort_by=popularity.desc" },
  { id: "mystery", name: "Mystery & Detective", endpoint: "/api/catalog/discover?media_type=anime&genre=9648&sort_by=popularity.desc" },
  { id: "mythology", name: "Mythology & Yokai", endpoint: "/api/catalog/discover?media_type=anime&genre=14,9648&sort_by=popularity.desc" },
  { id: "parody", name: "Parody", endpoint: "/api/catalog/discover?media_type=anime&genre=35&sort_by=popularity.desc" },
  { id: "psychological", name: "Psychological", endpoint: "/api/catalog/discover?media_type=anime&keyword=9725&sort_by=popularity.desc" },
  { id: "reincarnation", name: "Reincarnation", endpoint: "/api/catalog/discover?media_type=anime&keyword=reincarnation&sort_by=popularity.desc" },
  { id: "romance", name: "Romance", endpoint: "/api/catalog/discover?media_type=anime&genre=10749&sort_by=popularity.desc" },
  { id: "samurai", name: "Samurai", endpoint: "/api/catalog/discover?media_type=anime&keyword=samurai&sort_by=popularity.desc" },
  { id: "school", name: "School Life", endpoint: "/api/catalog/discover?media_type=anime&keyword=9723&sort_by=popularity.desc" },
  { id: "sci_fi", name: "Sci-Fi & Cyberpunk", endpoint: "/api/catalog/discover?media_type=anime&genre=878,10765&sort_by=popularity.desc" },
  { id: "seinen", name: "Seinen", endpoint: "/api/catalog/discover?media_type=anime&keyword=9720&sort_by=popularity.desc" },
  { id: "shoujo", name: "Shoujo", endpoint: "/api/catalog/discover?media_type=anime&keyword=9719&sort_by=popularity.desc" },
  { id: "shounen", name: "Shounen", endpoint: "/api/catalog/discover?media_type=anime&keyword=9712&sort_by=popularity.desc" },
  { id: "slice_of_life", name: "Slice of Life", endpoint: "/api/catalog/discover?media_type=anime&keyword=9722&sort_by=popularity.desc" },
  { id: "space", name: "Space", endpoint: "/api/catalog/discover?media_type=anime&keyword=space&sort_by=popularity.desc" },
  { id: "sports", name: "Sports", endpoint: "/api/catalog/discover?media_type=anime&keyword=6075&sort_by=popularity.desc" },
  { id: "super_power", name: "Super Power", endpoint: "/api/catalog/discover?media_type=anime&genre=10759&sort_by=popularity.desc" },
  { id: "supernatural", name: "Supernatural", endpoint: "/api/catalog/discover?media_type=anime&keyword=9724&sort_by=popularity.desc" },
  { id: "suspense", name: "Suspense & Thriller", endpoint: "/api/catalog/discover?media_type=anime&genre=53,9648&sort_by=popularity.desc" },
  { id: "time_travel", name: "Time Travel", endpoint: "/api/catalog/discover?media_type=anime&keyword=time+travel&sort_by=popularity.desc" },
  { id: "vampire", name: "Vampire", endpoint: "/api/catalog/discover?media_type=anime&keyword=vampire&sort_by=popularity.desc" },
];

const ANIME_SHELVES_CONFIG: AnimeShelfConfig[] = [
  {
    key: "trendingAnime",
    title: "Trending Anime Simulcasts",
    subtitle: "Most popular ongoing series and seasonal hits",
    seeAllHref: "/anime?section=trendingAnime",
    endpoint: "/api/catalog/discover?media_type=anime&sort_by=popularity.desc",
  },
  {
    key: "topAnime",
    title: "Top-Rated Masterpieces (MyAnimeList / AniList)",
    subtitle: "Legendary all-time highest rated anime series",
    seeAllHref: "/anime?section=topAnime",
    endpoint: "/api/catalog/discover?media_type=anime&sort_by=vote_average.desc&vote_count_gte=200",
  },
  {
    key: "shounenAction",
    title: "Shounen & High-Stakes Action Sagas",
    subtitle: "Epic battles, tournament arcs, and power awakenings",
    seeAllHref: "/anime?section=shounenAction",
    endpoint: "/api/catalog/discover?media_type=anime&genre=10759,28&sort_by=popularity.desc",
  },
  {
    key: "isekaiFantasy",
    title: "Isekai & Reincarnation Adventures",
    subtitle: "Transported to magical otherworlds and leveling up",
    seeAllHref: "/anime?section=isekaiFantasy",
    endpoint: "/api/catalog/discover?media_type=anime&genre=10765,14&sort_by=popularity.desc",
  },
  {
    key: "seinenDark",
    title: "Seinen, Psychological & Dark Fantasy",
    subtitle: "Mature storylines, moral ambiguity, and deep themes",
    seeAllHref: "/anime?section=seinenDark",
    endpoint: "/api/catalog/discover?media_type=anime&genre=9648,18&sort_by=popularity.desc",
  },
  {
    key: "animeMovies",
    title: "Iconic & Award-Winning Anime Movies",
    subtitle: "Cinematic animation from Ghibli, Makoto Shinkai & Kyoto Animation",
    seeAllHref: "/anime?section=animeMovies",
    endpoint: "/api/catalog/discover?media_type=movie&genre=16&country=JP&sort_by=popularity.desc",
  },
  {
    key: "sliceOfLifeComedy",
    title: "Slice of Life & Heartwarming Comedy",
    subtitle: "Relaxing daily adventures, food, and high school laughs",
    seeAllHref: "/anime?section=sliceOfLifeComedy",
    endpoint: "/api/catalog/discover?media_type=anime&genre=35&sort_by=popularity.desc",
  },
  {
    key: "romanceDrama",
    title: "Romance & Romantic Comedy",
    subtitle: "Sweet romances, heartfelt confessions, and tearjerkers",
    seeAllHref: "/anime?section=romanceDrama",
    endpoint: "/api/catalog/discover?media_type=anime&genre=10749&sort_by=popularity.desc",
  },
  {
    key: "mechaScifi",
    title: "Mecha, Cyberpunk & Sci-Fi Anime",
    subtitle: "Giant robotic suits, space wars, and future dystopias",
    seeAllHref: "/anime?section=mechaScifi",
    endpoint: "/api/catalog/discover?media_type=anime&genre=878,10765&sort_by=popularity.desc",
  },
  {
    key: "supernaturalHorror",
    title: "Supernatural, Demon & Dark Sagas",
    subtitle: "Yokai, cursed spirits, exorcists, and gothic horror",
    seeAllHref: "/anime?section=supernaturalHorror",
    endpoint: "/api/catalog/discover?media_type=anime&genre=27,9648&sort_by=popularity.desc",
  },
];

function AnimeDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSectionKey = searchParams.get("section");
  const activeGenreId = searchParams.get("genre");
  const { openTrailer } = useAppModals();

  const [spotlightItems, setSpotlightItems] = useState<MediaItem[]>([]);
  const [shelvesData, setShelvesData] = useState<Record<string, MediaItem[]>>({});
  const [loading, setLoading] = useState(true);

  // If a specific section or genre is selected, display its dedicated SectionCatalogView
  const selectedSection = ANIME_SHELVES_CONFIG.find((s) => s.key === activeSectionKey);
  const selectedGenre = ANIME_GENRES.find((g) => g.id === activeGenreId);

  useEffect(() => {
    let isMounted = true;

    async function loadAnimeDashboard() {
      try {
        setLoading(true);

        // 1. Fetch Spotlight Anime
        const spotRes = await fetch("/api/catalog/discover?media_type=anime&sort_by=popularity.desc");
        if (spotRes.ok) {
          const data = await spotRes.json();
          if (isMounted) {
            const list = data.results || [];
            setSpotlightItems(list.slice(0, 10));
          }
        }

        // 2. Fetch all Anime shelves concurrently
        const fetches = ANIME_SHELVES_CONFIG.map(async (shelf) => {
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
        console.error("Failed to load anime dashboard:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAnimeDashboard();
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
        backHref="/anime"
        backLabel="Back to Anime"
        onOpenTrailer={openTrailer}
      />
    );
  }

  if (selectedGenre) {
    return (
      <SectionCatalogView
        title={`${selectedGenre.name} Anime`}
        subtitle={`Browse all ${selectedGenre.name} releases and sagas`}
        endpoint={selectedGenre.endpoint || `/api/catalog/discover?media_type=anime&genre=${selectedGenre.id}&sort_by=popularity.desc`}
        backHref="/anime"
        backLabel="Back to Anime"
        onOpenTrailer={openTrailer}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col select-none">
        <div className="aspect-[21/9] bg-neutral-900/50 animate-pulse" />
        <div className="relative z-20 mt-4 sm:-mt-12 lg:-mt-16 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
          {ANIME_SHELVES_CONFIG.slice(0, 3).map((shelf) => (
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
      {/* ─── Hero Title & Complete 9anime / AniWave Genres Dropdown Pill Header ─── */}
      <div className="absolute top-20 sm:top-24 left-4 sm:left-8 lg:left-12 z-30 pointer-events-auto">
        <HeroGenreNav
          title="Anime"
          genres={ANIME_GENRES}
          onSelectGenre={(g) => router.push(`/anime?genre=${g.id}`)}
          selectedGenreId={activeGenreId}
        />
      </div>

      {/* ─── 1. Full-Bleed Anime Hero Spotlight ─── */}
      <HeroSpotlightCarousel
        items={spotlightItems}
        onOpenTrailer={openTrailer}
      />

      {/* ─── 2. Sequential Category Media Shelves Container ─── */}
      <div className="relative z-20 mt-4 sm:-mt-12 lg:-mt-16 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
        {ANIME_SHELVES_CONFIG.map((shelf) => {
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

export default function AnimePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col select-none">
          <div className="aspect-[21/9] bg-neutral-900/50 animate-pulse" />
          <div className="relative z-20 mt-4 sm:-mt-12 lg:-mt-16 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-neutral-800 w-1/4 rounded" />
              <div className="h-48 bg-neutral-900/50 rounded-lg" />
            </div>
          </div>
        </div>
      }
    >
      <AnimeDashboard />
    </Suspense>
  );
}
