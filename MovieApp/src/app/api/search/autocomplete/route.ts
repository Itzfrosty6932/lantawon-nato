import { NextRequest, NextResponse } from "next/server";
import { fetchTmdb } from "@/lib/api/tmdb";
import type { MediaItem } from "@/types/media";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [], movies: [], series: [], people: [], collections: [] });
  }

  try {
    const [multiRes, collectionRes, personRes] = await Promise.all([
      fetchTmdb<{ results: MediaItem[] }>("search/multi", { query: q, page: "1" }),
      fetchTmdb<{ results: Array<any> }>("search/collection", { query: q, page: "1" }).catch(() => null),
      fetchTmdb<{ results: Array<any> }>("search/person", { query: q, page: "1" }).catch(() => null),
    ]);

    const multiResults = multiRes?.results || [];
    const collections = (collectionRes?.results || []).slice(0, 3).map((c: any) => ({
      id: c.id,
      title: c.name,
      media_type: "collection",
      poster_path: c.poster_path,
    }));

    const people = (personRes?.results || []).slice(0, 3).map((p: any) => ({
      id: p.id,
      title: p.name,
      media_type: "person",
      poster_path: p.profile_path,
      subtitle: p.known_for_department || "Actor / Creator",
    }));

    const media = multiResults
      .filter((item: MediaItem) => {
        const hasArtwork = Boolean(item.poster_path || (item as any).profile_path || item.backdrop_path);
        const voteCount = Number(item.vote_count || 0);
        // Exclude zero-artwork scrap with 0 votes
        if (!hasArtwork && voteCount === 0) return false;
        return true;
      })
      .map((item: MediaItem) => {
        const type = item.media_type || (item.title ? "movie" : "tv");
        const isAnime = item.origin_country?.includes("JP") || item.original_language === "ja" || item.genre_ids?.includes(16);
        return {
          id: item.id,
          title: item.title || item.name || "Untitled",
          media_type: isAnime && type === "tv" ? "anime" : type,
          poster_path: item.poster_path || (item as any).profile_path,
          year: (item.release_date || item.first_air_date || "").split("-")[0],
          rating: item.vote_average ? item.vote_average.toFixed(1) : null,
        };
      });

    // Deduplicate suggestions by type and ID
    const rawSuggestions = [...media, ...people, ...collections];
    const seen = new Set<string>();
    const suggestions: typeof rawSuggestions = [];

    for (const item of rawSuggestions) {
      const key = `${item.media_type}_${item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        suggestions.push(item);
      }
    }

    const limitedSuggestions = suggestions.slice(0, 10);

    return NextResponse.json({
      suggestions: limitedSuggestions,
      movies: media.filter((m: any) => m.media_type === "movie"),
      series: media.filter((m: any) => m.media_type === "tv"),
      anime: media.filter((m: any) => m.media_type === "anime"),
      people,
      collections,
    });
  } catch (err: any) {
    console.error("Autocomplete API Error:", err);
    return NextResponse.json({ suggestions: [] });
  }
}
