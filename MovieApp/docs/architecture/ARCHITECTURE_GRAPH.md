# LANTAWON LANG — COMPLETE ARCHITECTURE & SYSTEM GRAPH (GRAPHIFY)

> **Architectural Memory & Visual Graph Specification**  
> This document maps all relationships, data flows, entity dependencies, state machines, and system layers of Lantawon Lang into visual graph models to guarantee zero hallucination during development.

---

## 1. END-TO-END SYSTEM TOPOLOGY

```mermaid
flowchart TB
    subgraph ClientLayer ["Client & UX Layer (Next.js 14+ App Router)"]
        UI_Home["Home (/)"]
        UI_Explore["Explore (/discover)"]
        UI_Search["Search Engine (/search)"]
        UI_Catalog["Media Catalogs (/movies, /shows, /anime, /documentaries)"]
        UI_Detail["Detail Pages (/title/[id], /person/[id], /company/[id])"]
        UI_Player["Video Player (/watch/[id])"]
        UI_Library["User Library (/library, /watchlist, /history)"]
        UI_Account["Account & Analytics (/statistics, /achievements, /pricing)"]
        UI_Admin["Admin & Moderation (/admin)"]
    end

    subgraph ServiceLayer ["Application Services Layer (src/services & src/features)"]
        SRV_Search["Search & Normalizer Service"]
        SRV_Catalog["Catalog & Metadata Service"]
        SRV_Availability["Where-To-Watch Availability Service"]
        SRV_Entitlement["Entitlement Engine (checkEntitlement)"]
        SRV_Playback["Source Resolver & Playback Service"]
        SRV_Library["User Library & Playlist Service"]
        SRV_Gamify["XP, Achievements & Taste Analytics Service"]
        SRV_Billing["Subscription & Billing Service"]
        SRV_Audit["Audit Log & Moderation Service"]
    end

    subgraph SecurityLayer ["Security & Identity Gateway"]
        AUTH_Supa["Supabase Auth (JWT & Session)"]
        AUTH_RLS["PostgreSQL Row-Level Security (RLS)"]
        AUTH_RBAC["Server-Side Admin Role Verification"]
    end

    subgraph DatabaseLayer ["Supabase PostgreSQL Canonical Storage"]
        DB_Content["Canonical Content & External IDs"]
        DB_Taxonomy["Genres, Themes, Keywords & Tags"]
        DB_People["People & Credits (Filmography)"]
        DB_Companies["Companies & Networks"]
        DB_Availability["Providers & Country Availability"]
        DB_Playback["Authorized Video Sources & Specs"]
        DB_User["Profiles, Settings & Devices"]
        DB_Library["Watchlists, Favorites & Playlists"]
        DB_History["Watch Sessions & Progress Tracking"]
        DB_Gamify["XP Events, Tiers & Achievements"]
        DB_Subscriptions["Plans, Subscriptions & Entitlements"]
        DB_Audit["Audit Logs & Analytics Events"]
    end

    subgraph ExternalLayer ["Upstream External Providers"]
        EXT_TMDB["Metadata Providers (TMDB API, etc.)"]
        EXT_Watch["Streaming Availability Providers"]
        EXT_Pay["Payment Gateway (Stripe / Local Webhooks)"]
        EXT_Media["Authorized Playback CDNs / Local Media Vault"]
    end

    %% Client to Service connections
    UI_Home --> SRV_Catalog
    UI_Explore --> SRV_Search
    UI_Search --> SRV_Search
    UI_Catalog --> SRV_Catalog
    UI_Detail --> SRV_Catalog
    UI_Detail --> SRV_Availability
    UI_Player --> SRV_Entitlement
    SRV_Entitlement --> SRV_Playback
    UI_Library --> SRV_Library
    UI_Account --> SRV_Gamify
    UI_Account --> SRV_Billing
    UI_Admin --> SRV_Audit

    %% Service to Security & Database
    ServiceLayer --> AUTH_Supa
    AUTH_Supa --> AUTH_RLS
    AUTH_RLS --> DatabaseLayer

    %% External Sync
    EXT_TMDB --> SRV_Catalog
    EXT_Watch --> SRV_Availability
    EXT_Pay --> SRV_Billing
    EXT_Media --> SRV_Playback
```

---

## 2. COMPLETE DATABASE ENTITY-RELATIONSHIP GRAPH (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ USER_SETTINGS : "configures"
    PROFILES ||--o{ USER_WATCHLIST : "saves"
    PROFILES ||--o{ USER_FAVORITES : "favorites"
    PROFILES ||--o{ PLAYLISTS : "creates"
    PLAYLISTS ||--o{ PLAYLIST_ITEMS : "contains"
    PROFILES ||--o{ WATCH_SESSIONS : "records"
    PROFILES ||--o{ WATCH_PROGRESS : "tracks"
    PROFILES ||--o{ USER_FOLLOWED_PEOPLE : "follows"
    PROFILES ||--o{ USER_FOLLOWED_COMPANIES : "follows"
    PROFILES ||--o{ USER_FOLLOWED_COLLECTIONS : "follows"
    PROFILES ||--o{ USER_DEVICES : "registers"
    PROFILES ||--o{ USER_XP : "earns"
    PROFILES ||--o{ XP_EVENTS : "logs"
    PROFILES ||--o{ SUBSCRIPTIONS : "subscribes"
    SUBSCRIPTION_PLANS ||--o{ SUBSCRIPTIONS : "defines"
    SUBSCRIPTION_PLANS ||--o{ SUBSCRIPTION_FEATURES : "includes"

    CONTENT ||--o{ CONTENT_EXTERNAL_IDS : "maps to"
    CONTENT ||--o{ CONTENT_GENRES : "categorized as"
    CONTENT ||--o{ CONTENT_KEYWORDS : "tagged with"
    CONTENT ||--o{ CONTENT_COUNTRIES : "originates in"
    CONTENT ||--o{ CONTENT_LANGUAGES : "spoken in"
    CONTENT ||--o{ CONTENT_COMPANIES : "produced by"
    CONTENT ||--o{ CONTENT_PEOPLE : "cast and crew"
    CONTENT ||--o{ CONTENT_AVAILABILITY : "available on"
    CONTENT ||--o{ CONTENT_MEDIA_SPECS : "technical specs"
    CONTENT ||--o{ CONTENT_ADVISORIES : "content advisories"
    CONTENT ||--o{ SEASONS : "contains (if TV)"
    SEASONS ||--o{ EPISODES : "contains"
    EPISODES ||--o{ VIDEO_SOURCES : "playable via"
    CONTENT ||--o{ VIDEO_SOURCES : "playable via (if Movie)"

    PEOPLE ||--o{ PERSON_ALIASES : "known as"
    PEOPLE ||--o{ CONTENT_PEOPLE : "credited in"
    COMPANIES ||--o{ CONTENT_COMPANIES : "produces"
    PROVIDERS ||--o{ PROVIDER_REGIONS : "operates in"
    PROVIDERS ||--o{ CONTENT_AVAILABILITY : "supplies"
    COLLECTIONS ||--o{ COLLECTION_ITEMS : "organizes"
    CONTENT ||--o{ COLLECTION_ITEMS : "belongs to"
```

---

## 3. CORE ARCHITECTURAL INVARIANTS GRAPH

```mermaid
graph TD
    subgraph GoldenRule ["Golden Architecture Invariant"]
        A["External Provider Record (TMDB, etc.)"] -->|Adapter & Normalizer| B["Internal Canonical ID: content.id"]
        B --> C["Metadata & Taxonomies"]
        B --> D["Where-to-Watch Availability (Regions)"]
        B --> E["Source Resolver & Health Check"]
        E --> F["Entitlement Engine (checkEntitlement)"]
        F --> G["Authorized Playback to User"]
    end

    subgraph SeparationRule ["Rule of Concept Separation"]
        S1["CONTENT CATALOG"] -.->|NOT EQUAL| S2["WATCH AVAILABILITY"]
        S2 -.->|NOT EQUAL| S3["PLAYBACK ENTITLEMENT"]
        S3 -.->|NOT EQUAL| S4["USER OWNERSHIP"]
    end
```

---

## 4. SEARCH & FILTER EXECUTION PIPELINE GRAPH

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Search UI & Filter Drawer
    participant Parser as Query Normalizer & Parser
    participant Resolver as Entity Resolver
    participant DB as Supabase Postgres (Full-Text & Relational Index)
    participant Ranker as Multi-Signal Search Ranker

    User->>UI: Types query (e.g. "Christopher Nolan 4k sci-fi 2020s")
    UI->>Parser: Normalized Search Query Object
    Parser->>Resolver: Extract Entity Intent (Director, Genre, Decade, Quality)
    Resolver-->>Parser: Resolved { people: [Nolan], genre: [Sci-Fi], yearFrom: 2020 }
    Parser->>DB: Structured Query with Region & Age-Rating Constraints
    DB-->>Ranker: Candidate Raw Entities (Titles, Cast, Companies, Collections)
    Ranker->>Ranker: Calculate Score (Exact Match > Person Match > Popularity > Region Fit)
    Ranker-->>UI: Grouped Entity Result Sections
    UI-->>User: Instant Cinematic Search Results View
```

---

## 5. VIDEO PLAYBACK & ENTITLEMENT LIFECYCLE GRAPH

```mermaid
stateDiagram-v2
    [*] --> RequestPlayback: User clicks Play
    RequestPlayback --> CheckAuth: Check Supabase Auth State
    
    CheckAuth --> Unauthenticated: No User Session
    Unauthenticated --> RequireLogin: Prompt Sign-In
    
    CheckAuth --> CheckEntitlement: Valid Session
    CheckEntitlement --> CheckRegion: Evaluate User Region vs Content Region
    
    CheckRegion --> RegionBlocked: Geo-restricted
    CheckRegion --> CheckPlan: Eligible Region
    
    CheckPlan --> FreeTierAllowed: Content is Free / Ad-Supported
    CheckPlan --> RequiresSubscription: Content requires Premium Tier
    RequiresSubscription --> PromptUpgrade: Open Pricing / Upgrade Modal
    
    CheckPlan --> SubscriptionActive: User has Active Entitlement
    FreeTierAllowed --> ResolveSources
    SubscriptionActive --> ResolveSources
    
    ResolveSources --> EvaluateHealth: Check Source Health & Priority
    EvaluateHealth --> FailoverNextSource: Primary Source Unhealthy/Failed
    FailoverNextSource --> EvaluateHealth
    EvaluateHealth --> MountPlayer: Source Healthy & Compatible
    
    MountPlayer --> StartSession: Create watch_sessions Record
    StartSession --> StreamPlayback: Playing Video
    StreamPlayback --> UpdateProgress: Throttle Update watch_progress (every 10s)
    StreamPlayback --> CompleteTitle: >90% Watched
    CompleteTitle --> AwardXP: Trigger XP Event & Achievement Check
    UpdateProgress --> [*]
```

---

## 6. DISCOVER MEGA-MENU & ROUTING TAXONOMY GRAPH

```mermaid
graph LR
    Root["/"] --> Home["Home (/)"]
    Root --> Explore["Explore (/discover)"]
    Root --> Search["Search (/search)"]
    Root --> Movies["Movies (/movies)"]
    Root --> Shows["Shows (/shows)"]
    Root --> Timelines["Timelines (/timelines)"]
    Root --> Library["Library (/library)"]

    subgraph DiscoverMegaMenu ["Grouped under DISCOVER Mega-Menu"]
        DiscoverRoot["/discover"]
        D_People["People (/people)"]
        D_Studios["Studios & Networks (/studios)"]
        D_Watch["Where to Watch (/where-to-watch)"]
        D_Collections["Collections (/collections)"]
        D_Anime["Anime (/anime)"]
        D_Docs["Documentaries (/documentaries)"]
        D_Cartoons["Cartoons (/cartoons)"]
    end

    subgraph AccountSubsystem ["Grouped under Account Avatar"]
        Acc_Stats["Statistics (/statistics)"]
        Acc_Achieve["Achievements (/achievements)"]
        Acc_Pricing["Pricing (/pricing)"]
        Acc_Settings["Settings (/account/settings)"]
        Acc_Devices["Devices (/account/devices)"]
        Acc_Vault["Local Media Vault (/library/local)"]
    end
```

---

## 7. SUPABASE MIGRATION PHASES DEPENDENCY GRAPH

```mermaid
flowchart TD
    P1["Phase 1: Auth, Profiles & User Settings"] --> P2["Phase 2: Canonical Content, External IDs, Genres & People"]
    P2 --> P3["Phase 3: User Library, Watchlists, Favorites & Playlists"]
    P3 --> P4["Phase 4: Watch Sessions, Progress Tracking & Resume"]
    P4 --> P5["Phase 5: Providers, Availability Matrix & Regional Catalogs"]
    P5 --> P6["Phase 6: Gamification, XP Events, Tiers & Taste Analytics"]
    P6 --> P7["Phase 7: Subscriptions, Plans & Server Entitlement Engine"]
    P7 --> P8["Phase 8: Admin Control Panel, Moderation & Audit Logs"]
    P8 --> P9["Phase 9: Multi-Signal Recommendation Engine"]
```
