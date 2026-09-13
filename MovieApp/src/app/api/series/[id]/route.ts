import { NextRequest, NextResponse } from "next/server";
import { CatalogService } from "@/features/catalog/service";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const series = await CatalogService.getSeries(id);
  if (!series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }
  return NextResponse.json(series);
}
