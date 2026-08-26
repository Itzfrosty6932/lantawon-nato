import React from "react";
import { CatalogPreviewService } from "@/lib/services/catalog-preview.server";
import { LantawonLandingView } from "@/components/landing/LantawonLandingView";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SubscriptionPackage } from "@/lib/services/subscription-service";

// Force dynamic rendering to allow auth checks in client components
export const dynamic = "force-dynamic";

/**
 * The landing hero card must always show exactly what the admin configured
 * in the portal — same plan, same price, same promo. Fetched server-side so
 * the price renders with the first paint (no flash of a hardcoded number).
 */
async function getLandingPlan(): Promise<SubscriptionPackage | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("subscription_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(1);

    if (error) {
      console.error("[Landing] Failed to fetch plan:", JSON.stringify(error));
      return null;
    }
    return (data?.[0] as SubscriptionPackage) ?? null;
  } catch (e) {
    console.error("[Landing] Plan fetch threw:", e);
    return null;
  }
}

export default async function LandingPage() {
  // Fetch real trending preview + the live plan in parallel
  const [trendingMovies, plan] = await Promise.all([
    CatalogPreviewService.getTrendingMovies(12),
    getLandingPlan(),
  ]);

  return <LantawonLandingView trendingItems={trendingMovies} plan={plan} />;
}

