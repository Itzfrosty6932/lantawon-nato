import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — the FIRST line of defense (not the only one).
 *
 * Responsibilities:
 * 1. Refresh the Supabase auth cookie on every matched request so
 *    server components and route handlers always see a valid session.
 * 2. Gate protected route groups BEFORE rendering:
 *      /admin/**   → requires an authenticated session (role re-verified
 *                    server-side in the admin layout + every admin API).
 *      /account/** → requires an authenticated session.
 *
 * SECURITY MODEL: middleware can only check *that* a session exists — it
 * cannot be trusted alone for role checks (JWT claims are user-editable
 * metadata). Every privileged surface MUST additionally verify
 * `profiles.role` server-side via requireAdmin() (see lib/server/auth.ts).
 */

const PROTECTED_PREFIXES = ["/admin", "/account"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured there is no session to refresh; still run
  // the request through so placeholder builds don't crash.
  if (!supabaseUrl || !supabaseAnonKey) {
    return applyPathGuards(request, response, false);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set(name, value);
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set(name, "");
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // getUser() validates the JWT with the auth server (unlike getSession(),
  // which trusts the cookie contents).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return applyPathGuards(request, response, Boolean(user));
}

function applyPathGuards(
  request: NextRequest,
  response: NextResponse,
  hasSession: boolean
): NextResponse {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (needsAuth && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all app pages and API routes except static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2)$).*)",
  ],
};
