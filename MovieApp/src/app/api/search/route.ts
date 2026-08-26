import { NextRequest, NextResponse } from "next/server";
import { SearchEngine } from "@/features/search/engine/search-engine";
import type { UniversalFilterParams } from "@/features/search/engine/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const params: UniversalFilterParams = {
    q: searchParams.get("q") || undefined,
    media_type: searchParams.get("media_type") || searchParams.get("type") || undefined,
    genre: searchParams.get("genre") || undefined,
    company: searchParams.get("company") || undefined,
    network: searchParams.get("network") || undefined,
    country: searchParams.get("country") || undefined,
    language: searchParams.get("language") || undefined,
    year: searchParams.get("year") || searchParams.get("primary_release_year") || undefined,
    month: searchParams.get("month") || undefined,
    year_start: searchParams.get("year_start") || searchParams.get("yearFrom") || undefined,
    year_end: searchParams.get("year_end") || searchParams.get("yearTo") || undefined,
    min_rating: searchParams.get("min_rating") || searchParams.get("rating") || undefined,

    status: searchParams.get("status") || undefined,
    sort_by: searchParams.get("sort_by") || searchParams.get("sort") || undefined,
    tab: (searchParams.get("tab") as any) || "all",
    personal_filter: (searchParams.get("personal_filter") as any) || "all",
    page: searchParams.get("page") || 1,
  };

  try {
    const data = await SearchEngine.execute(params);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[SearchEngine API Error]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Search failed" },
      { status: 500 }
    );
  }
}
