"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MediaShelf } from "@/components/movie/MediaShelf";
import { HeroSpotlightCarousel } from "@/components/home/HeroSpotlightCarousel";
import { SectionCatalogView } from "@/components/catalog/SectionCatalogView";
import { HeroGenreNav, GenreOption } from "@/components/catalog/HeroGenreNav";
import { useAppModals } from "@/components/layout/AppShell";
import type { MediaItem } from "@/types/media";

interface ShowShelfConfig {
  key: string;
  title: string;
  subtitle?: string;
  seeAllHref: string;
  endpoint: string;
}

const TV_GENRES: GenreOption[] = [
  { id: "10759", name: "Action & Adventure", endpoint: "/api/catalog/discover?media_type=tv&genre=10759&sort_by=popularity.desc" },
  { id: "16", name: "Animation", endpoint: "/api/catalog/discover?media_type=tv&genre=16&sort_by=popularity.desc" },
  { id: "35", name: "Comedy", endpoint: "/api/catalog/discover?media_type=tv&genre=35&sort_by=popularity.desc" },
  { id: "80", name: "Crime", endpoint: "/api/catalog/discover?media_type=tv&genre=80&sort_by=popularity.desc" },
  { id: "99", name: "Documentary", endpoint: "/api/catalog/discover?media_type=tv&genre=99&sort_by=popularity.desc" },
  { id: "18", name: "Drama", endpoint: "/api/catalog/discover?media_type=tv&genre=18&sort_by=popularity.desc" },
  { id: "10762", name: "Kids & Family", endpoint: "/api/catalog/discover?media_type=tv&genre=10762&sort_by=popularity.desc" },
  { id: "9648", name: "Mystery", endpoint: "/api/catalog/discover?media_type=tv&genre=9648&sort_by=popularity.desc" },
  { id: "10763", name: "News & Reality", endpoint: "/api/catalog/discover?media_type=tv&genre=10763&sort_by=popularity.desc" },
  { id: "10765", name: "Sci-Fi & Fantasy", endpoint: "/api/catalog/discover?media_type=tv&genre=10765&sort_by=popularity.desc" },
  { id: "10766", name: "Soap & Teleseryes", endpoint: "/api/catalog/discover?media_type=tv&genre=10766&sort_by=popularity.desc" },
  { id: "10768", name: "War & Politics", endpoint: "/api/catalog/discover?media_type=tv&genre=10768&sort_by=popularity.desc" },
  { id: "ph_tv", name: "Filipino Teleseryes", endpoint: "/api/catalog/discover?media_type=tv&country=PH&sort_by=popularity.desc" },
  { id: "kr_tv", name: "Korean Dramas (K-Drama)", endpoint: "/api/catalog/discover?media_type=tv&country=KR&sort_by=popularity.desc" },
];

const SHOWS_SHELVES_CONFIG: ShowShelfConfig[] = [
  {
    key: "trendingTv",
    title: "Trending TV Series",
    subtitle: "Most watched episodic releases this week",
    seeAllHref: "/shows?section=trendingTv",
    endpoint: "/api/catalog/trending?media_type=tv&time_window=day",
  },
  {
    key: "topTv",
    title: "Top-Rated Television Sagas",
    subtitle: "Highest rated TV series of all time",
    seeAllHref: "/shows?section=topTv",
    endpoint: "/api/catalog/discover?media_type=tv&sort_by=vote_average.desc&vote_count_gte=300",
  },
  {
    key: "localPinoyTv",
    title: "Local TV & Filipino Teleseryes",
    subtitle: "Primetime drama series and GMA/ABS-CBN favorites",
    seeAllHref: "/shows?section=localPinoyTv",
    endpoint: "/api/catalog/discover?media_type=tv&country=PH&sort_by=popularity.desc",
  },
  {
    key: "koreanTv",
    title: "Korean Dramas & K-Series",
    subtitle: "Captivating K-Dramas and trending romances",
    seeAllHref: "/shows?section=koreanTv",
    endpoint: "/api/catalog/discover?media_type=tv&country=KR&sort_by=popularity.desc",
  },
  {
    key: "mysteryCrimeTv",
    title: "Mystery, Crime & Detective Shows",
    subtitle: "Intense investigations and true-crime mysteries",
    seeAllHref: "/shows?section=mysteryCrimeTv",
    endpoint: "/api/catalog/discover?media_type=tv&genre=9648,80&sort_by=popularity.desc",
  },
  {
    key: "scifiFantasyTv",
    title: "Sci-Fi, Space & Fantasy TV",
    subtitle: "Epic world-building and futuristic sagas",
    seeAllHref: "/shows?section=scifiFantasyTv",
    endpoint: "/api/catalog/discover?media_type=tv&genre=10765&sort_by=popularity.desc",
  },
  {
    key: "actionAdventureTv",
    title: "Action & Adventure TV Shows",
    subtitle: "Thrilling quests and cinematic battles",
    seeAllHref: "/shows?section=actionAdventureTv",
    endpoint: "/api/catalog/discover?media_type=tv&genre=10759&sort_by=popularity.desc",
  },
  {
    key: "comedyTv",
    title: "Comedy & Sitcom Hits",
    subtitle: "Binge-worthy sitcoms and sharp humor",
    seeAllHref: "/shows?section=comedyTv",
    endpoint: "/api/catalog/discover?media_type=tv&genre=35&sort_by=popularity.desc",
  },
  {
    key: "dramaTv",
    title: "Drama & Emotional Stories",
    subtitle: "Compelling character studies and family sagas",
    seeAllHref: "/shows?section=dramaTv",
    endpoint: "/api/catalog/discover?media_type=tv&genre=18&sort_by=popularity.desc",
  },
  {
    key: "horrorSupernaturalTv",
    title: "Horror & Supernatural TV",
    subtitle: "Paranormal encounters and dark thrills",
    seeAllHref: "/shows?section=horrorSupernaturalTv",
    endpoint: "/api/catalog/discover?media_type=tv&genre=9648,10765&sort_by=popularity.desc",
  },
  {
    key: "youngAdultTv",
    title: "Young Adult & Teen TV",
    subtitle: "Coming-of-age stories and high school drama",
    seeAllHref: "/shows?section=youngAdultTv",
    endpoint: "/api/catalog/discover?media_type=tv&genre=18,10749&sort_by=popularity.desc",
  },
  {
    key: "docuseries",
    title: "Docuseries & Real Life",
    subtitle: "Documentaries, nature, and historical accounts",
    seeAllHref: "/shows?section=docuseries",
    endpoint: "/api/catalog/discover?media_type=tv&genre=99&sort_by=popularity.desc",
  },
];

function ShowsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSectionKey = searchParams.get("section");
  const activeGenreId = searchParams.get("genre");
  const { openTrailer } = useAppModals();

  const [spotlightItems, setSpotlightItems] = useState<MediaItem[]>([]);
  const [shelvesData, setShelvesData] = useState<Record<string, MediaItem[]>>({});
  const [loading, setLoading] = useState(true);

  // If a specific section or genre is selected, display its dedicated SectionCatalogView
  const selectedSection = SHOWS_SHELVES_CONFIG.find((s) => s.key === activeSectionKey);
  const selectedGenre = TV_GENRES.find((g) => g.id === activeGenreId);

  useEffect(() => {
    let isMounted = true;

    async function loadShowsDashboard() {
      try {
        setLoading(true);

        // 1. Fetch Spotlight TV Series
        const spotRes = await fetch("/api/catalog/trending?media_type=tv&time_window=day");
        if (spotRes.ok) {
          const data = await spotRes.json();
          if (isMounted) {
            const list = data.results || [];
            setSpotlightItems(list.slice(0, 10));
          }
        }

        // 2. Fetch all TV shelves concurrently
        const fetches = SHOWS_SHELVES_CONFIG.map(async (shelf) => {
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
        console.error("Failed to load shows dashboard:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadShowsDashboard();
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
        backHref="/shows"
        backLabel="Back to TV Shows"
        onOpenTrailer={openTrailer}
      />
    );
  }

  if (selectedGenre) {
    return (
      <SectionCatalogView
        title={`${selectedGenre.name} TV Shows`}
        subtitle={`Browse all ${selectedGenre.name} television series and seasons`}
        endpoint={selectedGenre.endpoint || `/api/catalog/discover?media_type=tv&genre=${selectedGenre.id}&sort_by=popularity.desc`}
        backHref="/shows"
        backLabel="Back to TV Shows"
        onOpenTrailer={openTrailer}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col select-none">
        <div className="aspect-[21/9] bg-neutral-900/50 animate-pulse" />
        <div className="relative z-20 mt-4 sm:-mt-12 lg:-mt-16 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
          {SHOWS_SHELVES_CONFIG.slice(0, 3).map((shelf) => (
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
          title="TV Shows"
          genres={TV_GENRES}
          onSelectGenre={(g) => router.push(`/shows?genre=${g.id}`)}
          selectedGenreId={activeGenreId}
        />
      </div>

      {/* ─── 1. Full-Bleed TV Shows Hero Spotlight ─── */}
      <HeroSpotlightCarousel
        items={spotlightItems}
        onOpenTrailer={openTrailer}
      />

      {/* ─── 2. Sequential Category Media Shelves Container ─── */}
      <div className="relative z-20 mt-4 sm:-mt-12 lg:-mt-16 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
        {SHOWS_SHELVES_CONFIG.map((shelf) => {
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

export default function ShowsPage() {
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
      <ShowsDashboard />
    </Suspense>
  );
}
