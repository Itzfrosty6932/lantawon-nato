export interface StreamServerDefinition {
  id: string;
  name: string;
  badge: string;
  quality: string;
  description: string;
  tier: 1 | 2 | 3;
  isCleanHd: boolean;
  noWatermark: boolean;
  multiAudio: boolean;
  buildUrl: (id: string, isTv: boolean, s: number, e: number) => string;
}

export const STREAM_SERVERS: StreamServerDefinition[] = [
  // ─── TIER 1: Top Verified Clean HD / Fast Servers (Zero DNS / Zero Sandbox Issues) ───
  {
    id: "server1",
    name: "VidSrc TO (Direct Cloud)",
    badge: "💎 Cloud Direct HD",
    quality: "1080p Full-HD",
    description: "Primary ultra-fast direct cloud stream player with instant initialization, responsive scrubbing, and zero throttling.",
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
    name: "AutoEmbed (Smart Geo-CDN)",
    badge: "💎 Smart CDN · 1080p",
    quality: "1080p Full-HD",
    description: "Intelligent geo-routed video delivery network with adaptive quality scaling and zero sandbox checks.",
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
    id: "server3",
    name: "EmbedSU (Multi-CDN Cluster)",
    badge: "💎 Multi-Source · Clean",
    quality: "1080p Ultra-HD",
    description: "Aggregated high-capacity streaming cluster with automatic clean source selection.",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://embed.su/embed/tv/${id}/${s}/${e}`
        : `https://embed.su/embed/movie/${id}`,
  },
  {
    id: "server4",
    name: "VidSrc ICU (Fast Edge Node)",
    badge: "Direct Edge HD",
    quality: "1080p Full-HD",
    description: "High-uptime resilient edge node optimized for full-length movies and TV seasons.",
    tier: 1,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.icu/embed/movie/${id}`,
  },

  // ─── TIER 2: Reliable Global Fallback Mirrors ───
  {
    id: "server5",
    name: "VidSrc XYZ (Global Stable)",
    badge: "Stable Global",
    quality: "1080p Full-HD",
    description: "High-uptime established mirror with multi-source fallback.",
    tier: 2,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.xyz/embed/movie/${id}`,
  },
  {
    id: "server6",
    name: "SmashyStream (Direct Engine)",
    badge: "Direct Engine",
    quality: "1080p HD",
    description: "Direct stream processor with adaptive bitrate switching.",
    tier: 2,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`
        : `https://embed.smashystream.com/playere.php?tmdb=${id}`,
  },
  {
    id: "server7",
    name: "2Embed CC (Redundant Mirror)",
    badge: "Redundant",
    quality: "1080p HD",
    description: "Global fallback mirror with zero throttling.",
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
    id: "server8",
    name: "RiveStream (Minimal Stream)",
    badge: "Modern Minimal",
    quality: "1080p HD",
    description: "Clean modern embed stream with fast initialization.",
    tier: 2,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://rivestream.live/embed?type=series&id=${id}&season=${s}&episode=${e}`
        : `https://rivestream.live/embed?type=movie&id=${id}`,
  },
  {
    id: "server9",
    name: "VidSrc ME (Direct Mirror)",
    badge: "Direct Mirror",
    quality: "1080p Full-HD",
    description: "Reliable direct mirror node with TMDB stream indexing.",
    tier: 2,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
        : `https://vidsrc.me/embed/movie?tmdb=${id}`,
  },

  // ─── TIER 3: Secondary Resilient Edge Nodes ───
  {
    id: "server10",
    name: "111Movies (High Speed)",
    badge: "High Speed",
    quality: "1080p HD",
    description: "Direct cloud stream with instant initialization.",
    tier: 3,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://111movies.com/tv/${id}/${s}/${e}`
        : `https://111movies.com/movie/${id}`,
  },
  {
    id: "server11",
    name: "VidSrc Pro (Pro Cluster)",
    badge: "Pro Cluster",
    quality: "1080p Full-HD",
    description: "Dedicated high-bandwidth cluster with global CDN cache.",
    tier: 3,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.pro/embed/movie/${id}`,
  },
  {
    id: "server12",
    name: "VidSrc PM (Edge CDN)",
    badge: "Primary Edge",
    quality: "1080p Full-HD",
    description: "Edge CDN streaming mirror.",
    tier: 3,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.pm/embed/movie/${id}`,
  },
  {
    id: "server13",
    name: "NontonGo (Asia-Pacific)",
    badge: "Asia-Pacific",
    quality: "1080p HD",
    description: "Dedicated high-bandwidth edge node in Asia-Pacific region.",
    tier: 3,
    isCleanHd: false,
    noWatermark: false,
    multiAudio: false,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://www.nontongo.win/embed/tv/${id}/${s}/${e}`
        : `https://www.nontongo.win/embed/movie/${id}`,
  },
  {
    id: "server14",
    name: "VidSrc RIP (4K Multi-Audio)",
    badge: "Clean 4K · Multi-Audio",
    quality: "4K / 1080p Ultra-HD",
    description: "Multi-audio track direct cloud stream with soft subtitles.",
    tier: 3,
    isCleanHd: true,
    noWatermark: true,
    multiAudio: true,
    buildUrl: (id, isTv, s, e) =>
      isTv
        ? `https://vidsrc.rip/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.rip/embed/movie/${id}`,
  },
];
