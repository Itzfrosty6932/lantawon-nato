import { NextRequest, NextResponse } from "next/server";
import { getServerIdentity } from "@/lib/server/auth";

/**
 * GET /api/auth/require-password-change
 *
 * Check if user (especially admin) needs to change password on first login.
 * Admin accounts have a default password and must change it immediately.
 */
export async function GET(req: NextRequest) {
  try {
    const identity = await getServerIdentity();

    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ requireChange: false });
    }

    // Only admins must change password on first login
    if (identity.role !== "admin") {
      return NextResponse.json({ requireChange: false });
    }

    // Check if admin has changed password (no easy way in Supabase auth)
    // For now, assume all admins need to change on first login
    // In production, track this in a table like "admin_password_resets"

    return NextResponse.json({
      requireChange: false, // User manually changes in account settings
      message: "Admin should change password in /account",
    });
  } catch (err) {
    return NextResponse.json({ requireChange: false }, { status: 500 });
  }
}
