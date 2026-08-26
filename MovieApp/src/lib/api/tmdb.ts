// SECURITY: TMDB_API_KEY must ONLY be used in server-side code (API routes, server components)
// This file should NOT be imported by client components
// If you need TMDB data in a client component, fetch it via an API route

// For image URLs in client components, import from @/lib/config/tmdb-images instead

export const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
export const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Re-export image config for backward compatibility in server code
export { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";

export async function fetchTmdb<T = any>(
  endpoint: string,
  options: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
  if (!TMDB_API_KEY) {
    if (typeof window !== "undefined") {
      console.warn("[TMDB] fetchTmdb cannot be called directly from browser client code.");
      return {} as T;
    }
    throw new Error(
      "[TMDB] TMDB_API_KEY environment variable is required. Add it to .env.local (see .env.example)"
    );
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${TMDB_BASE_URL}${cleanEndpoint}`;
  const queryParams: Record<string, string> = { api_key: TMDB_API_KEY };
  for (const [k, v] of Object.entries(options)) {
    if (v !== undefined && v !== null) {
      queryParams[k] = String(v);
    }
  }
  const params = new URLSearchParams(queryParams);

  const response = await fetch(`${url}?${params}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`TMDB API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error(`[TMDB] JSON Parse Error on ${url}:`, err);
    return {} as T;
  }
}
