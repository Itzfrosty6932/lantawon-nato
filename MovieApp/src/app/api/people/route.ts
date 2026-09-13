import { NextRequest, NextResponse } from "next/server";
import { fetchTmdb } from "@/lib/api/tmdb";

const PAGE_SIZE = 20;

// TMDB's person/popular list is ~95% actors: a 400-person sample carried only 12
// directors and 3 writers, so filtering it by department left the Directors and
// Writers catalogs empty. Those departments are instead rebuilt from the crew of
// the currently popular films, which is both well-populated and actually relevant.
const CREW_SCAN_PAGES = 3;
const CREW_FETCH_CHUNK = 12;

const CREW_JOBS: Record<"director" | "writer", string[]> = {
  director: ["Director"],
  writer: ["Screenplay", "Writer", "Story"],
};

interface PersonCard {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for: Array<{ id: number; title?: string; name?: string; media_type?: string }>;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
  known_for_department?: string;
  popularity?: number;
}

async function inChunks<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

async function peopleFromCrew(role: "director" | "writer"): Promise<PersonCard[]> {
  const jobs = CREW_JOBS[role];

  const moviePages = await Promise.all(
    Array.from({ length: CREW_SCAN_PAGES }, (_, i) =>
      fetchTmdb<{ results?: Array<{ id: number; title?: string }> }>("discover/movie", {
        sort_by: "popularity.desc",
        include_adult: false,
        page: i + 1,
      }).catch(() => ({ results: [] }))
    )
  );
  const movies = moviePages.flatMap((p) => p.results || []);

  const credited = await inChunks(movies, CREW_FETCH_CHUNK, (movie) =>
    fetchTmdb<{ crew?: CrewMember[] }>(`movie/${movie.id}/credits`)
      .then((c) => ({ movie, crew: c.crew || [] }))
      .catch(() => ({ movie, crew: [] as CrewMember[] }))
  );

  const byId = new Map<number, PersonCard>();
  for (const { movie, crew } of credited) {
    for (const member of crew) {
      if (!jobs.includes(member.job)) continue;
      const credit = { id: movie.id, title: movie.title, media_type: "movie" };
      const existing = byId.get(member.id);
      if (existing) {
        if (existing.known_for.length < 4 && !existing.known_for.some((k) => k.id === movie.id)) {
          existing.known_for.push(credit);
        }
        continue;
      }
      byId.set(member.id, {
        id: member.id,
        name: member.name,
        profile_path: member.profile_path ?? null,
        known_for_department: member.known_for_department || (role === "director" ? "Directing" : "Writing"),
        popularity: member.popularity ?? 0,
        known_for: [credit],
      });
    }
  }

  // A crew member with no headshot renders as a blank silhouette card, so the
  // ones TMDB can actually illustrate are surfaced first.
  return [...byId.values()].sort((a, b) => {
    if (!!a.profile_path !== !!b.profile_path) return a.profile_path ? -1 : 1;
    return (b.popularity ?? 0) - (a.popularity ?? 0);
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const role = searchParams.get("role") || "all";

    if (role === "director" || role === "writer") {
      const all = await peopleFromCrew(role);
      const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
      const start = (page - 1) * PAGE_SIZE;
      return NextResponse.json({
        success: true,
        page,
        totalPages,
        totalResults: all.length,
        results: all.slice(start, start + PAGE_SIZE),
      });
    }

    const data = await fetchTmdb<{
      page: number;
      results: PersonCard[];
      total_pages: number;
      total_results: number;
    }>("person/popular", { page: String(page) });

    const results =
      role === "actor"
        ? (data?.results || []).filter(
            (p) => p.known_for_department?.toLowerCase() === "acting"
          )
        : data?.results || [];

    return NextResponse.json({
      success: true,
      page: data?.page || 1,
      totalPages: data?.total_pages || 1,
      totalResults: data?.total_results || 0,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch people" },
      { status: 500 }
    );
  }
}
