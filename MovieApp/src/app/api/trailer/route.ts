import { NextRequest, NextResponse } from "next/server";
import { fetchTmdb } from "@/lib/api/tmdb";

interface TmdbVideosResponse {
  id: number;
  results: Array<{
    id: string;
    iso_639_1: string;
    key: string;
    name: string;
    site: string;
    size: number;
    type: string;
    official: boolean;
    published_at: string;
  }>;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") === "tv" ? "tv" : "movie";

  if (!id) {
    return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
  }

  try {
    const data = await fetchTmdb<TmdbVideosResponse>(`${type}/${id}/videos`);

    if (!data || !data.results || data.results.length === 0) {
      return NextResponse.json({ trailerKey: null, name: null });
    }

    // Prioritize official YouTube Trailers, then Teasers, then any YouTube video
    const youtubeVideos = data.results.filter((v: { site: string }) => v.site === "YouTube");

    const officialTrailer =
      youtubeVideos.find((v: { official: boolean; type: string }) => v.official && v.type === "Trailer") ||
      youtubeVideos.find((v: { type: string }) => v.type === "Trailer") ||
      youtubeVideos.find((v: { official: boolean; type: string }) => v.official && v.type === "Teaser") ||
      youtubeVideos.find((v: { type: string }) => v.type === "Teaser") ||
      youtubeVideos[0];

    if (!officialTrailer) {
      return NextResponse.json({ trailerKey: null, name: null });
    }

    return NextResponse.json(
      {
        trailerKey: officialTrailer.key,
        name: officialTrailer.name,
        type: officialTrailer.type,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (error) {
    console.error("[API Trailer Error]", error);
    return NextResponse.json({ trailerKey: null, name: null }, { status: 200 });
  }
}
