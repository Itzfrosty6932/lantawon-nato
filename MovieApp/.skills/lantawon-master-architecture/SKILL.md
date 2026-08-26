---
name: lantawon-master-architecture
description: >-
  Master architectural blueprint, domain knowledge, entity relationship graphs,
  and implementation guidelines for Lantawon Lang cinematic platform. Activate whenever
  working on search, catalog, playback, library, auth, Supabase, subscriptions, or UI.
---

# Lantawon Lang — Master Architecture & Engineering Skill

This skill contains the comprehensive domain knowledge, architectural memory, and execution rules for the **Lantawon Lang** cinematic discovery, availability intelligence, personal library, and authorized playback platform.

## When to Use This Skill
Activate this skill whenever you are:
- Working on the **Search Engine**, Query Normalizer, or Filter Drawer
- Modifying **Catalog**, Metadata, TMDB mapping, or Content services
- Developing **People/Filmography**, **Companies/Studios**, or **Providers/Where-To-Watch** features
- Implementing **Video Player**, Playback Resolvers, Health checks, or **Local Media Vault**
- Writing **User Library** features (Watchlist, Favorites, Custom Playlists, History)
- Designing **Gamification** (XP Events, Tiers, Achievements, Watch Personas) or **Taste Analytics**
- Structuring **Supabase Postgres** schemas, migrations, RLS policies, or database queries
- Handling **Authentication**, User Profiles, Settings, or Devices
- Implementing **Subscriptions**, Billing Webhooks, or the **Entitlement Engine**
- Building **Next.js 14+ App Router** pages, components, layout, or navigation

---

## Key Reference Artifacts & Documents

When working on any subsystem, reference the divided plan files in [`Plans/`](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans):

| Domain / Subsystem | Primary Document |
|---|---|
| **System Graph & ERD** | [ARCHITECTURE_GRAPH.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/ARCHITECTURE_GRAPH.md) |
| **High-Context Memory** | [HIGH_CONTEXT_MEMORY.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/HIGH_CONTEXT_MEMORY.md) |
| **Master Index** | [00-index.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/00-index.md) |
| **Product Overview & Rules** | [01-product-definition-and-rules.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/01-product-definition-and-rules.md) |
| **Header & Nav UX** | [02-header-and-navigation.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/02-header-and-navigation.md) & [16-header-final-design-and-routes.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/16-header-final-design-and-routes.md) |
| **Search & Filters** | [03-explore-and-search-filters.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/03-explore-and-search-filters.md) & [17-nextjs-structure-and-ui-specs.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/17-nextjs-structure-and-ui-specs.md) |
| **Catalogs, People & Studios** | [04-discovery-catalogs-and-entities.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/04-discovery-catalogs-and-entities.md) |
| **Detail Pages & Timelines** | [05-detail-pages-and-timelines.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/05-detail-pages-and-timelines.md) |
| **Library & Watch History** | [06-library-and-watch-history.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/06-library-and-watch-history.md) |
| **Video Player & Vault** | [07-video-player-and-local-vault.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/07-video-player-and-local-vault.md) |
| **Account & Preferences** | [08-account-preferences-and-filters.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/08-account-preferences-and-filters.md) |
| **Analytics & Gamification** | [09-statistics-gamification-and-recommendations.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/09-statistics-gamification-and-recommendations.md) |
| **Database & Schema Models** | [10-catalog-database-strategy-and-models.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/10-catalog-database-strategy-and-models.md) & [18-database-quality-lifecycle-and-models.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/18-database-quality-lifecycle-and-models.md) |
| **Subscriptions & Billing** | [11-subscription-architecture-and-entitlements.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/11-subscription-architecture-and-entitlements.md) & [15-subscription-ui-and-billing-flow.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/15-subscription-ui-and-billing-flow.md) |
| **User & Devices DB** | [12-user-database-settings-and-analytics.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/12-user-database-settings-and-analytics.md) |
| **Search Sync & Caching** | [13-search-indexing-sync-and-db-relationships.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/13-search-indexing-sync-and-db-relationships.md) |
| **Admin & Security / RLS** | [14-admin-system-security-and-rls.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/14-admin-system-security-and-rls.md) |
| **Architecture & Migration** | [19-system-architecture-and-migration.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/19-system-architecture-and-migration.md) |
| **Pre-Supabase Freeze** | [20-cross-check-and-architecture-freeze.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/Plans/20-cross-check-and-architecture-freeze.md) |

---

## Non-Negotiable Architectural Invariants

### 1. Invariant: Concept Separation
```text
CONTENT CATALOG != WATCH AVAILABILITY != PLAYBACK ENTITLEMENT != USER OWNERSHIP
```
Never assume that an item existing in the catalog is playable, or that external streaming links mean Lantawon Lang hosts the media.

### 2. Invariant: Internal Canonical IDs
* **Never use TMDB ID or any external API ID as the primary key of internal entities.**
* All content entities use UUID `content.id`.
* External IDs are mapped through `content_external_ids (content_id, source, external_id)`.

### 3. Invariant: Source-Agnostic Playback Engine
* Replace all hardcoded mirror scrapers with a clean **Source Adapter System** and **Entitlement Resolver**:
  `Entitlement Check -> Region Check -> Source Ranking -> Health Check -> Playback Adapter`

### 4. Invariant: Unified Search Query Contract
* Always communicate between UI filter components and backend/database services using the canonical `SearchQueryObject` contract (supporting media types, hierarchical taxonomy, ISO country/language codes, people, companies, rating presets, and runtime ranges).

### 5. Invariant: Supabase Security & RLS
* **Service-role key is STRICTLY server-side.** Never expose service keys to browser bundles.
* All user tables require `auth.uid() = user_id` RLS policies.
* Admin operations verify permissions server-side via role-based access control (`has_role('admin')`).
* Subscriptions and Entitlements are verified server-side.
