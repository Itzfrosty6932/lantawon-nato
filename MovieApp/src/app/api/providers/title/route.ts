import { NextResponse } from "next/server";
import { fetchTmdb, TMDB_IMAGE_CONFIG } from "@/lib/api/tmdb";

interface RawProviderItem {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

interface ProviderRegionData {
  link?: string;
  flatrate?: RawProviderItem[];
  free?: RawProviderItem[];
  ads?: RawProviderItem[];
  buy?: RawProviderItem[];
  rent?: RawProviderItem[];
}

interface TmdbWatchProvidersResponse {
  id: number;
  results: Record<string, ProviderRegionData>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") === "tv" ? "tv" : "movie";
  const region = (searchParams.get("region") || "US").toUpperCase();

  if (!id) {
    return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
  }

  try {
    const data = await fetchTmdb<TmdbWatchProvidersResponse>(
      `${type}/${id}/watch/providers`
    );

    if (!data || !data.results) {
      return NextResponse.json({
        id,
        type,
        region,
        hasProviders: false,
        justWatchLink: null,
        free: [],
        flatrate: [],
        buy: [],
        rent: [],
      });
    }

    // Try selected region first, fallback to US or first available region
    const regionData =
      data.results[region] ||
      data.results["US"] ||
      data.results["PH"] ||
      data.results["GB"] ||
      Object.values(data.results)[0] ||
      {};

    const formatProvider = (p: RawProviderItem, category: "free" | "flatrate" | "buy" | "rent") => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/w185${p.logo_path}` : TMDB_IMAGE_CONFIG.FALLBACK_AVATAR,
      category,
    });

    // Combine 100% free + ad-supported free into free array
    const freeList = [
      ...(regionData.free || []).map((p: RawProviderItem) => formatProvider(p, "free")),
      ...(regionData.ads || []).map((p: RawProviderItem) => formatProvider(p, "free")),
    ];

    const flatrateList = (regionData.flatrate || []).map((p: RawProviderItem) => formatProvider(p, "flatrate"));
    const buyList = (regionData.buy || []).map((p: RawProviderItem) => formatProvider(p, "buy"));
    const rentList = (regionData.rent || []).map((p: RawProviderItem) => formatProvider(p, "rent"));

    const hasProviders =
      freeList.length > 0 ||
      flatrateList.length > 0 ||
      buyList.length > 0 ||
      rentList.length > 0;

    return NextResponse.json({
      id,
      type,
      region,
      hasProviders,
      justWatchLink: regionData.link || null,
      free: freeList,
      flatrate: flatrateList,
      buy: buyList,
      rent: rentList,
      availableRegions: Object.keys(data.results),
    });
  } catch (error) {
    console.error("[API Provider Title Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch title watch providers" },
      { status: 500 }
    );
  }
}
