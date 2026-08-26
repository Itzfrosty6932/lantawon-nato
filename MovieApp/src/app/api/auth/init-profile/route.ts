import { NextRequest, NextResponse } from "next/server";
import { getServerIdentity } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/init-profile
 *
 * Called immediately after signup to initialize a new user's profile row
 * with their registered name (since auth.users is server-only and the
 * profile table has insert RLS). This ensures display_name matches what
 * the user registered with, not a fallback.
 */
export async function POST(req: NextRequest) {
  try {
    const identity = await getServerIdentity();
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { displayName, username, autoConfirm } = await req.json();
    if (!displayName || typeof displayName !== "string") {
      return NextResponse.json(
        { error: "displayName is required" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Auto-confirm email so user can sign in immediately
    if (autoConfirm) {
      try {
        await admin.auth.admin.updateUserById(identity.userId, {
          email_confirm: true,
        });
      } catch {
        // Non-critical — user can still sign in if email was already confirmed
      }
    }

    // Update profile with correct display_name and username
    // This also fixes the trigger default if it was set to "Lantawon Viewer"
    const { data: updated, error } = await admin
      .from("profiles")
      .update({
        display_name: displayName,
        username: username || displayName,
        role: "user",
      })
      .eq("id", identity.userId)
      .select();

    if (error) {
      console.error("[auth/init-profile] Update error:", error.message);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
      // Row doesn't exist yet (trigger might be slow), try upsert
      const { error: upsertError } = await admin.from("profiles").upsert(
        {
          id: identity.userId,
          display_name: displayName,
          username: username || displayName,
          role: "user",
        },
        { onConflict: "id" }
      );
      if (upsertError) {
        console.error("[auth/init-profile] Upsert error:", upsertError.message);
        return NextResponse.json({ error: "Upsert failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/init-profile]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
