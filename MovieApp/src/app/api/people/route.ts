import { NextRequest, NextResponse } from "next/server";
import { fetchTmdb } from "@/lib/api/tmdb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const role = searchParams.get("role") || "all";

    const data = await fetchTmdb<{
      page: number;
      results: Array<{
        id: number;
        name: string;
        profile_path: string | null;
        known_for_department: string;
        popularity: number;
        known_for: Array<{
          id: number;
          title?: string;
          name?: string;
          poster_path?: string | null;
          media_type?: string;
        }>;
      }>;
      total_pages: number;
      total_results: number;
    }>("person/popular", { page: String(page) });

    let people = data?.results || [];

    if (role === "actor") {
      people = people.filter((p: { known_for_department?: string }) => p.known_for_department?.toLowerCase() === "acting");
    } else if (role === "director") {
      people = people.filter((p: { known_for_department?: string }) => p.known_for_department?.toLowerCase() === "directing");
    } else if (role === "writer") {
      people = people.filter((p: { known_for_department?: string }) => p.known_for_department?.toLowerCase() === "writing");
    }

    return NextResponse.json({
      success: true,
      page: data?.page || 1,
      totalPages: data?.total_pages || 1,
      totalResults: data?.total_results || 0,
      results: people,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch people" },
      { status: 500 }
    );
  }
}
