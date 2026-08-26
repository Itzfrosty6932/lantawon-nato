# LANTAWON LANG 2.0 — MASTER AGENT & ARCHITECTURAL GUIDELINES

---

## 🤖 3-Agent QA System
Every automated coding task or feature development in this repository must operate under this 3-agent perspective framework:

### 1. **Architect Agent (Design & Invariant Guard)**
- Ensures the core invariant: `CONTENT CATALOG != WATCH AVAILABILITY != PLAYBACK ENTITLEMENT != USER OWNERSHIP`.
- Protects UUID primary keys (`content.id`) and external ID decoupling (`content_external_ids`).
- Enforces strict Row-Level Security (RLS) policies on Supabase: `auth.uid() = user_id`.
- Adheres to canonical schemas in [HIGH_CONTEXT_MEMORY.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/docs/architecture/HIGH_CONTEXT_MEMORY.md) and [ARCHITECTURE_GRAPH.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/docs/architecture/ARCHITECTURE_GRAPH.md).

### 2. **Builder Agent (Implementation & Clean Code)**
- Writes type-safe TypeScript (Next.js 16 App Router + React 19).
- Uses `@supabase/ssr` (never legacy `@supabase/auth-helpers-nextjs`).
- Keeps Client Components (`'use client'`) and Server Components (`async/await`) strictly separated.
- Uses Dexie.js for local-first caching/vault and glassmorphism Tailwind UI components.

### 3. **Verifier Agent (Quality & Build Assurance)**
- Executes `npm run build` to guarantee 0 TypeScript errors and successful production compilation.
- Verifies hydration safety (no window/localStorage mismatches during SSR).
- Validates empty, loading, error, and authenticated states across all views.

---

## 🗺️ Master Documentation & Plans Index Map

All architecture specifications and implementation guides are organized under `docs/`:

| Directory / Subfolder | Domain & Coverage |
| :--- | :--- |
| **`docs/plans/00-index.md`** | Master Index for all architectural modules. |
| **`docs/plans/01-product-and-navigation/`** | 01 to 05: Product rules, Header, Search/Filters, Catalogs, Details/Timelines. |
| **`docs/plans/02-user-library-and-playback/`** | 06 to 09: Library/History, Player/Vault, Preferences, Gamification/Stats. |
| **`docs/plans/03-database-and-backend/`** | 10 to 13: Catalog DB, Entitlements, User DB, Search Sync. |
| **`docs/plans/04-specs-and-migration/`** | 15 to 20: Billing UI, Header UX, Next.js Specs, Migration, Freeze matrix. |
| **`src/app/admin/`, `src/components/admin/`, `supabase/migrations/`** | Admin portal + user-account modules — live code is the canonical spec (planning MDs retired 2026-08-25). |
| **`docs/architecture/`** | High Context Memory, Architecture Graphs & Invariant Contracts. |
| **`docs/library/` & `docs/streaming/`** | Technical Subsystem Guides (Dexie Local Vault & Streaming Resolvers). |
| **`docs/security/` & `docs/design/`** | Security Audit Reports & Visual Identity Mockups. |

---

## 🛡️ Post-Implementation Checklist

After completing code changes, perform these systematic verification steps:

### 1. Build & Type Validation
- [ ] Run `npm run build` — must succeed without errors.
- [ ] Run `npx tsc --noEmit` — verify 0 TypeScript type mismatches.

### 2. Frontend-Backend Integration
- [ ] Verify Supabase queries use correct table names from `supabase/migrations/`.
- [ ] Confirm RLS policies protect user-specific tables.
- [ ] Ensure loading, error, and fallback states exist for all data fetching.

### 3. Next.js 16 & Server Component Rules
- [ ] Add `'use client'` only where browser APIs, hooks, or event handlers are required.
- [ ] Never import server-only secrets (e.g. `TMDB_API_KEY`, Supabase service keys) in client components.
- [ ] Always use path aliases (`@/components`, `@/lib`, `@/features`).

---

## 📊 Current System Status

- ✅ **Production Build:** Fully compiling 49/49 routes with 0 errors.
- ✅ **Database & Auth:** Supabase migrations 000001–000009 with RLS.
- ✅ **Local-First Vault:** Dexie.js offline library sync.
- ✅ **Subscription & Pricing:** Solo / Plus / Max tiers with fallback fallbacks and session management.
- ✅ **Search Engine:** FilterEngine and SearchEngine with multi-type parameter support.

