import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SubscriptionPackage } from "./subscription-service";
import { SOLO_PASS_PRICE_PHP, withCanonicalPrice } from "@/lib/constants/pricing";

/**
 * Server-side subscription service for SSR/SSG pages
 * Uses server-only Supabase client
 */
export class SubscriptionServiceServer {
  /**
   * Fetch all active subscription packages (server-side)
   */
  static async getActivePackages(): Promise<SubscriptionPackage[]> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
        return this.getFallbackPackages();
      }

      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("[Server] Error fetching packages:", error);
        return [];
      }

      return (data || []).map(withCanonicalPrice);
    } catch (err) {
      console.error("[Server] Failed to fetch packages:", err);
      return [];
    }
  }

  /**
   * Get hardcoded fallback packages for when database is empty/unavailable
   */
  static getFallbackPackages(): SubscriptionPackage[] {
    return [
      {
        id: "package-solo-99",
        code: "solo",
        name: "Solo Pass",
        description: "Unlimited 1080p cinema streaming, all devices — 1 active screen",
        price_php: SOLO_PASS_PRICE_PHP,
        currency: "PHP",
        billing_interval: "monthly",
        max_concurrent_sessions: 1,
        display_order: 1,
        is_active: true,
        promo_percent: null,
        promo_label: null,
        promo_expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  /**
   * Get packages with automatic fallback
   */
  static async getPackagesWithFallback(): Promise<SubscriptionPackage[]> {
    const packages = await this.getActivePackages();
    if (packages.length > 0) {
      return packages;
    }
    return this.getFallbackPackages();
  }
}
