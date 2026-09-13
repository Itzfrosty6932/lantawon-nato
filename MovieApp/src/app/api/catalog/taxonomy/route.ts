import { NextResponse } from "next/server";
import { TAXONOMY } from "@/lib/constants/taxonomy";

export async function GET() {
  return NextResponse.json(TAXONOMY, {
    headers: {
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
    },
  });
}
