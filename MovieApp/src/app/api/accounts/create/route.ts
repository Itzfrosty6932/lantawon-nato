import { NextRequest, NextResponse } from "next/server";
import { getServerIdentity } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * POST /api/accounts/create
 *
 * Idempotent account provisioning for a freshly-signed-up user.
 *
 * Called by the signup funnel right after auth is established. Uses the
 * service-role client so it bypasses the browser client's session-cookie
 * timing race — the fresh JWT is not always attached to the very next
 * PostgREST call, and RLS then rejects the accounts insert with an
 * effectively-empty error, which was surfacing to the user as
 * "Could not set up your account".
 */
export async function POST(req: NextRequest) {
  try {
    const identity = await getServerIdentity();

    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawName = typeof body?.name === "string" ? body.name.trim() : "";
    const name = rawName || `${identity.email ?? "User"}'s Account`;

    const admin = createAdminSupabaseClient();

    const { data: existing, error: existingErr } = await admin
      .from("accounts")
      .select("id")
      .eq("owner_user_id", identity.userId)
      .maybeSingle();

    if (existingErr) {
      console.error("[accounts/create] lookup failed", existingErr);
      return NextResponse.json(
        { error: "Failed to look up account" },
        { status: 500 }
      );
    }

    if (existing?.id) {
      return NextResponse.json({ ok: true, accountId: existing.id, created: false });
    }

    const { data: inserted, error: insertErr } = await admin
      .from("accounts")
      .insert({
        name,
        owner_user_id: identity.userId,
        status: "active",
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("[accounts/create] insert failed", insertErr);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    const { error: memberErr } = await admin.from("account_members").insert({
      account_id: inserted.id,
      user_id: identity.userId,
      role: "owner",
      status: "active",
    });

    if (memberErr) {
      console.error("[accounts/create] member insert failed", memberErr);
    }

    return NextResponse.json({ ok: true, accountId: inserted.id, created: true });
  } catch (err) {
    console.error("[accounts/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
