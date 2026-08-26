import { NextRequest, NextResponse } from "next/server";
import { getServerIdentity } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * POST /api/payments/submit
 *
 * Server-side payment submission (not via browser client).
 * Uses service-role so it bypasses RLS timing issues after signup.
 */
export async function POST(req: NextRequest) {
  try {
    const identity = await getServerIdentity();

    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { accountId, packageId, amount, referenceNumber, proofImageUrl } =
      body;

    if (
      !accountId ||
      !packageId ||
      !amount ||
      !referenceNumber ||
      typeof referenceNumber !== "string" ||
      referenceNumber.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    const { error } = await admin.from("payment_submissions").insert({
      account_id: accountId,
      package_id: packageId,
      submitted_by_user_id: identity.userId,
      amount,
      currency: "PHP",
      payment_method: "gcash",
      reference_number: referenceNumber.trim(),
      proof_image_url: proofImageUrl || null,
      status: "pending",
    });

    if (error) {
      console.error("[payments/submit]", error);
      return NextResponse.json(
        { error: "Failed to submit payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[payments/submit]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
