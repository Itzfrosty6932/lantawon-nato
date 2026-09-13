export interface StreamServerDefinition {
  id: string;
  name: string;
  badge: string;
  quality: string;
  description: string;
  category?: "movie" | "tv" | "anime" | "all";
  tier: 1 | 2 | 3;
  isCleanHd: boolean;
  noWatermark: boolean;
  multiAudio: boolean;
  buildUrl: (id: string, isTv: boolean, s: number, e: number) => string;
}

// ─── 1. MOVIE-OPTIMIZED DEDICATED SERVERS ──────────────────────────────────
export const MOVIE_SERVERS: StreamServerDefinition[] = [
  {
    id: "server1",
    name: "Server 1",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Direct cloud cinema mirror with full uncut runtime & low latency.",
    category: "movie",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    id: "server2",
    name: "Server 2",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "High-speed direct cinema stream with multi-subtitles.",
    category: "movie",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id) => `https://vidlink.pro/movie/${id}`,
  },
  {
    id: "server3",
    name: "Server 3",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "MultiEmbed direct player with internal fallbacks & widest coverage.",
    category: "movie",
    tier: 1,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
  {
    id: "server4",
    name: "Server 4",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Auto-fallback multi-stream cinema player with high speed.",
    category: "movie",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
  },
  {
    id: "server5",
    name: "Server 5",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Fast global CDN movie stream with crisp quality.",
    category: "movie",
    tier: 2,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id) => `https://vidsrc.net/embed/movie/${id}`,
  },
  {
    id: "server6",
    name: "Server 6",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "High-uptime established movie mirror.",
    category: "movie",
    tier: 2,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id) => `https://www.2embed.cc/embed/${id}`,
  },
  {
    id: "server7",
    name: "Server 7",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Clean modern fast cinema node.",
    category: "movie",
    tier: 2,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id) => `https://rivestream.live/embed?type=movie&id=${id}`,
  },
];

// ─── 2. TV SERIES DEDICATED SERVERS ────────────────────────────────────────
export const TV_SERVERS: StreamServerDefinition[] = [
  {
    id: "server1",
    name: "Server 1",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "VidSrc Cloud TV series stream with complete seasons and fast buffering.",
    category: "tv",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, _isTv, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "server2",
    name: "Server 2",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Primary high-speed TV series stream with full seasons & multi-subtitles.",
    category: "tv",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, _isTv, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: "server3",
    name: "Server 3",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "MultiEmbed player for TV series with internal multi-CDN fallback.",
    category: "tv",
    tier: 1,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, _isTv, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "server4",
    name: "Server 4",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Auto-fallback TV stream with subtitle selection.",
    category: "tv",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, _isTv, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "server5",
    name: "Server 5",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Fast global CDN TV series stream.",
    category: "tv",
    tier: 2,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, _isTv, s, e) => `https://vidsrc.net/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "server6",
    name: "Server 6",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "High-uptime established TV series mirror.",
    category: "tv",
    tier: 2,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, _isTv, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: "server7",
    name: "Server 7",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Clean modern fast series node.",
    category: "tv",
    tier: 2,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, _isTv, s, e) => `https://rivestream.live/embed?type=series&id=${id}&season=${s}&episode=${e}`,
  },
];

// ─── 3. ANIME-OPTIMIZED DEDICATED SERVERS ──────────────────────────────────
export const ANIME_SERVERS: StreamServerDefinition[] = [
  {
    id: "server1",
    name: "Server 1",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Cloud anime player with full episodes and low latency.",
    category: "anime",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    id: "server2",
    name: "Server 2",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Direct anime stream with multi-subtitles and fast buffering.",
    category: "anime",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: true,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://vidlink.pro/tv/${id}/${s}/${e}`
        : `https://vidlink.pro/movie/${id}`,
  },
  {
    id: "server3",
    name: "Server 3",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "MultiEmbed player for Anime with internal fallbacks.",
    category: "anime",
    tier: 1,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
  {
    id: "server4",
    name: "Server 4",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Auto-fallback multi-stream player.",
    category: "anime",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`
        : `https://player.autoembed.cc/embed/movie/${id}`,
  },
  {
    id: "server5",
    name: "Server 5",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Fast global CDN anime stream.",
    category: "anime",
    tier: 2,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://vidsrc.net/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.net/embed/movie/${id}`,
  },
  {
    id: "server6",
    name: "Server 6",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "High-uptime established anime mirror.",
    category: "anime",
    tier: 2,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${id}`,
  },
  {
    id: "server7",
    name: "Server 7",
    badge: "1080p",
    quality: "1080p Full-HD",
    description: "Dedicated high-bandwidth anime cluster.",
    category: "anime",
    tier: 2,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: true,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://rivestream.live/embed?type=series&id=${id}&season=${s}&episode=${e}`
        : `https://rivestream.live/embed?type=movie&id=${id}`,
  },
];

// Helper to get dedicated lightweight server pool by content type
export function getStreamingServersFor(type?: string): StreamServerDefinition[] {
  const norm = (type || "").toLowerCase();
  if (norm === "anime") return ANIME_SERVERS;
  if (norm === "tv" || norm === "series" || norm === "show") return TV_SERVERS;
  return MOVIE_SERVERS;
}

// Default export alias for backward compatibility
export const STREAM_SERVERS: StreamServerDefinition[] = MOVIE_SERVERS;
