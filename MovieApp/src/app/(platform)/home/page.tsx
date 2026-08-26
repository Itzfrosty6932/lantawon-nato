"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { MediaShelf } from "@/components/movie/MediaShelf";
import { HeroSpotlightCarousel } from "@/components/home/HeroSpotlightCarousel";
import { useAppModals } from "@/components/layout/AppShell";
import type { MediaItem } from "@/types/media";

interface HomeShelfConfig {
  key: string;
  title: string;
  seeAllHref: string;
  endpoint: string;
}

const HOME_SHELVES_CONFIG: HomeShelfConfig[] = [
  {
    key: "trending",
    title: "Trending Now",
    seeAllHref: "/trending",
    endpoint: "/api/catalog/discover?sort_by=popularity.desc",
  },
  {
    key: "topMovies",
    title: "Top Movies",
    seeAllHref: "/top-rated",
    endpoint: "/api/catalog/discover?media_type=movie&sort_by=vote_average.desc&vote_count_gte=500",
  },
  {
    key: "horrorSuspense",
    title: "Horror & Suspense",
    seeAllHref: "/discover?genre=27,53",
    endpoint: "/api/catalog/discover?genre=27,53&sort_by=popularity.desc",
  },
  {
    key: "trendingAnime",
    title: "Trending Anime Series",
    seeAllHref: "/anime",
    endpoint: "/api/catalog/discover?media_type=anime&sort_by=popularity.desc",
  },
  {
    key: "topAnimeMovies",
    title: "Iconic & Top-Rated Anime Movies",
    seeAllHref: "/anime?type=movie",
    endpoint: "/api/catalog/discover?media_type=movie&genre=16&country=JP&sort_by=popularity.desc",
  },
  {
    key: "recentAdded",
    title: "Recently Added Movies",
    seeAllHref: "/discover?sort_by=primary_release_date.desc",
    endpoint: "/api/catalog/discover?sort_by=primary_release_date.desc",
  },
  {
    key: "thrillers",
    title: "High-Octane & Psychological Thrillers",
    seeAllHref: "/discover?genre=53",
    endpoint: "/api/catalog/discover?genre=53&sort_by=popularity.desc",
  },
  {
    key: "action",
    title: "Action & Adventure Movies",
    seeAllHref: "/discover?genre=28,12",
    endpoint: "/api/catalog/discover?genre=28,12&sort_by=popularity.desc",
  },
  {
    key: "comedy",
    title: "Comedy Movies",
    seeAllHref: "/discover?genre=35",
    endpoint: "/api/catalog/discover?genre=35&sort_by=popularity.desc",
  },
  {
    key: "horror",
    title: "Horror Movies",
    seeAllHref: "/discover?genre=27",
    endpoint: "/api/catalog/discover?genre=27&sort_by=popularity.desc",
  },
  {
    key: "crime",
    title: "Crime Movies",
    seeAllHref: "/discover?genre=80",
    endpoint: "/api/catalog/discover?genre=80&sort_by=popularity.desc",
  },
  {
    key: "romance",
    title: "Romance Movies",
    seeAllHref: "/discover?genre=10749",
    endpoint: "/api/catalog/discover?genre=10749&sort_by=popularity.desc",
  },
  {
    key: "family",
    title: "Kids and Family Movies",
    seeAllHref: "/discover?genre=10751,16",
    endpoint: "/api/catalog/discover?genre=10751,16&sort_by=popularity.desc",
  },
  {
    key: "history",
    title: "Historical Movies",
    seeAllHref: "/discover?genre=36",
    endpoint: "/api/catalog/discover?genre=36&sort_by=popularity.desc",
  },
  {
    key: "scifi",
    title: "Science Fiction Movies",
    seeAllHref: "/discover?genre=878",
    endpoint: "/api/catalog/discover?genre=878&sort_by=popularity.desc",
  },
  {
    key: "feelgood",
    title: "Feel-Good Movies",
    seeAllHref: "/discover?genre=35,10751",
    endpoint: "/api/catalog/discover?genre=35,10751&sort_by=popularity.desc",
  },
  {
    key: "war",
    title: "Military and War Movies",
    seeAllHref: "/discover?genre=10752",
    endpoint: "/api/catalog/discover?genre=10752&sort_by=popularity.desc",
  },
  {
    key: "youngAdult",
    title: "Young Adult Movies",
    seeAllHref: "/discover?genre=18,10749",
    endpoint: "/api/catalog/discover?genre=18,10749&sort_by=popularity.desc",
  },
  {
    key: "sports",
    title: "Sports Movies",
    seeAllHref: "/discover?genre=sports",
    endpoint: "/api/catalog/discover?genre=sports&sort_by=popularity.desc",
  },
  {
    key: "western",
    title: "Western Movies",
    seeAllHref: "/discover?genre=37",
    endpoint: "/api/catalog/discover?genre=37&sort_by=popularity.desc",
  },
];

export default function HomePage() {
  const { openTrailer } = useAppModals();
  const [spotlightItems, setSpotlightItems] = useState<MediaItem[]>([]);
  const [shelvesData, setShelvesData] = useState<Record<string, MediaItem[]>>({});

  useEffect(() => {
    let isMounted = true;

    const loadAllHomeShelves = async () => {
      // 1. First load high-priority trending & spotlight items instantly
      try {
        const trendingRes = await fetch(HOME_SHELVES_CONFIG[0].endpoint);
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
            setShelvesData((prev) => ({ ...prev, [HOME_SHELVES_CONFIG[0].key]: list }));
          }
        }
      } catch (e) {
        console.error("Failed to load initial trending shelf", e);
      }

      // 2. Fetch all other category shelves concurrently
      const secondaryShelves = HOME_SHELVES_CONFIG.slice(1);
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

    loadAllHomeShelves();

    return () => {
      isMounted = false;
    };
  }, []);

  const { user } = useAuth();
  const isPendingPayment = user.isLoggedIn && user.role === 'user' && user.tier === 'free';

  return (
    <div className="flex flex-col select-none">
      {/* Pending Payment Warning */}
      {isPendingPayment && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 sm:px-6 lg:px-10 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-300 font-semibold">
              ⏳ Payment Under Review
            </p>
            <p className="text-amber-200 text-sm mt-1">
              Your payment is being verified. Streaming will unlock once an admin approves it.
              <br />
              <a href="/account/subscription" className="underline hover:text-amber-100">
                View payment status
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ─── 1. Full-Bleed Lantawon Cinema Hero ─── */}
      <HeroSpotlightCarousel
        items={spotlightItems}
        onOpenTrailer={openTrailer}
      />

      {/* ─── 2. Sequential Category Media Shelves Container ─── */}
      <div className="relative z-20 -mt-14 sm:-mt-20 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
        {HOME_SHELVES_CONFIG.map((shelf) => {
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
