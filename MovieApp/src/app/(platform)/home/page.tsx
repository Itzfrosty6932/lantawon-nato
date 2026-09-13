"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { MediaShelf } from "@/components/movie/MediaShelf";
import { ContinueWatchingShelf } from "@/components/movie/ContinueWatchingShelf";
import { WatchlistShelf } from "@/components/movie/WatchlistShelf";
import { HeroSpotlightCarousel } from "@/components/home/HeroSpotlightCarousel";
import { SectionCatalogView } from "@/components/catalog/SectionCatalogView";
import { useAppModals } from "@/components/layout/AppShell";
import type { MediaItem } from "@/types/media";

interface HomeShelfConfig {
  key: string;
  title: string;
  subtitle?: string;
  seeAllHref: string;
  endpoint: string;
}

const HOME_SHELVES_CONFIG: HomeShelfConfig[] = [
  {
    key: "trending",
    title: "Trending Now",
    subtitle: "Most popular movies and series today",
    seeAllHref: "/home?section=trending",
    endpoint: "/api/catalog/trending?media_type=all&time_window=day",
  },
  {
    key: "topMovies",
    title: "Top-Rated Movies",
    subtitle: "Critically acclaimed all-time favorites",
    seeAllHref: "/home?section=topMovies",
    endpoint: "/api/catalog/discover?media_type=movie&sort_by=vote_average.desc&vote_count_gte=500",
  },
  {
    key: "horrorSuspense",
    title: "Horror & Suspense",
    subtitle: "Chilling hauntings and dark thrillers",
    seeAllHref: "/home?section=horrorSuspense",
    endpoint: "/api/catalog/discover?genre=27,53&sort_by=popularity.desc",
  },
  {
    key: "trendingAnime",
    title: "Trending Anime Series",
    subtitle: "Seasonal hits and simulcasts",
    seeAllHref: "/home?section=trendingAnime",
    endpoint: "/api/catalog/discover?media_type=anime&sort_by=popularity.desc",
  },
  {
    key: "topAnimeMovies",
    title: "Iconic & Top-Rated Anime Movies",
    subtitle: "Legendary animated features from Japan",
    seeAllHref: "/home?section=topAnimeMovies",
    endpoint: "/api/catalog/discover?media_type=movie&genre=16&country=JP&sort_by=popularity.desc",
  },
  {
    key: "recentAdded",
    title: "Recently Added Movies",
    subtitle: "Fresh releases and new additions",
    seeAllHref: "/home?section=recentAdded",
    endpoint: "/api/catalog/discover?sort_by=primary_release_date.desc",
  },
  {
    key: "thrillers",
    title: "High-Octane & Psychological Thrillers",
    subtitle: "Edge-of-your-seat suspense and twists",
    seeAllHref: "/home?section=thrillers",
    endpoint: "/api/catalog/discover?genre=53&sort_by=popularity.desc",
  },
  {
    key: "action",
    title: "Action & Adventure Movies",
    subtitle: "Blockbuster missions and explosive battles",
    seeAllHref: "/home?section=action",
    endpoint: "/api/catalog/discover?genre=28,12&sort_by=popularity.desc",
  },
  {
    key: "comedy",
    title: "Comedy Movies",
    subtitle: "Laughs and lighthearted adventures",
    seeAllHref: "/home?section=comedy",
    endpoint: "/api/catalog/discover?genre=35&sort_by=popularity.desc",
  },
  {
    key: "crime",
    title: "Crime & Heist Movies",
    subtitle: "Underworld rackets and detective hunts",
    seeAllHref: "/home?section=crime",
    endpoint: "/api/catalog/discover?genre=80&sort_by=popularity.desc",
  },
  {
    key: "romance",
    title: "Romance Movies",
    subtitle: "Heartwarming love stories and dramas",
    seeAllHref: "/home?section=romance",
    endpoint: "/api/catalog/discover?genre=10749&sort_by=popularity.desc",
  },
  {
    key: "family",
    title: "Kids & Family Movies",
    subtitle: "Fun adventures for the whole family",
    seeAllHref: "/home?section=family",
    endpoint: "/api/catalog/discover?genre=10751,16&sort_by=popularity.desc",
  },
  {
    key: "scifi",
    title: "Science Fiction Movies",
    subtitle: "Futuristic sagas and alien discoveries",
    seeAllHref: "/home?section=scifi",
    endpoint: "/api/catalog/discover?genre=878&sort_by=popularity.desc",
  },
];

function HomeFeed() {
  const searchParams = useSearchParams();
  const activeSectionKey = searchParams.get("section");
  const { openTrailer } = useAppModals();
  const { user } = useAuth();

  const [spotlightItems, setSpotlightItems] = useState<MediaItem[]>([]);
  const [shelvesData, setShelvesData] = useState<Record<string, MediaItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPendingPayment, setIsPendingPayment] = useState(false);

  const selectedSection = HOME_SHELVES_CONFIG.find((s) => s.key === activeSectionKey);

  useEffect(() => {
    let isMounted = true;

    const loadAllHomeShelves = async () => {
      try {
        setLoading(true);

        // 1. Fetch Spotlight
        const spotRes = await fetch("/api/catalog/trending?media_type=all&time_window=day");
        if (spotRes.ok) {
          const data = await spotRes.json();
          if (isMounted) {
            setSpotlightItems((data.results || []).slice(0, 10));
          }
        }

        // 2. Concurrently fetch shelves
        const fetches = HOME_SHELVES_CONFIG.map(async (shelf) => {
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
      } catch (e) {
        console.error("Home page load failed", e);
        if (isMounted) setError("Failed to load your home feed. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAllHomeShelves();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check pending payment
  useEffect(() => {
    let cancelled = false;
    if (!user.isLoggedIn || !user.id || user.role !== "user") {
      setIsPendingPayment(false);
      return;
    }
    (async () => {
      try {
        const { subscriptionService } = await import(
          "@/lib/services/subscription-service"
        );
        const submissions = await subscriptionService.getUserPaymentSubmissions(
          user.id!
        );
        if (!cancelled) {
          setIsPendingPayment(
            submissions.some((s) => s.status === "pending")
          );
        }
      } catch {
        if (!cancelled) setIsPendingPayment(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.isLoggedIn, user.id, user.role]);

  // Section view for in-context See All
  if (selectedSection) {
    return (
      <SectionCatalogView
        title={selectedSection.title}
        subtitle={selectedSection.subtitle}
        endpoint={selectedSection.endpoint}
        backHref="/home"
        backLabel="Back to Home"
        onOpenTrailer={openTrailer}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col select-none">
        <div className="aspect-[21/9] bg-neutral-900/50 animate-pulse" />
        <div className="relative z-20 -mt-14 sm:-mt-20 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
          {HOME_SHELVES_CONFIG.slice(0, 3).map((shelf) => (
            <div key={shelf.key} className="animate-pulse space-y-4">
              <div className="h-6 bg-neutral-800 w-1/4 rounded" />
              <div className="h-48 bg-neutral-900/50 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col select-none">
        <div className="aspect-[21/9] bg-neutral-900/50 flex items-center justify-center">
          <div className="text-center text-neutral-400 px-8">
            <div className="text-xl font-semibold mb-2">Unable to load your home feed</div>
            <div className="text-sm mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#E50914] hover:bg-[#ff1f3d] rounded-lg text-sm font-medium text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="relative z-20 mt-4 sm:-mt-12 lg:-mt-16 space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-10 pb-16">
        {/* Continue Watching */}
        <ContinueWatchingShelf />

        {/* Watchlist */}
        <WatchlistShelf />

        {HOME_SHELVES_CONFIG.map((shelf) => {
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

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 gap-3 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin text-[#E50914]" />
          <span className="text-xs">Loading Lantawon home...</span>
        </div>
      }
    >
      <HomeFeed />
    </Suspense>
  );
}
