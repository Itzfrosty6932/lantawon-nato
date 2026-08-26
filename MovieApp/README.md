# Lantawon Lang 2.0 (Cinema Discovery & Local-First Streaming Engine)

**Lantawon Lang** is a private, local-first cinema discovery, offline media indexing, and stream aggregation platform designed with modern Next.js 16, TypeScript, Tailwind CSS, IndexedDB (Dexie.js), and high-performance client/server architecture.

---

## 🌟 Core Features

- **13 Canonical Platform Hubs**:
  - `Home`: Personalized hero carousel, curated shelves, continue watching shelf.
  - `Discover`: Multi-filter matrix (genres, years, ratings, sort orders).
  - `Trending`: Real-time trending movies & series across daily and weekly windows.
  - `Top Rated`: Critically acclaimed cinema & prestige television.
  - `Movies`: Film directory with genre taxonomy & runtime filtering.
  - `TV Series`: Television directory with seasons & episode navigation.
  - `Anime`: Dedicated anime database with subgenres, release tracking, and seasons.
  - `Documentaries`: Curated non-fiction & documentary archives.
  - `My Library`: Offline-first watchlist, favorites, and watch history tracking.
  - `Downloads`: Resumable client-side chunk downloader and local filesystem scanner.
  - `Achievements & XP`: Gamified watch streaks, progression ranks, and milestone badges.
  - `Analytics & Taste`: Visual watch statistics, genre breakdowns, and viewing insights.
  - `Watch Player`: Native cinema player with multi-mirror zero-downtime failover, custom subtitle styling, theater mode, and intelligent auto-scroll.

- **Local-First & Offline Engine**:
  - IndexedDB local storage for complete persistence across device reboots.
  - Custom file scanner for indexed offline MP4/MKV files.

- **Intelligent Discovery**:
  - Natural Language Search parsing ("90s psychological anime", "movies like Interstellar").
  - Content safety & MTRCB/IMDb advisory guides.
  - Complete cast directory & franchise collection timeline mapping.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Local Persistence**: Dexie.js / IndexedDB
- **Icons**: Lucide React
- **Audio Engine**: Web Audio API Sound FX

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build
npm run build
npm run start
```
