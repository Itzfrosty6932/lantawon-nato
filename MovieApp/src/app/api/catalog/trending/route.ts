import { NextRequest, NextResponse } from "next/server";
import { CatalogService } from "@/features/catalog/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaType = (searchParams.get("media_type") as "all" | "movie" | "tv") || "all";
  const timeWindow = (searchParams.get("time_window") as "day" | "week") || "day";
  const data = await CatalogService.trending(mediaType, timeWindow);
  return NextResponse.json(data);
}
