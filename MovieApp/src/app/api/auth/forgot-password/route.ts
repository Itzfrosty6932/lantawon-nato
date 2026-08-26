import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/forgot-password
 *
 * Manual password-reset flow, step 1: the user requests a reset. This
 * creates a `forgot_password` support ticket (via SECURITY DEFINER RPC)
 * that appears in the Admin Portal. Our team then verifies the person
 * manually via Gmail/chat and an admin issues a temporary password.
 *
 * Non-enumeration: the response is IDENTICAL whether or not the email is
 * registered. Basic in-memory IP rate limiting blunts abuse.
 */

// Small in-memory rate limiter: 5 requests / hour / IP.
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: { email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const message = (body.message ?? "").toString().slice(0, 1000);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    // Anon server client — the RPC is SECURITY DEFINER and granted to anon.
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await anon.rpc("create_password_reset_ticket", {
      p_email: email,
      p_message: message || null,
    });
  } catch (e) {
    console.error("[forgot-password] rpc failed:", e);
    // Fall through to the generic response — never reveal anything.
  }

  return NextResponse.json({
    ok: true,
    message:
      "If that email is registered, our team will contact you at your Gmail with a temporary password. You'll change it once you're back in your account.",
  });
}
