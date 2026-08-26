import { NextRequest, NextResponse } from "next/server";
import { getServerIdentity } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Bug/Issue Tracking API
 * GET    /api/bugs              → List all bugs
 * GET    /api/bugs?id=X         → Get specific bug
 * POST   /api/bugs              → Create new bug
 * PATCH  /api/bugs?id=X         → Update bug
 * DELETE /api/bugs?id=X         → Delete bug
 */

export async function GET(req: NextRequest) {
  try {
    const identity = await getServerIdentity();

    if (!identity.isAuthenticated || identity.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const admin = createAdminSupabaseClient();
    const bugId = req.nextUrl.searchParams.get("id");

    if (bugId) {
      // Get single bug
      const { data, error } = await admin
        .from("bugs")
        .select("*")
        .eq("id", bugId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Bug not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    }

    // List all bugs
    const { data, error } = await admin
      .from("bugs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ bugs: data || [] });
  } catch (err) {
    console.error("[bugs GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await getServerIdentity();

    if (!identity.isAuthenticated || identity.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      severity,
      status,
      category,
      affectedFiles,
    } = body;

    if (!title || !description || !severity || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    const { data, error } = await admin
      .from("bugs")
      .insert({
        title,
        description,
        severity,
        status: status || "open",
        category,
        affected_files: affectedFiles || [],
        reported_by: identity.userId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[bugs POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const identity = await getServerIdentity();

    if (!identity.isAuthenticated || identity.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bugId = req.nextUrl.searchParams.get("id");
    if (!bugId) {
      return NextResponse.json({ error: "Bug ID required" }, { status: 400 });
    }

    const body = await req.json();
    const updates = {
      ...body,
      updated_at: new Date().toISOString(),
      updated_by: identity.userId,
    };

    const admin = createAdminSupabaseClient();

    const { data, error } = await admin
      .from("bugs")
      .update(updates)
      .eq("id", bugId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Bug not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[bugs PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const identity = await getServerIdentity();

    if (!identity.isAuthenticated || identity.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bugId = req.nextUrl.searchParams.get("id");
    if (!bugId) {
      return NextResponse.json({ error: "Bug ID required" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    const { error } = await admin.from("bugs").delete().eq("id", bugId);

    if (error) {
      return NextResponse.json(
        { error: "Bug not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bugs DELETE]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
