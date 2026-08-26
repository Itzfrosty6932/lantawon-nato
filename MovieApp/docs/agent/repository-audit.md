# Repository & Environment Audit

**Date**: 2026-08-22  
**Auditor**: Antigravity Principal Architect  
**Environment**: Node v26.7.0 | npm 12.0.2 | macOS (Darwin ARM64) | Git Branch: `main`

---

## 1. Repository Inventory & State

### 1.1 Root Configuration
- `package.json`: Lightweight CommonJS package (`free-flixx-2.0`, v2.0.0) with zero external runtime dependencies (`scripts`: `dev`, `start`).
- `README.md`: Original documentation describing the Free-Flixx v1.0 / v2.0 static HTML project.
- `server.js`: Custom zero-dependency Node.js HTTP server acting as a transitional router.

### 1.2 Existing Directory Structure
```
MovieApp/
├── app/
│   ├── Http/Controllers/ (CatalogController, DownloadController, GraphController, RecommendationController, StreamController)
│   ├── Models/ (Taxonomy.js)
│   └── Services/ (CatalogService, DownloadService, GraphService, NlpService, RecommendationService, StreamService, TmdbService)
├── config/ (app.js)
├── docs/ (ARCHITECTURE.md)
├── public/ (manifest.json, background.jpg, icons8-netflix-96.png)
├── resources/
│   ├── css/ (app.css, base.css, components.css, variables.css)
│   ├── js/
│   │   ├── api/ (client.js)
│   │   ├── components/ (AudioFX, ContinueWatching, DownloadModal, KeyboardShortcuts, LibrarySheet, LocalScanner, SearchAutocomplete, TasteProfile, Toast, TrailerModal)
│   │   ├── engine/ (CineStream.js)
│   │   └── pages/ (home.js, watch.js, downloads.js)
│   └── views/ (index.html, watch.html, downloads.html)
└── routes/ (api.js)
```

---

## 2. Classification & Evaluation

### 2.1 Obsolete / Legacy Artifacts
1. **Raw Node.js Custom HTTP Router (`server.js`, `routes/api.js`)**:
   - *Reason*: Lacks Next.js App Router streaming SSR, React Server Components (RSC), automatic route code-splitting, Edge/Node runtime boundaries, and modern middleware capabilities.
2. **Vanilla Imperative DOM Manipulation (`resources/js/pages/*.js`, `resources/js/components/*.js`)**:
   - *Reason*: Direct `document.getElementById` and imperative `innerHTML` string concatenations are prone to XSS, difficult to type-check, and cannot participate in React state lifecycles.
3. **Unofficial 3rd-Party Embed Aggregators**:
   - *Reason*: Unreliable iframe embeds violate architectural policy and content boundaries. Must be replaced with the clean provider abstraction: `LocalFileProvider`, `AuthorizedRemoteProvider`, and `OfficialTrailerProvider`.

### 2.2 Reusable Domain Logic & Knowledge Assets
The core algorithms and data models in `app/` and `resources/js/` are well-structured and directly translatable to TypeScript modules under `src/`:

| Source Module | Extracted Domain Logic | Target Next.js Location |
| :--- | :--- | :--- |
| `app/Models/Taxonomy.js` | Full classification: 6 formats, 18 genres, 10 eras (1890–2026), 9 regions, 8 moods | `src/lib/constants/taxonomy.ts` |
| `app/Services/NlpService.js` | Deterministic natural-language query tokenization & AST generation regex | `src/features/ai/nlp-parser.ts` |
| `app/Services/TmdbService.js` & `CatalogService.js` | TMDB API fetch contracts, multi-search, season/episode resolution | `src/lib/api/tmdb.ts` & `src/features/catalog/service.ts` |
| `app/Services/GraphService.js` | Franchise timeline sorting, person credit graph builder | `src/features/catalog/graph-service.ts` |
| `app/Services/RecommendationService.js` | Mood filter queries, AI "Why You'll Love This" explanation generator | `src/features/recommendations/service.ts` |
| `app/Services/DownloadService.js` | File path sanitization (`CineMind_Downloads/...`), bitrate/file size estimation | `src/features/downloads/download-service.ts` |
| `resources/js/components/LocalScanner.js` | Native File System Access API traversal, video file filtering (`.mp4`, `.mkv`, etc.), `SxxExx` & Year filename regex parser | `src/features/library/local-scanner.ts` |
| `resources/js/engine/CineStream.js` | A/V sync drift watchdog, dynamic buffer management, visual stall recovery, QoE scoring | `src/features/streaming/engine/cinestream-engine.ts` |
| `resources/js/components/AudioFX.js` | Zero-latency Web Audio API procedural sound synthesizer | `src/lib/audio/audio-fx.ts` |
| `resources/css/variables.css` | Tailwind & Obsidian design tokens (Zinc scale, glass surfaces, radii, shadows) | `src/app/globals.css` & `tailwind.config.ts` |

---

## 3. Risks & Migration Guardrails
1. **Clean Architectural Boundary**: No legacy code will be copied as-is into Next.js. Logic will be refactored into typed, pure functions and React components.
2. **Local-First Data Isolation**: Client-side storage (IndexedDB / OPFS / LocalStorage) must remain completely functional offline without requiring cloud infrastructure.
3. **Player Safety & Content Integrity**: The player engine will strictly consume local media, official YouTube trailer embeds, and authorized streams.
