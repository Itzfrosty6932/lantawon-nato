# 2. CROSS-CHECK — WHAT I CHANGED FROM YOUR CURRENT SYSTEM

| Area                    | Your current design         | Final design                                      | Verdict         |
| ----------------------- | --------------------------- | ------------------------------------------------- | --------------- |
| Header                  | Too many possible navs      | 7 primary navs + grouped mega menus               | ✅ Better       |
| Movies / Series / Anime | Separate catalogs           | Unified content model with classifications        | ✅ Better       |
| Genres                  | One huge flat list          | Genre + subgenre + theme + keyword taxonomy       | ✅ Better       |
| Rating                  | `+10 → 1`                | Minimum-rating presets + source-specific ratings  | ✅ Better       |
| Country                 | Text/flags                  | ISO country codes                                 | ✅ Better       |
| Date                    | Year + optional month       | Year + month + custom range                       | ✅ Better       |
| TV Status               | Mixed                       | Media-aware statuses                              | ✅ Better       |
| Actors                  | Modal + person page         | First-class People/Filmography subsystem          | ✅ Better       |
| Studios                 | Mostly discovery metadata   | Companies + company types + relationships         | ✅ Better       |
| Where to Watch          | UI feature                  | Dedicated Availability subsystem                  | ✅ Much better  |
| Subscription            | Simple`Premium` flag      | Plans → Subscription → Entitlement              | ✅ Much better  |
| Watch History           | One large table             | Sessions + current progress                       | ✅ Better       |
| Analytics               | User JSON-like data         | Event-based analytics                             | ✅ Much better  |
| XP                      | Total XP                    | XP events + derived total                         | ✅ Better       |
| Search                  | One search engine           | Parser + filters + entity resolver + ranker       | ✅ Better       |
| TMDB coupling           | Strong                      | Internal ID + external ID mapping                 | ✅ Critical fix |
| Local Vault             | Mixed with online           | Independent local-media subsystem                 | ✅ Better       |
| Playback                | Mirror-first                | Entitlement → eligibility → ranking → playback | ✅ Critical fix |
| Content advisory        | Mixed with player telemetry | Dedicated content advisory system                 | ✅ Better       |
| Technical specs         | Stream/player information   | Content/source-specific specs                     | ✅ Better       |
| Supabase                | Basic tables                | Proper relational domain model                    | ✅ Much better  |
| Security                | Basic RLS concept           | RLS + grants + server-side entitlement            | ✅ Much better  |
| Admin                   | Not clearly separated       | Dedicated Admin domain                            | ✅ Better       |

## 3. THE BIGGEST DATABASE CHANGE

The old model essentially thinks:

```text
TMDB ID
   ↓
Movie
   ↓
Stream
   ↓
User
I strongly recommend changing it to:
                    ┌───────────────┐
                    │  CONTENT      │
                    │ internal ID   │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
   PEOPLE/CREDITS      COMPANIES           COLLECTIONS
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
                    EXTERNAL IDS
                            ↓
                       PROVIDERS
                            ↓
                     AVAILABILITY
                            ↓
                     PLAYBACK SOURCES
                            ↓
                    ENTITLEMENT ENGINE
                            ↓
                           USER
That is the architecture I would lock down before moving the project to Supabase.
4. YOUR “WHAT MOVIES ARE IN MY DATABASE?” QUESTION
This is also an important correction.
You should not think of your database as:
“I need every movie from old to latest stored permanently.”
Instead, define the catalog as:
LANTAWON LANG CANONICAL CATALOG
│
├── Movies
├── TV Shows
├── Episodes
├── Anime
├── Cartoons
├── Documentaries
├── Specials
├── People
├── Companies
├── Collections
└── Providers
Then each title can have:
content.id
    ↓
content_external_ids
    ├── source = metadata_provider_A
    ├── source = metadata_provider_B
    └── source = internal
That means you are not trapped forever by one API. TMDB's current API documentation explicitly describes movie, TV, actor/person, image, configuration, and rate-limited API capabilities, so it makes sense to treat it as an upstream metadata provider, not as your application's primary identity system. 
5. THE FOUR FEATURES YOU SPECIFICALLY ASKED TO MAKE COMPLETE
🎭 Actors / Creators
Should become:
People
├── Actors
├── Directors
├── Writers
├── Producers
├── Composers
├── Cinematographers
└── Other Crew
Every person:
Person
 ├── Profile
 ├── Biography
 ├── Credits
 ├── Filmography
 ├── TV Work
 ├── Voice Work
 ├── Directing
 ├── Writing
 ├── Producing
 ├── Related People
 └── Follow
📺 Where to Watch
Should become:
WHERE TO WATCH

Subscription
Free
Free with Ads
Rent
Buy
Broadcast
Official Source
and then:
Region
Provider
Availability Type
Price
Currency
Deep Link
Last Checked
TMDB already exposes movie and TV provider lists with region filtering, which supports this structure. 
🏢 Studios / Production Houses / Networks
Do not call everything a studio.
Use:
Studio
Production Company
Network
Broadcaster
Distributor
Streamer
Publisher
This makes your company database much more accurate.
🔞 Content Advisory / Technical Specs
Split them:
CONTENT ADVISORY
    ↓
Certification
Violence
Gore
Nudity
Sexual Content
Profanity
Substance Use
Frightening Content
Mature Themes
and separately:
TECHNICAL SPECS
    ↓
Resolution
HDR
Codec
Audio
Channels
Aspect Ratio
Frame Rate
Bitrate
Subtitles
This prevents your StreamTelemetryModal from becoming a giant “everything modal.”

6. MOST IMPORTANT SUPABASE SECURITY CHANGE
Your previous structure had things like:
subscription_tier = Premium
I would not use that as the primary authorization mechanism.
Use:
auth.users
   ↓
profiles
   ↓
subscriptions
   ↓
subscription_plans
   ↓
entitlement service
And then:
checkEntitlement()
determines whether a user can use a particular feature/resource.
Supabase's current documentation specifically emphasizes RLS for row-level authorization and notes that grants and RLS work together; service-role credentials must remain server-side. 

7. FINAL HEADER I WOULD ACTUALLY USE
┌──────────────────────────────────────────────────────────────────────────────┐
│ LANTAWON LANG │ Home │ Explore │ Movies │ Shows │ Discover │ Timelines │ Library │
│                                                        Search │ 🌐 PH │ 🔔 │ 👤 │
└──────────────────────────────────────────────────────────────────────────────┘
DISCOVER
Discover
│
├── People
│   ├── Actors
│   ├── Directors
│   ├── Writers
│   └── Creators
│
├── Companies
│   ├── Studios
│   ├── Production Companies
│   ├── Networks
│   └── Broadcasters
│
├── Where to Watch
│   ├── Subscription
│   ├── Free
│   ├── Rent
│   └── Buy
│
├── Collections
│   ├── Franchises
│   ├── Universes
│   ├── Sagas
│   └── Curated
│
└── Browse
    ├── Genres
    ├── Countries
    ├── Languages
    └── Decades
That is much cleaner than placing Actors / Studios / Providers / Genres / Statistics / Achievements as separate top-level tabs.

8. ONE THING I WOULD REMOVE FROM THE OLD BLUEPRINT
I would remove this concept:
“12+ mirrors = premium feature”
and replace it internally with:
SOURCE ADAPTER SYSTEM

Provider A
Provider B
Provider C
Owned Media
Licensed Source
Public-Domain Source
Local Media
Then:
SOURCE RESOLVER
      ↓
ENTITLEMENT
      ↓
REGION
      ↓
QUALITY
      ↓
HEALTH
      ↓
BEST ELIGIBLE SOURCE
That gives you the same engineering concept you wanted—quality-based source selection and failover—without hard-coding the product around unauthorized mirrors.

9. WHAT I WOULD LOCK BEFORE SUPABASE
The most important things to freeze first are:
1. Canonical Content Model
2. External ID Mapping
3. People/Credits Model
4. Companies Model
5. Provider + Availability Model
6. Season/Episode Model
7. User/Auth Model
8. Library Model
9. Watch Progress Model
10. Analytics Events
11. Subscription Model
12. Entitlement Model
13. RLS
14. Search Filter Contract
15. Route Architecture
Once those 15 are stable, the Supabase migration becomes much more controlled instead of simply copying your existing Dexie tables into PostgreSQL. Supabase's PostgreSQL foundation is well suited to this relational structure, and Auth integrates directly with its database and RLS model. 
This is the architecture I would use as the master specification for Lantawon Lang before touching the final Supabase schema.
```
