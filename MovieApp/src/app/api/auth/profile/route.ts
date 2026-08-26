import { NextResponse } from "next/server";
import { getServerIdentity } from "@/lib/server/auth";

/**
 * GET /api/auth/profile
 *
 * Returns the session holder's authoritative profile fields resolved
 * SERVER-SIDE from public.profiles. This is the only identity source
 * the client AuthContext trusts for role/display data (audit C4).
 * No caching — role changes must reflect immediately.
 */
export async function GET() {
  const identity = await getServerIdentity();

  if (!identity.isAuthenticated || !identity.userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const supabase = await (await import("@/lib/supabase/server")).createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url, avatar_emoji")
      .eq("id", identity.userId)
      .single();

    if (error || !data) {
      // Authenticated but no profile row yet — return role from identity.
      return NextResponse.json({
        role: identity.role,
        display_name: identity.email?.split("@")[0] ?? null,
        avatar_url: null,
      });
    }

    // Get subscription tier
    let tier = "free";
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("owner_user_id", identity.userId)
      .single();

    if (account) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("current_package_id")
        .eq("account_id", account.id)
        .single();

      if (subscription?.current_package_id) {
        const { data: pkg } = await supabase
          .from("subscription_packages")
          .select("code")
          .eq("id", subscription.current_package_id)
          .single();
        tier = pkg?.code || "free";
      }
    }

    return NextResponse.json(
      {
        role: identity.role,
        display_name: data.display_name ?? data.username ?? null,
        avatar_url: data.avatar_url,
        avatar_emoji: data.avatar_emoji,
        tier: tier,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
