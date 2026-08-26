# 80. NEXT.JS FEATURE STRUCTURE

Recommended architecture:

src/

app/
  (public)/
  (platform)/
  (auth)/
  (admin)/
  api/

components/
  layout/
  header/
  navigation/
  search/
  content/
  people/
  companies/
  providers/
  player/
  library/
  analytics/
  achievements/
  subscription/

features/
  search/
  catalog/
  people/
  companies/
  availability/
  playback/
  library/
  recommendations/
  analytics/
  subscriptions/
  authentication/
  notifications/

lib/
  api/
  db/
  auth/
  cache/
  taxonomy/
  permissions/
  entitlement/
  ranking/

services/
  metadata/
  availability/
  playback/
  recommendations/
  billing/
  analytics/

supabase/
  migrations/
  functions/
  seed/

types/

81. CURRENT SYSTEM FILE MIGRATION
    Existing:
    ActorProfileModal.tsx
    Keep it.
    Refactor into:
    components/people/ActorProfileModal.tsx
    Existing:
    person/[id]/page.tsx
    Keep concept.
    Move toward:
    app/(platform)/person/[id]/page.tsx
    Existing:
    WhereToWatchHub.tsx
    Keep.
    Refactor:
    components/providers/WhereToWatchHub.tsx
    Existing:
    StreamTelemetryModal.tsx
    Refactor into:
    components/player/PlaybackDiagnostics.tsx
    Existing:
    search-engine.ts
    Keep concept but convert into modular services:
    search-parser
    search-ranker
    search-index
    search-entities
    search-filters
82. DO NOT KEEP ALL LOGIC INSIDE search-engine.ts
    Split:
    search/
    parser.ts
    filters.ts
    ranking.ts
    entity-resolver.ts
    autocomplete.ts
    suggestions.ts
    query-normalizer.ts
83. SEARCH QUERY OBJECT
    Use a normalized object such as:
    {
    query,
    mediaTypes,
    genres,
    subgenres,
    themes,
    countries,
    languages,
    people,
    companies,
    providers,
    availabilityTypes,
    ratingMin,
    yearFrom,
    yearTo,
    month,
    status,
    runtimeMin,
    runtimeMax,
    certification,
    sort,
    page
    }
    This should be the canonical contract between UI and backend.
84. FINAL SEARCH FILTER UI
    Desktop:
    SEARCH BAR
    [Content Type]
    [Genre]
    [Country]
    [Year]
    [Rating]
    [Availability]
    [People]
    [Company]
    [Language]
    [Status]
    [Runtime]
    [Certification]
    [More Filters]
    Sort:
    Best Match
    Mobile:
    Use a bottom-sheet filter drawer.
85. MORE FILTERS
    Advanced filters:
    Original Language
    Spoken Language
    Runtime
    Certification
    Themes
    Keywords
    Production Company
    Network
    Actor
    Director
    Writer
    Provider
    Availability Type
    Quality
    HDR
    Audio
    Collection
    Franchise
    Do not show all filters at once on desktop.
    Use grouped filter panels.
86. MOVIE CARD DESIGN
    Every card can display:
    Poster
    Hover:
    Play / Watch
    Add to List
    Favorite
    Mark Watched
    More Info
    Metadata:
    Title
    Year
    Rating
    Runtime
    Certification
    Optional badges:
    4K
    HDR
    Atmos
    Free
    Subscription
    Rent
    Buy
    Do not overcrowd the card.
87. DETAIL PAGE LAYOUT
    Desktop:
    LEFT:
    Poster
    CENTER:
    Title
    Synopsis
    Metadata
    Actions
    RIGHT:
    Rating
    Certification
    Availability summary
    Below:
    Cast
    Crew
    Genres
    Content Advisory
    Technical Specs
    Where to Watch
    Collections
    Similar Titles
    Recommendations