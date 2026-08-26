"use client";

import React, { useState, useEffect } from "react";
import { MediaShelf } from "@/components/movie/MediaShelf";
import { HeroSpotlightCarousel } from "@/components/home/HeroSpotlightCarousel";
import { useAppModals } from "@/components/layout/AppShell";
import type { MediaItem } from "@/types/media";

interface ShowShelfConfig {
  key: string;
  title: string;
  seeAllHref: string;
  endpoint: string;
}

const SHOWS_SHELVES_CONFIG: ShowShelfConfig[] = [
  {
    key: "trendingTv",
    title: "Trending TV Shows",
    seeAllHref: "/trending?type=tv",
    endpoint: "/api/catalog/discover?media_type=tv&sort_by=popularity.desc",
  },
  {
    key: "topTv",
    title: "Top TV Shows",
    seeAllHref: "/top-rated?type=tv",
    endpoint: "/api/catalog/discover?media_type=tv&sort_by=vote_average.desc&vote_count_gte=300",
  },
  {
    key: "localPinoyTv",
    title: "Local TV & Filipino Teleseryes",
    seeAllHref: "/discover?media_type=tv&country=PH&genre=18,10759,9648,10765,10762",
    endpoint: "/api/catalog/discover?media_type=tv&country=PH&genre=18,10759,9648,10765,10762&sort_by=popularity.desc",
  },
  {
    key: "koreanTv",
    title: "Korean TV & K-Dramas",
    seeAllHref: "/discover?media_type=tv&country=KR",
    endpoint: "/api/catalog/discover?media_type=tv&country=KR&sort_by=popularity.desc",
  },
  {
    key: "animeTv",
    title: "Anime TV Series & Simulcasts",
    seeAllHref: "/anime",
    endpoint: "/api/catalog/discover?media_type=anime&sort_by=popularity.desc",
  },
  {
    key: "actionTv",
    title: "Action & Adventure TV",
    seeAllHref: "/discover?media_type=tv&genre=10759",
    endpoint: "/api/catalog/discover?media_type=tv&genre=10759&sort_by=popularity.desc",
  },
  {
    key: "mysteryTv",
    title: "Mystery & Investigation TV",
    seeAllHref: "/discover?media_type=tv&genre=9648",
    endpoint: "/api/catalog/discover?media_type=tv&genre=9648&sort_by=popularity.desc",
  },
  {
    key: "scifiTv",
    title: "Science Fiction & Fantasy TV",
    seeAllHref: "/discover?media_type=tv&genre=10765",
    endpoint: "/api/catalog/discover?media_type=tv&genre=10765&sort_by=popularity.desc",
  },
  {
    key: "comedyTv",
    title: "Comedy TV Shows",
    seeAllHref: "/discover?media_type=tv&genre=35",
    endpoint: "/api/catalog/discover?media_type=tv&genre=35&sort_by=popularity.desc",
  },
  {
    key: "dramaTv",
    title: "Drama TV Shows",
    seeAllHref: "/discover?media_type=tv&genre=18",
    endpoint: "/api/catalog/discover?media_type=tv&genre=18&sort_by=popularity.desc",
  },
  {
    key: "horrorTv",
    title: "Horror & Supernatural TV",
    seeAllHref: "/discover?media_type=tv&genre=27",
    endpoint: "/api/catalog/discover?media_type=tv&genre=27&sort_by=popularity.desc",
  },
  {
    key: "kidsTv",
    title: "Kids and Family TV",
    seeAllHref: "/discover?media_type=tv&genre=10762",
    endpoint: "/api/catalog/discover?media_type=tv&genre=10762&sort_by=popularity.desc",
  },
  {
    key: "romanceTv",
    title: "Romance TV Series",
    seeAllHref: "/discover?media_type=tv&genre=10749",
    endpoint: "/api/catalog/discover?media_type=tv&genre=10749&sort_by=popularity.desc",
  },
  {
    key: "youngAdultTv",
    title: "Young Adult & Teen TV",
    seeAllHref: "/discover?media_type=tv&genre=18,10749",
    endpoint: "/api/catalog/discover?media_type=tv&genre=18,10749&sort_by=popularity.desc",
  },
  {
    key: "realityTv",
    title: "Reality & Talk Shows",
    seeAllHref: "/discover?media_type=tv&genre=10764,10767",
    endpoint: "/api/catalog/discover?media_type=tv&genre=10764,10767&sort_by=popularity.desc",
  },
  {
    key: "sportsTv",
    title: "Sports TV & Shows",
    seeAllHref: "/discover?media_type=tv&genre=sports",
    endpoint: "/api/catalog/discover?media_type=tv&genre=sports&sort_by=popularity.desc",
  },
  {
    key: "recentTv",
    title: "Recently Added TV",
    seeAllHref: "/discover?media_type=tv&sort_by=first_air_date.desc",
    endpoint: "/api/catalog/discover?media_type=tv&sort_by=first_air_date.desc",
  },
];

export default function SeriesPage() {
  const { openTrailer } = useAppModals();
  const [spotlightItems, setSpotlightItems] = useState<MediaItem[]>([]);
  const [shelvesData, setShelvesData] = useState<Record<string, MediaItem[]>>({});

  useEffect(() => {
    let isMounted = true;

    const loadAllShowsShelves = async () => {
      // 1. First load high-priority trending TV spotlight
      try {
        const trendingRes = await fetch(SHOWS_SHELVES_CONFIG[0].endpoint);
        if (trendingRes.ok) {
          const data = await trendingRes.json();
          const list: MediaItem[] = data.results || [];
          if (isMounted) {
            const validSpotlights = list.filter(
              (item: MediaItem) =>
                Boolean(item.backdrop_path || item.poster_path) &&
                Boolean(item.title || item.name)
            );
            setSpotlightItems(validSpotlights.slice(0, 8));
            setShelvesData((prev) => ({ ...prev, [SHOWS_SHELVES_CONFIG[0].key]: list }));
          }
        }
      } catch (e) {
        console.error("Failed to load initial TV trending shelf", e);
      }

      // 2. Fetch all other category TV shelves concurrently
      const secondaryShelves = SHOWS_SHELVES_CONFIG.slice(1);
      const promises = secondaryShelves.map(async (shelf) => {
        try {
          const res = await fetch(shelf.endpoint);
          if (res.ok) {
            const json = await res.json();
            return { key: shelf.key, items: json.results || [] };
          }
        } catch {
          // silently fail single shelf
        }
        return { key: shelf.key, items: [] };
      });

      const results = await Promise.all(promises);
      if (isMounted) {
        setShelvesData((prev) => {
          const next = { ...prev };
          results.forEach((r) => {
            if (r.items.length > 0) {
              next[r.key] = r.items;
            }
          });
          return next;
        });
      }
    };

    loadAllShowsShelves();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col select-none">
      {/* ─── 1. Full-Bleed TV Spotlight Hero ─── */}
      <HeroSpotlightCarousel
        items={spotlightItems}
        onOpenTrailer={openTrailer}
      />

      {/* ─── 2. Sequential TV Category Media Shelves Container ─── */}
      <div className="relative z-20 -mt-14 sm:-mt-20 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
        {SHOWS_SHELVES_CONFIG.map((shelf) => {
          const items = shelvesData[shelf.key] || [];
          if (items.length === 0) return null;

          return (
            <MediaShelf
              key={shelf.key}
              title={shelf.title}
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
