import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Server-side authorization authority.
 *
 * RULES:
 * - Role/tier NEVER come from localStorage, user_metadata, or any
 *   client-supplied value. They are read from `public.profiles.role`,
 *   which only the service role / SECURITY DEFINER functions can change
 *   (see migration 14: make_user_admin is locked to service_role).
 * - Every admin page (server component) and admin API route MUST call
 *   one of these helpers. Client guards (AdminRouteGuard) are UX only.
 */

export type ServerRole =
  | "guest"
  | "user"
  | "moderator"
  | "editor"
  | "analyst"
  | "admin"
  | "super_admin";

export interface ServerIdentity {
  userId: string | null;
  email: string | null;
  role: ServerRole;
  isAuthenticated: boolean;
}

const ANONYMOUS: ServerIdentity = {
  userId: null,
  email: null,
  role: "guest",
  isAuthenticated: false,
};

/**
 * Resolve the caller's real identity from the Supabase session cookie +
 * the profiles table. Safe to call from server components and route
 * handlers. Returns ANONYMOUS when unauthenticated or on any error —
 * fail closed, never open.
 */
export async function getServerIdentity(): Promise<ServerIdentity> {
  try {
    const supabase = await createServerSupabaseClient();

    // getUser() revalidates the JWT with Supabase auth server.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return ANONYMOUS;

    // Role comes ONLY from profiles table — never user_metadata.
    const { data: profileRow, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profileRow) {
      // Fail closed: authenticated but no profile row → treat as plain user,
      // never as admin.
      return {
        userId: user.id,
        email: user.email ?? null,
        role: "user",
        isAuthenticated: true,
      };
    }

    return {
      userId: user.id,
      email: user.email ?? null,
      role: (profileRow.role as ServerRole) ?? "user",
      isAuthenticated: true,
    };
  } catch {
    return ANONYMOUS;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Guard for admin-only surfaces. Throws UnauthorizedError when the caller
 * lacks an admin/super_admin role. API routes should catch this and
 * return 401/403; server component pages should redirect.
 */
export async function requireAdmin(): Promise<ServerIdentity & { userId: string }> {
  const identity = await getServerIdentity();
  if (!identity.isAuthenticated || !identity.userId) {
    throw new UnauthorizedError("Authentication required");
  }
  if (identity.role !== "admin" && identity.role !== "super_admin") {
    throw new UnauthorizedError("Admin privileges required");
  }
  return identity as ServerIdentity & { userId: string };
}

/**
 * Guard for any authenticated surface. Throws UnauthorizedError when the
 * caller has no valid session.
 */
export async function requireUser(): Promise<ServerIdentity & { userId: string }> {
  const identity = await getServerIdentity();
  if (!identity.isAuthenticated || !identity.userId) {
    throw new UnauthorizedError("Authentication required");
  }
  return identity as ServerIdentity & { userId: string };
}
