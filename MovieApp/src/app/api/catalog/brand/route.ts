import { NextRequest, NextResponse } from "next/server";
import { fetchTmdb } from "@/lib/api/tmdb";

// Returns the real TMDB logo_path for a single network or production company,
// so studio/network browse cards can show an actual logo instead of a
// hardcoded text badge.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");

  if (!id || (kind !== "network" && kind !== "company")) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  try {
    const data = await fetchTmdb<{ logo_path?: string | null }>(`${kind}/${id}`);
    return NextResponse.json({ logo_path: data.logo_path || null });
  } catch {
    return NextResponse.json({ logo_path: null });
  }
}
