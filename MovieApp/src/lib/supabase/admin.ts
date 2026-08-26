import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * SERVICE-ROLE SUPABASE CLIENT (server-only)
 *
 * Bypasses RLS entirely. NEVER import from a client component — the bundler
 * enforces this via `server-only`. Used by API routes that must act with
 * elevated privileges on behalf of verified admins or anonymous flows
 * (e.g. issuing temporary passwords, creating support tickets for guests).
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — cannot create admin client."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
