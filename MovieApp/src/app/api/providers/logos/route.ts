import { NextResponse } from "next/server";
import { fetchTmdb } from "@/lib/api/tmdb";

// TMDB has no single-provider endpoint, so logos come from the regional provider
// lists. A provider missing from one region's list still appears in another
// (Crunchyroll and YouTube are absent from the US movie list but present in the
// TV and PH ones), so several lists are merged into one id -> logo_path map.
const REGIONS = ["US", "PH", "GB"];
const KINDS = ["movie", "tv"] as const;

export async function GET() {
  try {
    const lists = await Promise.all(
      REGIONS.flatMap((watch_region) =>
        KINDS.map((kind) =>
          fetchTmdb<{ results?: Array<{ provider_id: number; logo_path?: string | null }> }>(
            `watch/providers/${kind}`,
            { watch_region }
          ).catch(() => ({ results: [] }))
        )
      )
    );

    const logos: Record<number, string> = {};
    for (const list of lists) {
      for (const provider of list.results || []) {
        if (provider.logo_path && !logos[provider.provider_id]) {
          logos[provider.provider_id] = provider.logo_path;
        }
      }
    }

    return NextResponse.json({ logos });
  } catch {
    return NextResponse.json({ logos: {} });
  }
}
