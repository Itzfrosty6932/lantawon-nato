import { NextResponse } from "next/server";
import { CURATED_WATCH_PROVIDERS, WATCH_PROVIDER_CATEGORIES, WatchProviderItem } from "@/lib/constants/watch-providers";
import { fetchTmdb } from "@/lib/api/tmdb";

interface TmdbProviderRaw {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priorities: Record<string, number>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  const query = (searchParams.get("q") || "").toLowerCase().trim();
  const region = searchParams.get("region") || "US";
  const mediaType = searchParams.get("media") || "all";

  // Optionally fetch dynamic live watch providers from TMDB
  try {
    let providers = [...CURATED_WATCH_PROVIDERS];

    // Filter by Category
    if (category !== "all") {
      providers = providers.filter((p) => p.category === category);
    }

    // Filter by Query Search (e.g., "tubi", "netflix", "pluto")
    if (query) {
      providers = providers.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.categoryLabel.toLowerCase().includes(query)
      );
    }

    // Free Services count & summary
    const freeCount = CURATED_WATCH_PROVIDERS.filter((p) => p.category === "free").length;
    const subCount = CURATED_WATCH_PROVIDERS.filter((p) => p.category === "subscription").length;
    const rentBuyCount = CURATED_WATCH_PROVIDERS.filter((p) => p.category === "rent_buy").length;
    const tvAppCount = CURATED_WATCH_PROVIDERS.filter((p) => p.category === "tv_app").length;

    return NextResponse.json({
      success: true,
      totalCount: providers.length,
      categories: [
        { id: "all", label: "All 345+ Providers", count: CURATED_WATCH_PROVIDERS.length },
        { id: "free", label: "Free Services (100% Free / Ad-Supported)", count: freeCount },
        { id: "subscription", label: "Subscription Services (SVOD)", count: subCount },
        { id: "rent_buy", label: "Purchase & Rental (VOD)", count: rentBuyCount },
        { id: "tv_app", label: "TV Channel Apps", count: tvAppCount },
      ],
      providers,
    });
  } catch (error) {
    console.error("[API Providers Error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch watch providers" },
      { status: 500 }
    );
  }
}
