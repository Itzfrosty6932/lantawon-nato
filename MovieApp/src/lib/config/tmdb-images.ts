// TMDB Image Configuration
// SAFE for client-side use (no secrets, just public CDN URLs)

export const TMDB_IMAGE_CONFIG = {
  POSTER_BASE: "https://image.tmdb.org/t/p/w500",
  BACKDROP_BASE: "https://image.tmdb.org/t/p/w1280",
  PROFILE_BASE: "https://image.tmdb.org/t/p/w185",
  STILL_BASE: "https://image.tmdb.org/t/p/w500",
  FALLBACK_POSTER:
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22500%22%20height%3D%22750%22%20viewBox%3D%220%200%20500%20750%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22bg%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2318181c%22%2F%3E%3Cstop%20offset%3D%2250%25%22%20stop-color%3D%22%230e0e11%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2308080a%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22glow%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%220%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23ff3b30%22%20stop-opacity%3D%220.4%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23ff5247%22%20stop-opacity%3D%220.1%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20fill%3D%22url(%23bg)%22%20width%3D%22500%22%20height%3D%22750%22%2F%3E%3Ccircle%20cx%3D%22250%22%20cy%3D%22320%22%20r%3D%2290%22%20fill%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M220%20280%20L295%20320%20L220%20360%20Z%22%20fill%3D%22%23ff3b30%22%20filter%3D%22drop-shadow(0px%204px%2012px%20rgba(255%2C59%2C48%2C0.6))%22%2F%3E%3Ctext%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20sans-serif%22%20font-size%3D%2220%22%20font-weight%3D%22800%22%20letter-spacing%3D%222%22%20x%3D%2250%25%22%20y%3D%22440%22%20text-anchor%3D%22middle%22%3ELANTAWON%20LANG%3C%2Ftext%3E%3Ctext%20fill%3D%22%238e8e93%22%20font-family%3D%22system-ui%2C%20sans-serif%22%20font-size%3D%2213%22%20font-weight%3D%22500%22%20x%3D%2250%25%22%20y%3D%22470%22%20text-anchor%3D%22middle%22%3ENo%20Poster%20Available%3C%2Ftext%3E%3C%2Fsvg%3E",
  FALLBACK_BACKDROP:
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22720%22%20viewBox%3D%220%200%201280%20720%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22rbg%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2318181c%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2308080a%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20fill%3D%22url(%23rbg)%22%20width%3D%221280%22%20height%3D%22720%22%2F%3E%3C%2Fsvg%3E",
  FALLBACK_AVATAR:
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22185%22%20height%3D%22185%22%20viewBox%3D%220%200%20185%20185%22%3E%3Crect%20fill%3D%22%2318181c%22%20width%3D%22185%22%20height%3D%22185%22%2F%3E%3Ccircle%20cx%3D%2292.5%22%20cy%3D%2270%22%20r%3D%2235%22%20fill%3D%22%23ff3b30%22%20opacity%3D%220.2%22%2F%3E%3Cellipse%20cx%3D%2292.5%22%20cy%3D%22150%22%20rx%3D%2260%22%20ry%3D%2240%22%20fill%3D%22%23ff3b30%22%20opacity%3D%220.2%22%2F%3E%3C%2Fsvg%3E",
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
