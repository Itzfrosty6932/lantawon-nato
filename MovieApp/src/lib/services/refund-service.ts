import { createClient } from "@/lib/supabase/client";

/**
 * CANONICAL REFUND RULE (enforced server-side in the request_refund RPC):
 * A subscription payment is refundable ONLY until the account watches its
 * first NON-trailer video. Trailers NEVER count. The eligibility snapshot is
 * frozen at request time so later viewing cannot rewrite a decided request.
 *
 * This service is a thin client over the SECURITY DEFINER RPC — the DB owns
 * every rule; the UI only renders the outcome.
 */

export interface RefundEligibility {
  eligible: boolean;
  firstNontrailerWatchedAt: string | null;
}

export async function getRefundEligibility(
  accountId: string
): Promise<RefundEligibility | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("account_has_nontrailer_watch", {
    p_account_id: accountId,
  });
  if (error) {
    console.warn("[Refund] eligibility check failed:", error.message);
    return null;
  }
  // RPC returns the timestamp of the first non-trailer watch, or null.
  return {
    eligible: !data,
    firstNontrailerWatchedAt: data ?? null,
  };
}

export async function requestRefund(
  paymentId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (reason.trim().length < 10) {
    return { success: false, error: "Please describe your reason (at least 10 characters)." };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("request_refund", {
    p_payment_id: paymentId,
    p_reason: reason.trim(),
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
