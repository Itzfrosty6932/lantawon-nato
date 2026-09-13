import { NextRequest, NextResponse } from "next/server";
import { fetchTmdb } from "@/lib/api/tmdb";
import { ContentGuideService } from "@/features/content-guide/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const mediaId = resolvedParams.id;
  const { searchParams } = new URL(request.url);
  const mediaType = (searchParams.get("type") || "movie") as "movie" | "tv";

  try {
    const endpoint = mediaType === "tv" ? `tv/${mediaId}` : `movie/${mediaId}`;
    const appendParams = {
      append_to_response: mediaType === "tv" ? "content_ratings,keywords" : "release_dates,keywords"
    };

    const rawData = await fetchTmdb<Record<string, unknown>>(endpoint, appendParams);

    if (!rawData) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const officialRatings = ContentGuideService.parseOfficialRatings(
      rawData.release_dates as { results?: Array<{ iso_3166_1: string; release_dates?: Array<{ certification: string }> }> },
      rawData.content_ratings as { results?: Array<{ iso_3166_1: string; rating: string }> }
    );

    const keywords = (rawData.keywords as { keywords?: Array<{ id: number; name: string }>; results?: Array<{ id: number; name: string }> })?.keywords ||
      (rawData.keywords as { results?: Array<{ id: number; name: string }> })?.results ||
      [];

    const classification = ContentGuideService.classifyMediaContent({
      mediaId,
      mediaType: mediaType === "tv" ? "tv" : "movie",
      title: (rawData.title || rawData.name || "Untitled") as string,
      overview: (rawData.overview || "") as string,
      genres: (rawData.genres || []) as Array<{ id: number; name: string }>,
      keywords,
      officialRatings,
    });

    return NextResponse.json(classification);
  } catch (error) {
    console.error("[API Content Guide Error]", error);
    return NextResponse.json({ error: "Failed to generate content classification" }, { status: 500 });
  }
}
