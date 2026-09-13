import { NextRequest, NextResponse } from "next/server";
import { RecommendationService } from "@/features/recommendations/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mood = searchParams.get("mood") || "mind-bending";
  const page = searchParams.get("page") || "1";
  const data = await RecommendationService.getMoodRecommendations(mood, page);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
