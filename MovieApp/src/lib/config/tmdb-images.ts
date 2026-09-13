// TMDB Image Configuration
// SAFE for client-side use (no secrets, just public CDN URLs)

export const TMDB_IMAGE_CONFIG = {
  POSTER_BASE: "https://image.tmdb.org/t/p/w500",
  BACKDROP_BASE: "https://image.tmdb.org/t/p/w1280",
  PROFILE_BASE: "https://image.tmdb.org/t/p/w185",
  STILL_BASE: "https://image.tmdb.org/t/p/w500",
  FALLBACK_POSTER:
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22500%22%20height%3D%22750%22%20viewBox%3D%220%200%20500%20750%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22bg%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2318181c%22%2F%3E%3Cstop%20offset%3D%2250%25%22%20stop-color%3D%22%230e0e11%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2308080a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20fill%3D%22url(%23bg)%22%20width%3D%22500%22%20height%3D%22750%22%2F%3E%3Ctext%20fill%3D%22%2352525b%22%20font-family%3D%22system-ui%2C%20sans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Poster%3C%2Ftext%3E%3C%2Fsvg%3E",
  FALLBACK_BACKDROP:
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22720%22%20viewBox%3D%220%200%201280%20720%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22rbg%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2318181c%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2308080a%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20fill%3D%22url(%23rbg)%22%20width%3D%221280%22%20height%3D%22720%22%2F%3E%3C%2Fsvg%3E",
  FALLBACK_AVATAR:
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22280%22%20viewBox%3D%220%200%20200%20280%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22abg%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%231a1b22%22%2F%3E%3Cstop%20offset%3D%2250%25%22%20stop-color%3D%22%23111216%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%230a0b0e%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20fill%3D%22url(%23abg)%22%20width%3D%22200%22%20height%3D%22280%22%20rx%3D%2212%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%22105%22%20r%3D%2236%22%20fill%3D%22%23ffffff%22%20opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M40%20230%20C40%20180%2C%20160%20180%2C%20160%20230%20Z%22%20fill%3D%22%23ffffff%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22100%22%20y%3D%22120%22%20fill%3D%22%23ffffff%22%20opacity%3D%220.3%22%20font-family%3D%22system-ui%2C%20sans-serif%22%20font-size%3D%2226%22%20font-weight%3D%22800%22%20text-anchor%3D%22middle%22%3E%E2%98%85%3C%2Ftext%3E%3C%2Fsvg%3E",
} as const;

export function buildPosterUrl(path: string | null | undefined): string {
  return path ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${path}` : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;
}

export function buildBackdropUrl(path: string | null | undefined): string {
  return path ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${path}` : TMDB_IMAGE_CONFIG.FALLBACK_BACKDROP;
}

export function buildProfileUrl(path: string | null | undefined): string {
  return path ? `${TMDB_IMAGE_CONFIG.PROFILE_BASE}${path}` : "";
}
