# LANTAWON LANG — HIGH-CONTEXT MEMORY & ARCHITECTURAL INVARIANTS

> **Universal High-Context Reference Document**  
> Read this document first for instant memory recall of the entire Lantawon Lang platform architecture, domain boundaries, data models, contracts, and core invariants.

---

## 1. PRODUCT IDENTITY & POSITIONING

Lantawon Lang is an **all-in-one cinematic discovery, media catalog, watchlist, personalization, legal availability intelligence, and authorized playback platform**.

### What It Is:
- A premium, OLED-dark, cinematic discovery platform
- Streaming availability hub across global & regional legal providers
- Personal media library (Watchlist, Favorites, Custom Playlists, History, Followed Creators)
- First-class Filmography & Credits database (Actors, Directors, Writers, Composers)
- Company & Studio intelligence database (Studios, Production Houses, Networks, Distributors)
- Franchise & Universe timeline explorer (Release order, Chronological order)
- Gamified Taste Analytics, Personas, and XP / Achievement engine
- Authorized source-agnostic playback engine + offline Local Media Vault

### What It Is NOT:
- ❌ NOT a simple movie database
- ❌ NOT an unauthorized mirror scraper
- ❌ NOT a single API wrapper (no permanent hard-coupling to TMDB)

---

## 2. THE THREE GOLDEN ARCHITECTURAL INVARIANTS

### Invariant 1: Separation of Concerns
```text
CONTENT CATALOG != WATCH AVAILABILITY != PLAYBACK ENTITLEMENT != USER OWNERSHIP
```
* A movie existing in the catalog does **NOT** imply it is playable.
* A movie having external streaming options does **NOT** mean Lantawon Lang hosts the stream.
* A user's library record does **NOT** equal subscription entitlement.

### Invariant 2: Internal Canonical Content Identity
```text
Internal Content ID (content.id: UUID)
   ├── content_external_ids (source: 'tmdb' | 'imdb' | 'internal', external_id)
   ├── Metadata & Taxonomies (genres, subgenres, themes, keywords)
   ├── Credits & People (cast, crew, characters)
   ├── Availability Matrix (providers, regions, prices, links)
   └── Authorized Playback Sources (licensed, owned, public_domain, local)
```
* **Never use `tmdb_id` as the primary key.** Upstream metadata APIs are upstream providers, not identity systems.

### Invariant 3: Source Resolver over Hardcoded Mirrors
```text
Playback Request 
   → Entitlement Verification (checkEntitlement)
   → Region Validation
   → Source Resolver (Priority & Quality Ranking)
   → Source Health Check
   → Playback Adapter
   → Player UI
```
* "Quality over quantity" — select the best eligible, healthy source with seamless failover.

---

## 3. UNIFIED SEARCH & FILTER CONTRACT

### The Canonical `SearchQueryObject` Contract:
```typescript
interface SearchQueryObject {
  query?: string;
  mediaTypes?: Array<'movie' | 'tv' | 'episode' | 'anime' | 'anime_episode' | 'cartoon' | 'documentary' | 'special' | 'short'>;
  genres?: string[];         // Core genres (Action, Drama, Sci-Fi, etc.)
  subgenres?: string[];      // Specialized subgenres (Cyberpunk, Space Opera, etc.)
  themes?: string[];         // Tone/Theme (Dark, Gritty, Lighthearted, etc.)
  keywords?: string[];       // Content keywords
  countries?: string[];      // ISO 3166-1 alpha-2 codes (PH, US, JP, KR, GB, etc.)
  languages?: string[];      // ISO 639-1 language codes (en, ja, ko, tl, etc.)
  originalLanguage?: string; // Original spoken tongue
  people?: string[];         // Person IDs (Actor, Director, Writer, Producer)
  companies?: string[];      // Company IDs (Studio, Network, Production Company)
  providers?: string[];      // Provider IDs (Netflix, Prime, Disney+, etc.)
  availabilityTypes?: Array<'subscription' | 'free' | 'free_with_ads' | 'rent' | 'buy' | 'broadcast' | 'official_source' | 'user_local'>;
  ratingMin?: number;        // Preset thresholds: 9.0+, 8.5+, 8.0+, 7.5+, 7.0+, 6.0+, 5.0+
  ratingSource?: 'platform' | 'external' | 'critic' | 'user';
  yearFrom?: number;
  yearTo?: number;
  month?: number;            // 1 - 12
  status?: string;           // Media-aware status (Released, Upcoming, Returning Series, Ended)
  runtimeMin?: number;       // Minutes
  runtimeMax?: number;
  quality?: Array<'480p' | '720p' | '1080p' | '1440p' | '2160p'>;
  hdr?: Array<'HDR' | 'HDR10' | 'HDR10+' | 'Dolby Vision'>;
  audio?: Array<'Stereo' | '5.1' | '7.1' | 'Atmos'>;
  certification?: string[];  // G, PG, PG-13, R, NC-17, TV-MA, etc.
  advisories?: string[];     // Violence, Gore, Nudity, Language, Substances, etc.
  sort?: 'relevance' | 'popularity_desc' | 'popularity_asc' | 'rating_desc' | 'rating_asc' | 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'most_watched' | 'most_added';
  page?: number;
  limit?: number;
}
```

---

## 4. ENTITLEMENT & SUBSCRIPTION MATRIX

### Entitlement Function Contract:
```typescript
type EntitlementResult = 
  | { allowed: true; source: PlaybackSource }
  | { allowed: false; reason: 'requires_login' | 'requires_subscription' | 'geo_restricted' | 'source_unhealthy' | 'content_unavailable' };

async function checkEntitlement(user: User | null, contentId: string, userRegion: string): Promise<EntitlementResult>;
```

### Plan Architecture:
* `subscription_packages`: `solo` (1 session) / `plus` (3 sessions) / `max` (5 sessions) — monthly tiers, admin-approved manual payments.
* **Guest Trial**: 30 minutes TOTAL per device (httpOnly `lantawon_guest_fp` cookie fingerprint + `guest_devices` table + SECURITY DEFINER RPCs `guest_device_lookup`/`guest_device_heartbeat`). Guests watch freely during trial; expiry redirects to signup.
* **Entitlement Denial Codes** (`/api/stream/resolve`): 402 `SUBSCRIPTION_REQUIRED` / `EXPIRED` / `GUEST_TRIAL_ENDED` vs 403 `PENDING_APPROVAL`. Pending-payment and expired users CAN log in but CANNOT watch until an admin approves their payment (`payment_submissions.status='pending'` → `PENDING_APPROVAL`).
* **Forgot Password (manual flow)**: request → `create_password_reset_ticket` RPC (non-enumeration, SECURITY DEFINER) → admin issues temp password in Admin Portal (`/api/admin/reset-password`, shown once) → user changes it in Account → Security. No email service involved.
* **Leaderboard**: public `/leaderboard`, top 50 `profiles.role='user'` by trigger-maintained `xp_total`; guests view-only, staff excluded. XP accrues via `xp_events` inserts (1 XP / 5 min watched, self-insert RLS) processed by `process_xp_event` trigger.
* **Security Rule**: Subscription state is server-verified via database records. Never trust client-side local storage or frontend flags for entitlements.

---

## 5. WATCH SESSIONS & PROGRESS TRACKING

### Event vs State Separation:
1. `watch_sessions`: Immutable, append-only log of every watch event (started_at, ended_at, progress_seconds, duration_seconds, completion_percentage, source_id, device_id). Used for analytics, taste computation, and audit trails.
2. `watch_progress`: Single upserted summary row per `(user_id, content_id, episode_id)` with `progress_seconds`, `completion_percentage`, and `last_watched_at`. Used for instant resume and the "Continue Watching" carousel.

---

## 6. GAMIFICATION, XP & TASTE ANALYTICS

* `user_xp`: Stores aggregated total XP and current level.
* `xp_events`: Immutable audit trail of every XP reward (e.g. `title_completed`, `series_completed`, `franchise_completed`, `streak_milestone`, `discovery_milestone`). Migration 18 adds an `event_date DATE` column plus a partial unique index on `(user_id, event_date) WHERE event_type='daily_watch_bonus'` to make the daily bonus idempotent.
* **Daily Watch Bonus**: `claim_daily_watch_bonus()` SECURITY DEFINER RPC (migration 18) — grants +50 XP only when a real, non-trailer `watch_sessions` row with `progress_seconds > 60` exists for today. The client streak (`StreakService`) is watch-based: a day counts ONLY via Dexie `watchHistory` rows with ≥60s playback / ≥2% progress / completed. Merely logging in or opening a watch page never counts. Streak UI supports milestone tiers at 10/50/100…1000+ days.
* `watch_personas`: Computed algorithmic profiles based on viewing habits (e.g., `Completionist`, `Explorer`, `Cinephile`, `Marathoner`, `Genre Specialist`, `Franchise Hunter`).

### User-Side Billing Actions (migration 18):
* `cancel_own_pending_payment(p_payment_id)` — caller-scoped withdrawal of a pending payment submission before admin review.
* `set_cancel_at_period_end(p_cancel)` — toggle auto-renewal intent on the caller's active subscription.
* `check_email_confirmed(p_email)` — login UX helper distinguishing "wrong password" from "unconfirmed email" (Supabase returns identical errors for both). Granted to anon + authenticated; returns booleans only.

### Session Lifecycle (migration 19):
* Clients can NO LONGER INSERT into `member_sessions` directly (RLS rejects it since migration 14 dropped the catch-all policy) — the sanctioned path is the `register_member_session(p_device_name, p_device_type, p_platform, p_browser, p_expires_in_days=30)` SECURITY DEFINER RPC. It resolves identity via `auth.uid()` → `account_members`, reads the concurrent-session cap from the ACTIVE subscription's package (`subscription_packages.max_concurrent_sessions`), inserts an active row keyed by a generated `session_identifier`, and evicts the oldest devices beyond the cap. Returns `{ok, session_id, session_identifier}`; granted to authenticated only.
* `heartbeat_member_session(p_session_identifier)` — caller-scoped keep-alive UPDATE of `last_seen_at`; returns `{ok}`. Granted to authenticated only.
* `SessionService.createOrUpdateSession()` / `updateHeartbeat()` (`src/lib/services/session-service.ts`) call these RPCs and cache `session_id` in localStorage for heartbeats. The old direct-INSERT code was the cause of the "Session creation error {}" login failure.
* Post-login routing is role-aware: `/login?next=` wins, else admins (`admin`/`super_admin`) land on `/admin`, members on `/home`. `signIn()` returns `{success, error?, role?}` so the login page routes from the server-resolved role instead of a stale closure.

---

## 7. SUPABASE POSTGRES RELATIONAL SCHEMAS & RLS MATRIX

### Core Schema Tables:
1. **Catalog**: `content`, `content_external_ids`, `content_genres`, `content_keywords`, `content_countries`, `content_languages`, `content_companies`, `content_people`, `content_availability`, `content_media_specs`, `content_advisories`
2. **TV Structure**: `seasons`, `episodes`
3. **People & Companies**: `people`, `person_aliases`, `person_credits`, `companies`, `providers`, `provider_regions`
4. **Collections**: `collections`, `collection_items`
5. **User Domain**: `profiles`, `user_settings`, `user_watchlist`, `user_favorites`, `playlists`, `playlist_items`, `user_followed_people`, `user_followed_companies`, `user_followed_collections`, `saved_searches`, `user_devices`
6. **Playback & History**: `video_sources`, `watch_sessions`, `watch_progress`
7. **Gamification & Analytics**: `user_xp`, `xp_events`, `achievements`, `user_achievements`, `analytics_events`
8. **Billing & Admin**: `subscription_packages`, `accounts`, `account_members`, `subscriptions`, `payment_submissions` (statuses: pending/approved/rejected/canceled), `refund_requests`, `support_tickets`, `support_messages`, `system_changelog`, `guest_devices`, `audit_logs`. Owners can never UPDATE billing rows directly — user-side mutations go through the SECURITY DEFINER RPCs in §6.

### RLS Policies:
* **Public Read**: Canonical content, metadata, public cast/crew, genres, providers, public availability.
* **Owner-Only Read/Write (`auth.uid() = user_id`)**: Profiles, user settings, watchlists, favorites, playlists, watch history, progress, analytics events, devices, notifications, and subscriptions.
* **Admin-Only (`has_role('admin')`)**: Full catalog management, playback source configuration, moderation, audit log inspection, billing administration.

---

## 8. FRONTEND ROUTE MAP & FEATURE DIRECTORY

### Page Routes:
* `/` — Home (Hero Spotlight, Continue Watching, Dynamic Shelves)
* `/leaderboard` — Public Hall of Legends (top 50 by XP; visible logged-out)
* `/forgot-password` — Manual reset request (ticket → admin temp password)
* `/discover` — Explore & Universal Search Engine
* `/search` — Global Categorized Search Results
* `/movies` — Movies Catalog
* `/shows` — TV Series Catalog
* `/anime` — Anime Catalog
* `/documentaries` — Documentaries Catalog
* `/timelines` & `/timeline/[id]` — Franchise & Universe Timelines
* `/title/[id]` — Unified Movie/Show Detail Page
* `/person/[id]` & `/people` — Person Profiles & Filmography
* `/company/[id]` & `/studios` — Company & Studio Profiles
* `/where-to-watch` — Streaming Availability Hub
* `/library` — My Library (Watchlist, Favorites, History, Playlists, Local)
* `/watch/[id]` — Source-Agnostic Video Player
* `/statistics` — Taste Analytics & Watch Insights
* `/achievements` — Achievements & Gamified XP Tiers
* `/pricing` — Subscription Plans & Upgrade
* `/admin` — Operations, Moderation & Catalog Management

### Recommended Source Structure:
```text
src/
├── app/          # Next.js 14+ App Router route groups: (public), (platform), (auth), (admin)
├── components/   # Pure UI components: layout, header, search, content, player, library
├── features/     # Domain business logic: search, catalog, people, availability, playback, library
├── lib/          # Core utilities: db, auth, cache, taxonomy, permissions, entitlement, ranking
├── services/     # External integrations: metadata, availability, billing, analytics
├── supabase/     # Migrations, database functions, seed data
└── types/        # TypeScript contracts and domain models
```

---

## 9. 15-POINT PRE-SUPABASE FREEZE CHECKLIST

Before deploying or running Supabase migrations, guarantee these 15 foundations are frozen:
1. [x] Canonical Content Model with UUID primary keys
2. [x] External ID Mapping table decoupled from internal identity
3. [x] People and Filmography Credits model
4. [x] Companies, Studios, and Networks model
5. [x] Provider Availability and Regional Matrix model
6. [x] TV Seasons and Episodes hierarchy
7. [x] Supabase Auth & Profiles bridge
8. [x] User Library (Watchlists, Favorites, Playlists)
9. [x] Watch Sessions & Fast-Resume Progress model
10. [x] Immutable Analytics & XP Event streams
11. [x] Server-side Subscription & Billing models
12. [x] Centralized Entitlement Engine
13. [x] Row-Level Security (RLS) policies
14. [x] Unified Search & Filter Query Contract
15. [x] App Router Route & Navigation Architecture
