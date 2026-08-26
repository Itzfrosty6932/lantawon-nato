import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * GET /api/auth/check-confirmation?email=...
 *
 * Login UX helper: Supabase returns the same "Invalid login credentials"
 * for a wrong password AND for an account whose email hasn't been
 * confirmed yet. This endpoint lets the login form distinguish the two.
 *
 * SECURITY:
 * - The check itself runs through a SECURITY DEFINER RPC (see migration 18,
 *   check_email_confirmed) that returns only booleans — auth.users is never
 *   exposed. When the email is unknown we answer confirmed: true so a failed
 *   login on a nonexistent account keeps reading "Incorrect email or
 *   password" (no enumeration gain).
 * - In-memory IP rate limit keeps this from being used as an oracle.
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const ipHits = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipHits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ exists: false, confirmed: true }, { status: 429 });
  }

  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() || "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ exists: false, confirmed: true });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.rpc("check_email_confirmed", {
      p_email: email,
    });

    if (error || !data) {
      // Fail closed to "confirmed" so normal wrong-password messaging holds.
      return NextResponse.json({ exists: false, confirmed: true });
    }

    return NextResponse.json({
      exists: Boolean((data as { exists?: boolean }).exists),
      confirmed: Boolean((data as { confirmed?: boolean }).confirmed),
    });
  } catch {
    return NextResponse.json({ exists: false, confirmed: true });
  }
}
