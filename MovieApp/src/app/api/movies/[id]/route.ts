import { NextRequest, NextResponse } from "next/server";
import { CatalogService } from "@/features/catalog/service";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const movie = await CatalogService.getMovie(id);
  if (!movie) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }
  return NextResponse.json(movie, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
