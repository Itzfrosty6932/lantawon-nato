import { NextRequest, NextResponse } from "next/server";
import { RecommendationService } from "@/features/recommendations/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") || "movie";

  if (!id) {
    return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
  }

  const data = await RecommendationService.getWhyRecommended(id, type);
  return NextResponse.json(data);
}
