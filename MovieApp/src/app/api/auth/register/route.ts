import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/register
 *
 * Server-side account creation using the admin API. This is the ONLY reliable
 * way to guarantee the new user is email-confirmed immediately — doing it from
 * the browser client (supabase.auth.signUp) leaves the account unconfirmed and
 * a follow-up auto-confirm call races the session cookie, so logins were being
 * rejected with "Invalid login credentials".
 *
 * Creates the auth user with email_confirm:true, then reconciles the profile
 * row (display_name / username / role). Duplicate email/username are rejected
 * up front so we never surface a raw Postgres error to the funnel.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, username, password, displayName } = await req.json();

    if (
      !email ||
      !username ||
      !password ||
      typeof email !== "string" ||
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "email, username and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Reject duplicate email
    const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 500 });
    const emailExists = (authUsers?.users || []).some(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );
    if (emailExists) {
      return NextResponse.json(
        { error: "Email already registered. Please log in instead." },
        { status: 409 }
      );
    }

    // Reject duplicate username (profiles.username is a case-sensitive UNIQUE)
    const { data: existingProfiles } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .limit(1);
    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json(
        { error: "Username already taken. Choose another one." },
        { status: 409 }
      );
    }

    const cleanName = (displayName || username).trim();

    // Create the user already confirmed so they can sign in right away.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        username: username.trim(),
        display_name: cleanName,
      },
    });

    if (createErr || !created?.user) {
      console.error("[auth/register] createUser", createErr);
      const msg = createErr?.message?.toLowerCase().includes("already")
        ? "Email already registered. Please log in instead."
        : createErr?.message || "Failed to create account.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userId = created.user.id;

    // Reconcile the profile row the trigger created (dedup may have suffixed
    // the username; force it back to what the user registered).
    const { data: updated } = await admin
      .from("profiles")
      .update({
        display_name: cleanName,
        username: username.trim(),
        role: "user",
      })
      .eq("id", userId)
      .select();

    if (!updated || updated.length === 0) {
      await admin.from("profiles").upsert(
        {
          id: userId,
          display_name: cleanName,
          username: username.trim(),
          role: "user",
        },
        { onConflict: "id" }
      );
    }

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
