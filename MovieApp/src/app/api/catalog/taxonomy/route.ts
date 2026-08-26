import { NextResponse } from "next/server";
import { TAXONOMY } from "@/lib/constants/taxonomy";

export async function GET() {
  return NextResponse.json(TAXONOMY);
}
