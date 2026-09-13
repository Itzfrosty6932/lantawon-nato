import { NextRequest, NextResponse } from "next/server";
import { getServerIdentity } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withCanonicalPrice } from "@/lib/constants/pricing";
import { getPromoPrice, isPromoLive } from "@/lib/services/subscription-service";

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

    // Receipt screenshot is REQUIRED for manual GCash / Maya verification —
    // the admin needs a visual proof to cross-check against the reference
    // number, which is otherwise trivially forgeable.
    if (
      !proofImageUrl ||
      typeof proofImageUrl !== "string" ||
      proofImageUrl.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Receipt screenshot is required as proof of payment." },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // The amount is what the admin later reads to decide whether the GCash
    // transfer matches, and it is what the revenue total sums. Taking it from
    // the request body meant a client could name its own price, so it is
    // recomputed here from the package row and the posted value is only
    // allowed to confirm it.
    const { data: pkgRow, error: pkgError } = await admin
      .from("subscription_packages")
      .select("code, price_php, is_active, promo_percent, promo_expires_at")
      .eq("id", packageId)
      .maybeSingle();

    if (pkgError || !pkgRow) {
      return NextResponse.json({ error: "Unknown package" }, { status: 400 });
    }
    if (!pkgRow.is_active) {
      return NextResponse.json(
        { error: "That plan is no longer available." },
        { status: 400 }
      );
    }

    // Same override the pricing/checkout screens apply, so the figure quoted to
    // the customer and the figure stored here cannot drift apart.
    const pkg = withCanonicalPrice(pkgRow);
    const expectedAmount = isPromoLive(pkg)
      ? getPromoPrice(pkg)
      : Math.round(pkg.price_php);

    if (Math.round(Number(amount)) !== expectedAmount) {
      return NextResponse.json(
        {
          error: `Payment amount does not match the plan price (₱${expectedAmount}).`,
        },
        { status: 400 }
      );
    }

    const { error } = await admin.from("payment_submissions").insert({
      account_id: accountId,
      package_id: packageId,
      submitted_by_user_id: identity.userId,
      amount: expectedAmount,
      currency: "PHP",
      payment_method: "gcash",
      reference_number: referenceNumber.trim(),
      proof_image_url: proofImageUrl,
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
