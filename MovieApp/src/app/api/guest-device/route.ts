import { NextRequest, NextResponse } from "next/server";

const FP_COOKIE = "lantawon_guest_fp";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Persists the guest device fingerprint in an httpOnly cookie so the
 * identity survives localStorage wipes. The client computes the fingerprint;
 * this endpoint only mirrors it into a durable cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const { fingerprint } = await req.json();

    if (!fingerprint || typeof fingerprint !== "string" || fingerprint.length > 64) {
      return NextResponse.json({ error: "Invalid fingerprint" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });

    // Only overwrite if changed (keeps the cookie stable)
    if (req.cookies.get(FP_COOKIE)?.value !== fingerprint) {
      res.cookies.set(FP_COOKIE, fingerprint, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: ONE_YEAR,
        path: "/",
      });
    }

    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

/** Read-back endpoint: returns the fingerprint from cookie if present. */
export async function GET(req: NextRequest) {
  const fp = req.cookies.get(FP_COOKIE)?.value || null;
  return NextResponse.json({ fingerprint: fp });
}
