# LANTAWON LANG — MASTER PLAN INDEX & TABLE OF CONTENTS

> This index organizes the master architectural blueprint into 4 categorized subfolders located in `docs/plans/`, alongside visual system graphs, high-context memory guides, implementation roadmaps, cross-check matrices, and custom agent skills.

> ⚠️ **Removed (2026-08-25):** the `05-user-account/` subsystem docs and `03-database-and-backend/14-admin-system-security-and-rls.md` were retired. The admin portal and user-account modules are now specified by the live code itself — see `src/app/admin/`, `src/components/admin/` and `supabase/migrations/` (canonical source of truth). Do not recreate planning docs for these modules.

---

## 🧠 High-Context Memory, Graphs & Roadmaps

| Document | Description |
|---|---|
| 🗺️ [roadmap.md](./roadmap.md) | **9-Phase Step-by-Step Execution Plan (Supabase & Vercel strictly in Phase 9)** |
| 🔄 [CROSS_CHECK_MATRIX.md](../architecture/CROSS_CHECK_MATRIX.md) | **Subsystem Transformation Map & Zero-Hallucination Checkpoints** |
| 📊 [ARCHITECTURE_GRAPH.md](../architecture/ARCHITECTURE_GRAPH.md) | **Complete Mermaid System Topology, ERD, Request Lifecycles & State Graphs** |
| 🧠 [HIGH_CONTEXT_MEMORY.md](../architecture/HIGH_CONTEXT_MEMORY.md) | **Universal Architectural Invariants, Entity Contracts, Matrix & Security Rules** |
| 🛠️ [lantawon-master-architecture Skill](../../.agents/skills/lantawon-master-architecture/SKILL.md) | **Dedicated Agent Skill for Zero-Hallucination Development** |
| 📜 [original-plan.md](./04-specs-and-migration/original-plan.md) | *Original Master Architecture Reference* |

---

## 📂 Categorized Subfolders & Specification Directory

### 📁 01. Product & Navigation
| # | Document | Coverage | Summary |
|---|---|---|---|
| **01** | [01-product-definition-and-rules.md](./01-product-and-navigation/01-product-definition-and-rules.md) | Sections 0 - 1 | Product Definition & Global Product Rules |
| **02** | [02-header-and-navigation.md](./01-product-and-navigation/02-header-and-navigation.md) | Sections 2 - 4 | Header Architecture & Navigation Breakdown |
| **03** | [03-explore-and-search-filters.md](./01-product-and-navigation/03-explore-and-search-filters.md) | Sections 5 - 14 | Explore, Search Engine & Advanced Filter System |
| **04** | [04-discovery-catalogs-and-entities.md](./01-product-and-navigation/04-discovery-catalogs-and-entities.md) | Sections 15 - 24 | Discovery Mega-Menu, Catalogs & Regional Availability |
| **05** | [05-detail-pages-and-timelines.md](./01-product-and-navigation/05-detail-pages-and-timelines.md) | Sections 25 - 27 | Movie/Show Detail Pages, TV Seasons & Timelines/Franchises |

### 📁 02. User Library & Playback
| # | Document | Coverage | Summary |
|---|---|---|---|
| **06** | [06-library-and-watch-history.md](./02-user-library-and-playback/06-library-and-watch-history.md) | Sections 28 - 30 | User Library, Data Models & Watch History Sessions |
| **07** | [07-video-player-and-local-vault.md](./02-user-library-and-playback/07-video-player-and-local-vault.md) | Sections 31 - 34 | Video Player Engine, Playback Sources & Local Media Vault |
| **08** | [08-account-preferences-and-filters.md](./02-user-library-and-playback/08-account-preferences-and-filters.md) | Sections 35 - 38 | Account Menu, Region Switcher, Preferences & Parental Filters |
| **09** | [09-statistics-gamification-and-recommendations.md](./02-user-library-and-playback/09-statistics-gamification-and-recommendations.md) | Sections 39 - 43 | Statistics, Watch Personas, Achievements, XP & Recommendation Engine |

### 📁 03. Database & Backend
| # | Document | Coverage | Summary |
|---|---|---|---|
| **10** | [10-catalog-database-strategy-and-models.md](./03-database-and-backend/10-catalog-database-strategy-and-models.md) | Sections 44 - 50 | Catalog Strategy, Canonical Model, People, Companies & Providers DB |
| **11** | [11-subscription-architecture-and-entitlements.md](./03-database-and-backend/11-subscription-architecture-and-entitlements.md) | Sections 51 - 52 | Subscription Architecture & Centralized Entitlement Engine |
| **12** | [12-user-database-settings-and-analytics.md](./03-database-and-backend/12-user-database-settings-and-analytics.md) | Sections 53 - 62 | User Profiles, Settings, Watchlists, Playlists, Devices & Analytics Events |
| **13** | [13-search-indexing-sync-and-db-relationships.md](./03-database-and-backend/13-search-indexing-sync-and-db-relationships.md) | Sections 63 - 70 | Search Indexing, Data Sources, Sync Engine, Caching & Relational Map |

### 📁 04. Specs & Migration
| # | Document | Coverage | Summary |
|---|---|---|---|
| **15** | [15-subscription-ui-and-billing-flow.md](./04-specs-and-migration/15-subscription-ui-and-billing-flow.md) | Sections 75 - 76 | Subscription Pricing UI & Billing Webhook Flow |
| **16** | [16-header-final-design-and-routes.md](./04-specs-and-migration/16-header-final-design-and-routes.md) | Sections 77 - 79 | Final Header UX Specification & Application Page Routes |
| **17** | [17-nextjs-structure-and-ui-specs.md](./04-specs-and-migration/17-nextjs-structure-and-ui-specs.md) | Sections 80 - 87 | Next.js App Architecture, File Migration & Search/Card/Detail UI Specs |
| **18** | [18-database-quality-lifecycle-and-models.md](./04-specs-and-migration/18-database-quality-lifecycle-and-models.md) | Sections 88 - 97 | Database Quality, Indexing, Audit Logs, Tech Specs & Collection Models |
| **19** | [19-system-architecture-and-migration.md](./04-specs-and-migration/19-system-architecture-and-migration.md) | Sections 98 - 105 | UX Principles, Full System Architecture, Supabase Migration Phases & Success Criteria |
| **20** | [20-cross-check-and-architecture-freeze.md](./04-specs-and-migration/20-cross-check-and-architecture-freeze.md) | Part 2: Cross-Check & Lock (Sections 2 - 9) | System Cross-Check, Key Database Transformations & Pre-Supabase Freeze List |
