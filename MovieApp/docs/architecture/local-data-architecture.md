# Local-First Data Architecture

**Date**: 2026-08-22  
**Philosophy**: Zero-Cloud Dependency by Default, Migration-Ready by Design

---

## 1. Storage Tiers & Responsibilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LOCAL DATA LAYER TIERS                          │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ TIER 1: IndexedDB │ TIER 2: OPFS /    │ TIER 3: Local Memory / Cache   │
│ (Structured Data) │ Local Filesystem  │ (Ephemeral State)              │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Watch History   │ • Video Files     │ • TMDB API Response Cache      │
│ • Watch Progress  │ • Subtitle Files  │ • Search Autocomplete Trie     │
│ • Watchlist       │ • Download Chunks │ • File Handle Session Map      │
│ • Favorites       │ • Local Artwork   │ • A/V Sync HUD Telemetry Logs  │
│ • Local Metadata  │ • Storage Meter   │ • Active Player State Machine  │
│ • Statistics      │                   │                                │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 2. Schema Definitions (IndexedDB / Dexie)

### 2.1 Table: `watch_history`
```typescript
interface WatchHistoryRecord {
  id: string;              // Composite key: `${mediaId}_${season}_${episode}`
  mediaId: string;         // TMDB ID or local file ID
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string;
  backdropPath?: string;
  season?: number;
  episode?: number;
  currentTime: number;     // In seconds
  duration: number;        // In seconds
  percentage: number;      // 0 - 100
  lastWatchedAt: string;   // ISO timestamp
  completed: boolean;
}
```

### 2.2 Table: `library_items`
```typescript
interface LibraryItemRecord {
  id: string;              // TMDB ID or UUID
  mediaType: "movie" | "tv";
  title: string;
  year?: string;
  posterPath: string;
  genres: string[];
  rating: number;
  inWatchlist: boolean;
  isFavorite: boolean;
  userRating?: number;     // 1 - 10
  addedAt: string;         // ISO timestamp
}
```

### 2.3 Table: `local_scanned_media`
```typescript
interface LocalScannedMediaRecord {
  fileId: string;          // Generated unique ID
  fileName: string;        // e.g., "Inception (2010) [1080p].mp4"
  fullPath: string;        // System or relative path
  title: string;           // Extracted cleaned title
  year?: string;
  mediaType: "movie" | "tv";
  season?: number;
  episode?: number;
  quality: string;         // "4K" | "1080P" | "720P" | "HD"
  sizeBytes: number;
  sizeFormatted: string;   // "1.8 GB"
  posterPath?: string;     // Matched artwork or fallback
  matchedTmdbId?: string;
  lastScannedAt: string;
}
```

---

## 3. Future Cloud Migration Path
The repository / data access layer is abstracted behind interface contracts (`IWatchHistoryRepository`, `ILibraryRepository`). Switching to a hosted database (e.g., Supabase / PostgreSQL) in the future requires implementing the cloud adapter without altering UI components or business services.
