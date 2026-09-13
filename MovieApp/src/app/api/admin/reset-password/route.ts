import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAdmin, UnauthorizedError } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/reset-password   (ADMIN ONLY)
 *
 * Manual password-reset flow: sets a custom password or generates a temporary password.
 *
 * Body: { userId, password?, ticketId? }
 */
export async function POST(req: NextRequest) {
  try {
    const adminIdentity = await requireAdmin();

    const body = (await req.json().catch(() => ({}))) as {
      userId?: string;
      password?: string;
      ticketId?: string;
    };

    if (!body.userId || !/^[0-9a-f-]{36}$/i.test(body.userId)) {
      return NextResponse.json({ error: "Valid userId is required." }, { status: 400 });
    }

    let finalPassword = body.password?.trim();
    if (finalPassword) {
      if (finalPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 }
        );
      }
    } else {
      // GoTrue requires ≥6 chars; base64url of 9 bytes ≈ 12 chars.
      finalPassword = randomBytes(9).toString("base64url");
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.auth.admin.updateUserById(body.userId, {
      password: finalPassword,
    });
    if (error) {
      console.error("[admin/reset-password] updateUserById failed:", error);
      return NextResponse.json({ error: error.message || "Failed to reset password." }, { status: 500 });
    }

    // Resolve any open forgot_password tickets for this user
    let resolvedTickets = 0;
    try {
      const query = supabase
        .from("support_tickets")
        .update({ status: "resolved", closed_at: new Date().toISOString() })
        .eq("created_by_user_id", body.userId)
        .eq("category", "forgot_password")
        .in("status", ["open", "in_progress", "waiting"]);
      if (body.ticketId) query.eq("id", body.ticketId);
      const { data } = await query.select("id");
      resolvedTickets = data?.length ?? 0;
    } catch (e) {
      console.warn("[admin/reset-password] ticket resolution failed:", e);
    }

    await supabase.from("audit_logs").insert({
      actor_user_id: adminIdentity.userId,
      action: "admin.user_password_reset",
      entity_type: "auth.users",
      entity_id: body.userId,
      new_data: { resolvedTickets, customPasswordSet: Boolean(body.password) },
    });

    return NextResponse.json({
      ok: true,
      tempPassword: finalPassword,
      message: "Password reset successfully.",
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[admin/reset-password] unexpected error:", err);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
