import { NextRequest, NextResponse } from "next/server";
import { CatalogService } from "@/features/catalog/service";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string; season: string }> }
) {
  const { id, season } = await context.params;
  const seasonData = await CatalogService.getSeason(id, season);
  if (!seasonData) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }
  return NextResponse.json(seasonData, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
