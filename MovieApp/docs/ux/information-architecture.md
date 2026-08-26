# Product & Information Architecture

**Date**: 2026-08-22  
**Standard**: Cinematic, Content-First Global Application Shell

---

## 1. Global Shell Anatomy

The entire user interface is anchored by a persistent, stable three-tier shell:

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER: [Logo / CineMind]  [Search / NLP Bar (Press /)]  [Quick Tools]│
├───────────────┬────────────────────────────────────────────────────────┤
│  SIDEBAR      │  MAIN WORKSPACE PANEL                                  │
│  (Persistent) │  (Dynamically rendered based on active route)          │
│               │                                                        │
│  DISCOVER     │  • Hero Showcase / Curated Spotlight                   │
│  • Home       │  • AI Intent Prompt Chips                              │
│  • Discover   │  • Taxonomy Format Tabs & Multi-Dimensional Filters    │
│  • Trending   │  • Responsive Media Cards Grid (Movies & Series)       │
│  • Top Rated  │  • Infinite Scroll / Pagination Controls               │
│               │                                                        │
│  CONTENT      │                                                        │
│  • Movies     │                                                        │
│  • Series     │                                                        │
│  • Anime      │                                                        │
│  • Docs       │                                                        │
│               │                                                        │
│  MY LIBRARY   │                                                        │
│  • Continue   │                                                        │
│  • Watchlist  │                                                        │
│  • Local Disk │                                                        │
│  • Downloads  │                                                        │
│               │                                                        │
│  INSIGHTS     │                                                        │
│  • Stats & AI │                                                        │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Navigation Taxonomy & Route Matrix

| Shell Category | Item | Route | Purpose & Core Interactions |
| :--- | :--- | :--- | :--- |
| **Discover** | **Home** | `/` | Featured spotlight, AI prompt bar, continue watching shelf, curated carousels |
| | **Discover** | `/discover` | Multi-dimensional matrix (Format, Genre, Era 1890–2026, Region, Rating) |
| | **Trending** | `/trending` | Daily & weekly worldwide popularity trends |
| | **Top Rated** | `/top-rated` | Critically acclaimed cinematic masterpieces (IMDb/TMDB 8.0+) |
| **Content** | **Movies** | `/movies` | Dedicated feature film catalog with box-office & release date filters |
| | **Series** | `/series` | Episodic television & streaming shows with season/episode breakdown |
| | **Anime** | `/anime` | Japanese animation, OVAs, and movies with origin/sub-genre filtering |
| | **Documentaries** | `/documentaries` | Non-fiction, nature, history, and scientific cinema |
| **My Library** | **Continue Watching**| `/library/continue` | Playback resumption with exact timestamp and progress percentages |
| | **Watchlist & Favorites**| `/library` | Bookmarked titles, custom lists, and favorited media |
| | **Local Library** | `/library/local` | Native directory scanner, indexed offline files (`.mp4`, `.mkv`, etc.) |
| | **Downloads** | `/downloads` | System storage meter, offline queue, and download session manager |
| **Insights** | **Statistics** | `/statistics` | Total watch time, favorite genres, decade distribution, actor graphs |
| | **AI Assistant** | `/ai` | Natural language conversational film curator & why-to-watch explainability |
| **Player** | **Theater Mode** | `/watch/[id]` | Immersive video player with multi-source failover, A/V watchdog, & metadata |

---

## 3. UI/UX Behavioral Principles
1. **Zero Layout Shift (CLS < 0.05)**: Media cards and hero containers enforce strict aspect-ratio bounding boxes (`16:9` for backdrops/stills, `2:3` for posters).
2. **Keyboard First (A11y)**:
   - `/`: Global focus search input.
   - `T`: Toggle wide Theater Mode during playback.
   - `Space` / `K`: Play/Pause.
   - `J` / `L` or `←` / `→`: 10-second seek backward / forward.
   - `M`: Mute / Unmute.
   - `F`: Fullscreen.
   - `?`: Open keyboard shortcuts cheat sheet.
   - `Esc`: Close any active modal, drawer, or trailer pop-up.
3. **Auditory Micro-Interactions**: Zero-latency procedural audio cues on navigation clicks, success states, and drawer toggles.
