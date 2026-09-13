import { NextRequest, NextResponse } from "next/server";
import { CatalogService } from "@/features/catalog/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());
  const data = await CatalogService.discover(params);
  return NextResponse.json(data);
}
