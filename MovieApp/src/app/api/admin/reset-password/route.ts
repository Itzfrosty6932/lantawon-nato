import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAdmin, UnauthorizedError } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/reset-password   (ADMIN ONLY)
 *
 * Manual password-reset flow, step 2 (admin side): issues a temporary
 * password for a user. The password is returned ONCE in this response —
 * the admin relays it to the member via their manual Gmail/chat contact.
 * It is never stored or shown again.
 *
 * Body: { userId } — optionally { ticketId } to auto-resolve the linked
 * forgot_password ticket.
 */
export async function POST(req: NextRequest) {
  try {
    const adminIdentity = await requireAdmin();

    const body = (await req.json().catch(() => ({}))) as {
      userId?: string;
      ticketId?: string;
    };

    if (!body.userId || !/^[0-9a-f-]{36}$/i.test(body.userId)) {
      return NextResponse.json({ error: "Valid userId is required." }, { status: 400 });
    }

    // GoTrue requires ≥6 chars; base64url of 9 bytes ≈ 12 chars.
    const tempPassword = randomBytes(9).toString("base64url");

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.auth.admin.updateUserById(body.userId, {
      password: tempPassword,
    });
    if (error) {
      console.error("[admin/reset-password] updateUserById failed:", error);
      return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
    }

    // Resolve any open forgot_password tickets for this user so support
    // sees the request was handled.
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

    console.log(
      `[admin/reset-password] admin ${adminIdentity.userId} reset password for user ${body.userId} (${resolvedTickets} ticket(s) resolved)`
    );

    return NextResponse.json({
      ok: true,
      tempPassword,
      resolvedTickets,
      notice:
        "Send this temporary password to the member via Gmail/chat. It is shown only once.",
    });
  } catch (e) {
    if (e instanceof UnauthorizedError || e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[admin/reset-password]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
