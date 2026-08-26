# Tooling & Dependency Evaluation

**Date**: 2026-08-22  
**Purpose**: Evaluate verified repositories, agent tools, libraries, and frameworks before implementation.

---

## 1. Tool Evaluation Matrix

| Tool / Repository | Category | Purpose | License | macOS / Node Compatibility | Resource & Context Cost | Decision |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Next.js 15+ (App Router)** | Core Framework | React 19 Full-Stack Framework with SSR, RSC, Route Handlers | MIT | Full (Node 26+ verified) | Low / Optimized | **APPROVED** |
| **TypeScript 5+** | Type Safety | Strict typing across domain models, API contracts, and components | Apache 2.0 | Full | Zero runtime cost | **APPROVED** |
| **Tailwind CSS v3/v4** | Styling | Design-token based responsive layout and dark theme | MIT | Full | Compile-time only | **APPROVED** |
| **Lucide React** | Icons | Modern, lightweight, accessible SVG icons | ISC | Full | Tree-shakable | **APPROVED** |
| **Dexie.js / IndexedDB** | Local Storage | Typed, reactive IndexedDB wrapper for local watchlists, history, and scanned library items | Apache 2.0 | Browser standard | Client memory only | **APPROVED** |
| **Hls.js** | Media Engine | Lightweight MSE-based HLS player engine for authorized streams | Apache 2.0 | Browser standard | Client-side MSE only | **APPROVED** |
| **Superpowers (obra/superpowers)** | Agent Workflow | TDD, planning, and review workflows for Antigravity agents | MIT | Full | Prompt/skills layer | **APPROVED (Skills Evaluated)** |
| **Graphiti / GraphRAG** | Knowledge Graph | Heavy external graph database with Python sidecar | MIT | Requires external daemon | High RAM/CPU overhead | **REJECTED (In-Memory TS Graph chosen)** |
| **External Supabase / Postgres** | Backend Cloud DB | Remote relational cloud database | Apache 2.0 | N/A | Premature cloud coupling | **REJECTED (Local-first architecture prioritized)** |
| **Multiple Overlapping Memory Systems** | Memory | Running Atlaso + Ultra + Chroma concurrently | Varied | Process bloat | High failure risk & duplicated tokens | **REJECTED (Single unified docs/ memory chosen)** |

---

## 2. In-Depth Tooling Decisions

### 2.1 Local Data Architecture: Dexie.js (IndexedDB) + Native File System Access API
- **Why we need it**: The application must run 100% locally on desktop (macOS) without requiring a remote database or Docker container.
- **Benefits**:
  1. IndexedDB provides structured, queryable client-side storage for hundreds of thousands of titles, watch progress timestamps, and analytics without 5MB `localStorage` limits.
  2. The Native `window.showDirectoryPicker()` and File System Access API allow direct zero-copy file pointer indexing and playback.

### 2.2 In-Memory TypeScript Knowledge Graph vs. Heavy External Python Daemons
- **Decision**: Implement domain-specific knowledge graph traversal (`Person` filmography nodes and `Franchise` timeline edges) in pure TypeScript within `src/lib/graph/` and `src/features/catalog/`.
- **Rationale**: Eliminates external Python subprocesses, database daemons, and token leaks while providing sub-millisecond graph query speeds directly in the Node.js / browser runtime.

### 2.3 Single Source of Truth for Project Memory: `docs/` Markdown Hierarchy
- **Decision**: Maintain structured, human-readable markdown files under `docs/` (`docs/architecture/`, `docs/ux/`, `docs/decisions/`, `docs/streaming/`, `docs/agent/`).
- **Rationale**: Clean, version-controlled git memory that integrates natively with Antigravity context windows without external daemon overhead.
