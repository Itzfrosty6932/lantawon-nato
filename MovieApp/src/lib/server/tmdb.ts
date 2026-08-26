// SECURITY: Server-only module
// DO NOT import this file in client components
// Use API routes to fetch TMDB data from client components

if (typeof window !== 'undefined') {
  throw new Error(
    '[SECURITY] server/tmdb.ts should never be imported in client code. ' +
    'Use API routes to fetch TMDB data.'
  );
}

const _tmdbKey = process.env.TMDB_API_KEY;

if (!_tmdbKey) {
  throw new Error(
    "[TMDB] TMDB_API_KEY environment variable is required. " +
    "Add it to .env.local (see .env.example)"
  );
}

export const TMDB_API_KEY = _tmdbKey;
export const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Helper function for server-side TMDB requests
export async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 } // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}
