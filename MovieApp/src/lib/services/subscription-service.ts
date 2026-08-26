import { createClient } from "@/lib/supabase/client";

export interface SubscriptionPackage {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_php: number;
  currency: string;
  billing_interval: string;
  max_concurrent_sessions: number;
  display_order: number;
  is_active: boolean;
  promo_percent: number | null;
  promo_label: string | null;
  promo_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A package's promo is live only while a discount is set and the expiry
 * (if any) hasn't passed. Computed at read time — no cron needed; when the
 * clock runs out every surface silently reverts to normal pricing.
 */
export function isPromoLive(pkg: {
  promo_percent: number | null;
  promo_expires_at: string | null;
}): boolean {
  return (
    pkg.promo_percent != null &&
    (!pkg.promo_expires_at || new Date(pkg.promo_expires_at) > new Date())
  );
}

export function getPromoPrice(pkg: { price_php: number } & Parameters<typeof isPromoLive>[0]): number {
  return Math.round(pkg.price_php * (1 - (pkg.promo_percent ?? 0) / 100));
}

export interface Account {
  id: string;
  name: string;
  owner_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  account_id: string;
  current_package_id: string | null;
  pending_package_id: string | null;
  package_change_at: string | null;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentSubmission {
  id: string;
  account_id: string;
  package_id: string;
  submitted_by_user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number: string | null;
  proof_image_url: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

export class SubscriptionService {
  private supabase = createClient();

  /**
   * Fetch all active subscription packages
   */
  async getActivePackages(): Promise<SubscriptionPackage[]> {
    const { data, error } = await this.supabase
      .from("subscription_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching packages:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get package by code (solo)
   */
  async getPackageByCode(code: string): Promise<SubscriptionPackage | null> {
    const { data, error } = await this.supabase
      .from("subscription_packages")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching package:", error);
      return null;
    }

    return data;
  }

  /**
   * Get user's account
   */
  async getUserAccount(userId: string): Promise<Account | null> {
    const { data, error } = await this.supabase
      .from("accounts")
      .select("*")
      .eq("owner_user_id", userId)
      .single();

    if (error) {
      // User might not have an account yet
      return null;
    }

    return data;
  }

  /**
   * Get account's subscription
   */
  async getAccountSubscription(
    accountId: string
  ): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from("subscriptions")
      .select("*")
      .eq("account_id", accountId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Submit payment for verification
   */
  async submitPayment(params: {
    accountId: string;
    packageId: string;
    amount: number;
    referenceNumber: string;
    proofImageUrl: string;
    userId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    let userId = params.userId;

    // If userId not provided, try to get it from session
    if (!userId) {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await this.supabase.from("payment_submissions").insert({
      account_id: params.accountId,
      package_id: params.packageId,
      submitted_by_user_id: userId,
      amount: params.amount,
      currency: "PHP",
      payment_method: "gcash",
      reference_number: params.referenceNumber,
      proof_image_url: params.proofImageUrl,
      status: "pending",
    });

    if (error) {
      console.error("Error submitting payment:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get user's pending payment submissions
   */
  async getUserPaymentSubmissions(
    userId: string
  ): Promise<PaymentSubmission[]> {
    const { data, error } = await this.supabase
      .from("payment_submissions")
      .select("*")
      .eq("submitted_by_user_id", userId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment submissions:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Cancel MY OWN pending payment (withdraw it before admin review).
   * Enforced server-side by the cancel_own_pending_payment RPC.
   */
  async cancelOwnPendingPayment(
    paymentId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await this.supabase.rpc(
      "cancel_own_pending_payment",
      { p_payment_id: paymentId }
    );

    if (error) {
      console.error("Error canceling pending payment:", error);
      return { success: false, error: error.message };
    }
    return { success: Boolean((data as any)?.ok) };
  }

  /**
   * Toggle auto-renewal intent on MY OWN active subscription.
   * Enforced server-side by the set_cancel_at_period_end RPC.
   */
  async setCancelAtPeriodEnd(
    cancel: boolean
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await this.supabase.rpc("set_cancel_at_period_end", {
      p_cancel: cancel,
    });

    if (error) {
      console.error("Error updating renewal preference:", error);
      return { success: false, error: error.message };
    }
    return { success: Boolean((data as any)?.ok) };
  }

  /**
   * Create account for new user
   */
  async createAccount(
    userId: string,
    name: string
  ): Promise<{ success: boolean; accountId?: string; error?: string }> {
    const { data, error } = await this.supabase
      .from("accounts")
      .insert({
        name: name,
        owner_user_id: userId,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating account:", error);
      return { success: false, error: error.message };
    }

    // Also Create account_member record for owner
    await this.supabase.from("account_members").insert({
      account_id: data.id,
      user_id: userId,
      role: "owner",
      status: "active",
    });

    return { success: true, accountId: data.id };
  }

  /**
   * Get subscription with package details
   */
  async getSubscriptionWithPackage(accountId: string): Promise<{
    subscription: Subscription | null;
    currentPackage: SubscriptionPackage | null;
    pendingPackage: SubscriptionPackage | null;
  }> {
    const subscription = await this.getAccountSubscription(accountId);

    if (!subscription) {
      return {
        subscription: null,
        currentPackage: null,
        pendingPackage: null,
      };
    }

    const currentPackage = subscription.current_package_id
      ? await this.getPackageById(subscription.current_package_id)
      : null;

    const pendingPackage = subscription.pending_package_id
      ? await this.getPackageById(subscription.pending_package_id)
      : null;

    return { subscription, currentPackage, pendingPackage };
  }

  private async getPackageById(id: string): Promise<SubscriptionPackage | null> {
    const { data, error } = await this.supabase
      .from("subscription_packages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }

    return data;
  }
}

export const subscriptionService = new SubscriptionService();
