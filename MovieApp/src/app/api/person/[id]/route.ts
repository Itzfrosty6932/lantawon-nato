import { NextRequest, NextResponse } from "next/server";
import { GraphService } from "@/features/catalog/graph-service";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const person = await GraphService.getPerson(id);
  if (!person) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }
  return NextResponse.json(person);
}
