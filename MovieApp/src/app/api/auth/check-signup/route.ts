import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/check-signup
 *
 * BEFORE signup, check if email/username already exists in database.
 * Prevents duplicate accounts in a single verification call.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, username } = await req.json();

    if (!email || !username) {
      return NextResponse.json(
        { error: "email and username required" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Check if email exists in auth.users
    const { data: authUsers } = await admin.auth.admin.listUsers({
      perPage: 500,
    });
    const emailExists = (authUsers?.users || []).some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      return NextResponse.json(
        { error: "Email already registered. Please log in instead." },
        { status: 409 }
      );
    }

    // Check if username exists in profiles (case-sensitive unique constraint)
    const { data: profiles } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .limit(1);

    if (profiles && profiles.length > 0) {
      return NextResponse.json(
        { error: "Username already taken. Choose another one." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/check-signup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
