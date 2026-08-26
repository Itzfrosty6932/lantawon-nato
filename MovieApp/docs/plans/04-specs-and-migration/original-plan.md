
# LANTAWON LANG — ULTIMATE PRODUCT, UX, INFORMATION ARCHITECTURE & SUPABASE BLUEPRINT

## 0. PRODUCT DEFINITION

Lantawon Lang is an all-in-one cinematic discovery, media catalog, watchlist, personalization, legal availability, and playback platform.

It must NOT be designed as a simple movie database.

The application is composed of these major systems:

1. Discovery Engine
2. Global Search Engine
3. Movie Catalog
4. TV Series Catalog
5. Anime Catalog
6. Documentary Catalog
7. Cartoons / Animation Catalog
8. People / Actors / Creators Intelligence
9. Studios / Production Companies / Networks Intelligence
10. Where-to-Watch Availability Hub
11. Content Advisory & Certification System
12. Technical Media Specifications
13. Franchise / Universe / Timeline System
14. Video Playback / Source Engine
15. User Library
16. Watch History
17. Recommendations
18. Taste Analytics
19. Achievements / XP / Gamification
20. Subscription / Billing
21. Account / Settings
22. Notifications
23. Admin / Moderation / Catalog Operations
24. Analytics / Metrics
25. Local Offline Media Vault

The platform should visually feel like a premium streaming application while functioning architecturally as a combination of:

- Movie discovery platform
- Streaming availability tracker
- Personal media library
- Filmography database
- Franchise explorer
- Watch analytics platform
- Personalized recommendation system
- Authorized playback platform

The system must be modular so that metadata providers, streaming providers, payment providers, and playback sources can be replaced without rewriting the application.

---

# 1. GLOBAL PRODUCT RULES

## 1.1 Separate these concepts

DO NOT mix the following:

A. Metadata
B. Availability
C. Playback
D. User ownership
E. Subscription entitlement

Example:

A movie existing in the catalog does NOT automatically mean:

- the movie is playable
- the movie is available in the user's country
- the user has access to it
- Lantawon Lang has rights to stream it

Therefore:

CONTENT CATALOG != WATCH AVAILABILITY != PLAYBACK ENTITLEMENT

---

# 2. HEADER ARCHITECTURE

The desktop header should have 3 zones.

## LEFT

[ LANTAWON LANG LOGO ]

Clicking logo:

/

---

# 3. PRIMARY HEADER NAVIGATION

Use only a small number of primary navigation items.

Recommended:

1. HOME
2. EXPLORE
3. MOVIES
4. SHOWS
5. DISCOVER
6. TIMELINES
7. MY LIBRARY

Do NOT put every feature directly in the header.

People, Studios, Providers, Collections, Genres, and other discovery functions should be grouped under DISCOVER.

---

# 4. HEADER NAVIGATION — COMPLETE BREAKDOWN

## 4.1 HOME

Route:

/

Sections:

### Hero Spotlight

Dynamic featured content.

Contains:

- Backdrop
- Poster
- Title
- Media type
- Release year
- Certification
- Rating
- Genre
- Runtime
- Short synopsis
- Watch button
- Trailer button
- Add to List
- More Info

### Continue Watching

Personalized.

Contains:

- Poster/backdrop
- Progress bar
- Current season
- Current episode
- Resume timestamp
- Continue button
- Remove button

Only visible when user has history.

### Trending Today

Dynamic ranking.

### Trending This Week

Dynamic ranking.

### Popular Movies

### Popular Series

### Popular Anime

### Popular Documentaries

### Recently Released

### Recently Added To Catalog

### Top Rated

### Free / Legal Watch Options

### Critically Acclaimed

### Recommended For You

### Because You Watched...

### From Your Favorite Genres

### Your Watchlist

### Your Unfinished Movies

### Your Unfinished Series

### Continue Your Franchise

### Featured Collections

Examples of collection types:

- Award Winners
- Horror Collection
- Sci-Fi Collection
- Animation Collection
- Family Collection
- Classic Cinema
- Asian Cinema
- Documentary Collection
- Seasonal Collection
- Decade Collections

---

# 5. EXPLORE

Route:

/discover

This is the primary universal catalog search page.

The page must contain:

## Search Bar

Supports:

- Movie title
- TV title
- Anime title
- Actor
- Director
- Writer
- Producer
- Studio
- Network
- Genre
- Keyword
- Country
- Provider

Example query interpretation:

"science fiction movies from japan"

should become:

media_type = movie
genre = science_fiction
country = japan

Example:

"movies with [person]"

should search PEOPLE + FILMOGRAPHY.

Example:

"movies from [studio/company]"

should search COMPANY CATALOG.

---

# 6. EXPLORE FILTER SYSTEM

Replace the current filter design with a structured filter architecture.

## A. CONTENT TYPE

Use:

- All
- Movies
- TV Shows
- TV Episodes
- Anime
- Anime Episodes
- Cartoons
- Documentaries
- Specials
- Short Films

Do not make "Series" the only TV distinction.

Internally use:

media_type

Allowed values:

movie
tv
episode
anime
anime_episode
cartoon
documentary
special
short

---

# 7. B. GENRE SYSTEM

Do NOT use one gigantic flat genre list.

Use hierarchical taxonomies.

## Core Genres

- Action
- Adventure
- Animation
- Comedy
- Crime
- Documentary
- Drama
- Family
- Fantasy
- History
- Horror
- Music
- Mystery
- Romance
- Science Fiction
- Thriller
- War
- Western
- Reality
- TV Movie

## Anime / Japanese Taxonomy

- Boys Love
- Girls Love
- CGDCT
- Ecchi
- Harem
- Isekai
- Iyashikei
- Josei
- Kids
- Mahou Shoujo
- Martial Arts
- Mecha
- Military
- Otaku Culture
- Parody
- Performing Arts
- Psychological
- Reincarnation
- School
- Seinen
- Shoujo
- Shounen
- Slice of Life
- Sports
- Super Power
- Supernatural
- Time Travel
- Villainess

## Content Tone / Theme

- Dark
- Lighthearted
- Feel-Good
- Gritty
- Intense
- Emotional
- Suspenseful
- Experimental
- Avant-Garde
- Gore
- Mythology
- Organized Crime
- Urban Fantasy
- Visual Arts
- Survival

Important:

DO NOT store all of these as one database enum.

Separate:

genres
subgenres
themes
keywords
content_tags

This prevents taxonomy corruption.

---

# 8. C. RATING FILTER

Current:

+10.0 > 1.0

Improve this.

Use:

## User Rating

- 9.0+
- 8.5+
- 8.0+
- 7.5+
- 7.0+
- 6.0+
- 5.0+
- Any

Then allow:

Rating Source:

- Platform Rating
- External Rating
- Popular Rating
- Critic Rating
- User Rating

If external ratings are used, store source separately.

Never merge different rating systems into one misleading number.

---

# 9. D. COUNTRY / REGION FILTER

Use normalized countries.

Primary:

- Worldwide
- United States
- Japan
- South Korea
- China
- United Kingdom
- France
- India
- Philippines
- Italy
- Spain
- Germany
- Mexico
- Brazil
- Thailand
- Taiwan
- Hong Kong

Also support:

- Country Search
- Multi-country selection
- Production country
- Origin country
- Filming country

Do NOT use flag symbols as the actual database key.

Use ISO country codes internally.

Example:

PH
US
JP
KR
CN
GB
FR
IN

---

# 10. E. SORTING

Recommended:

## Relevance

- Best Match

## Popularity

- Popularity: High → Low
- Popularity: Low → High

## Rating

- Rating: High → Low
- Rating: Low → High

## Release

- Newest First
- Oldest First

## Title

- A → Z
- Z → A

## Engagement

- Most Watched
- Most Added
- Most Completed
- Most Favorited

## Metadata

- Most Votes
- Highest Revenue

Revenue should only be shown when the source provides it.

---

# 11. F. DATE FILTER

Use:

## Year

- Any
- Custom year range
- Single year

## Month

- Any
- January
- February
- March
- April
- May
- June
- July
- August
- September
- October
- November
- December

## Custom Date Range

From:
To:

Support both:

release_date
first_air_date

For TV:

first_air_date
last_air_date

Do NOT force movies and TV into one date field.

---

# 12. G. STATUS FILTER

Show only where status makes sense.

For Movies:

- Released
- Upcoming
- Post Production
- Planned
- Canceled

For TV:

- Returning Series
- In Production
- Ended
- Canceled
- Planned

Do not display "Returning Series" for movies.

---

# 13. ADDITIONAL SEARCH FILTERS

The new search engine should support:

## Runtime

- Under 30 min
- 30–60 min
- 60–90 min
- 90–120 min
- 120+ min

## Language

- English
- Japanese
- Korean
- Mandarin
- Cantonese
- Filipino
- Spanish
- French
- German
- Hindi
- Thai
- etc.

Use language codes internally.

## Original Language

Separate from spoken-language availability.

## People

- Actor
- Director
- Writer
- Producer
- Composer
- Cinematographer

## Studio / Company

Search by production company.

## Network

Search by broadcaster / network.

## Provider

Where currently available.

## Availability Type

- Subscription
- Free
- Free with Ads
- Rent
- Buy
- Broadcast
- Official YouTube
- Public Domain
- User-Owned Local Media

## Quality

Only for known source metadata:

- 480p
- 720p
- 1080p
- 1440p
- 2160p / 4K

## HDR

- HDR
- HDR10
- HDR10+
- Dolby Vision

## Audio

- Stereo
- 5.1
- 7.1
- Atmos

## Content Certification

- G
- PG
- PG-13
- R
- NC-17
- TV-Y
- TV-Y7
- TV-G
- TV-PG
- TV-14
- TV-MA
- Unrated
- Region-specific equivalents

## Advisory

- Violence
- Gore
- Strong Language
- Sexual Content
- Nudity
- Substance Use
- Frightening Scenes
- Self-Harm Themes
- Mature Themes

Advisory should be separate from certification.

---

# 14. GLOBAL SEARCH RESULTS PAGE

Route:

/search

Search results should be divided into entity sections.

## Section 1 — Top Result

Best matching title/person/company.

## Section 2 — Movies

## Section 3 — TV Shows

## Section 4 — Anime

## Section 5 — People

## Section 6 — Studios

## Section 7 — Networks

## Section 8 — Collections

## Section 9 — Keywords / Themes

Each result should display:

- Poster/profile
- Title/name
- Type
- Year
- Rating
- Region
- Short metadata
- Match score

---

# 15. DISCOVER MEGA-MENU

Inside DISCOVER:

## Movies & Shows

- All Movies
- All Shows
- Anime
- Cartoons
- Documentaries
- Specials

## People

- Actors
- Directors
- Writers
- Producers
- Creators
- Composers
- Cinematographers

## Companies

- Studios
- Production Companies
- Networks
- Broadcasters
- Distributors

## Watch Availability

- Where to Watch
- Subscription
- Free
- Rent
- Buy

## Collections

- Genres
- Themes
- Franchises
- Universes
- Decades
- Countries

---

# 16. MOVIES

Route:

/movies

Sections:

- Featured Movies
- New Releases
- Popular Movies
- Top Rated
- Most Watched
- Most Added
- Award Collections
- Genre Shelves
- Decade Shelves
- Country Shelves
- Language Shelves
- Free / Legal Availability
- Recently Added

View modes:

- Poster Grid
- Dense Grid
- List
- Compact List

---

# 17. SHOWS

Route:

/shows

Sections:

- Popular Series
- Airing Now
- Returning Series
- Completed Series
- New Series
- Top Rated
- Most Watched
- Trending
- Most Added
- Genre Shelves
- Country Shelves
- Network Shelves

TV metadata must include:

- seasons
- episodes
- episode air dates
- season count
- episode count
- episode runtime
- episode ratings
- current status

---

# 18. ANIME

Route:

/anime

Sections:

- Trending Anime
- Seasonal Anime
- Completed Anime
- Ongoing Anime
- Top Rated
- Popular
- New Releases
- Genre
- Demographic
- Studio
- Season
- Year

Anime should be treated as an application-level classification layer.

Do not duplicate the entire TV database just because something is anime.

---

# 19. DOCUMENTARIES

Route:

/documentaries

Sections:

- Featured
- Popular
- History
- Nature
- Science
- Crime
- Biography
- Sports
- Politics / Society
- Music
- Technology
- True Story
- Short Documentary

---

# 20. PEOPLE / ACTORS / CREATORS

Route:

/people

This is a first-class search system.

Sections:

- Trending People
- Popular Actors
- Popular Directors
- Popular Writers
- Popular Creators
- Recently Trending
- Most Followed

Search:

- Name
- Department
- Known For
- Country
- Gender where legally/publicly available and appropriate
- Birth Year
- Known Department

---

# 21. PERSON PROFILE

Route:

/person/[id]

Sections:

## Profile Header

- Display Name
- Profile Image
- Known For
- Primary Department
- Biography
- Birth Date
- Birth Place
- Nationality/origin where source provides it

## Tabs

### Overview

### Filmography

### Television

### Animation / Voice

### Writing

### Directing

### Producing

### Awards

### Related People

Filmography cards:

- Poster
- Title
- Year
- Role
- Character
- Rating
- Media Type
- Status
- Availability
- Watch / Details button

Do not place every person attribute in a single database row.

Use person + credits + jobs.

---

# 22. STUDIOS / PRODUCTION COMPANIES / NETWORKS

Route:

/studios

Subsections:

- Studios
- Production Companies
- Networks
- Broadcasters
- Distributors

Search:

- Company name
- Country
- Type

Company profile:

/company/[id]

Sections:

## Header

- Company name
- Logo
- Country
- Founded
- Type

## Catalog

- Movies
- Series
- Anime
- Documentaries

## Relationships

- Parent Company
- Subsidiaries
- Networks
- Distribution relationships

Do NOT assume every company is a "studio."

Use:

company_type

Examples:

production_company
studio
network
broadcaster
distributor
publisher
streamer

---

# 23. WHERE TO WATCH

This is a MAJOR DISCOVERY FEATURE.

Route:

/where-to-watch

Or:

/watch/[content-id] → Availability section

The system must distinguish:

## Subscription

- Subscription/Flatrate

## Free

- Free
- Free with Ads

## Rental

- Digital Rental

## Purchase

- Digital Purchase

## Broadcast

- TV / Network

## Official Digital Source

- Official service

Each provider record must contain:

- provider_id
- provider_name
- provider_logo
- region
- availability_type
- deep_link
- last_checked_at
- source
- confidence

The application should NEVER imply that Lantawon Lang owns a provider's content simply because it links to that provider.

---

# 24. REGION SYSTEM

Default:

PH

Allow the user to change:

- Philippines
- United States
- Japan
- South Korea
- United Kingdom
- Canada
- Australia
- France
- Germany
- Spain
- Italy
- India
- Thailand
- Taiwan
- Hong Kong
- Brazil
- Mexico

Database field:

country_code CHAR(2)

Use ISO codes.

---

# 25. MOVIE / SHOW DETAIL PAGE

Route:

/title/[id]

Use one unified content-detail architecture.

Sections:

## Hero

- Backdrop
- Poster
- Title
- Alternative Titles
- Year
- Runtime
- Certification
- Rating
- Genres
- Country
- Language
- Synopsis

Buttons:

- Watch
- Trailer
- Add to Watchlist
- Favorite
- Mark as Watched
- Share

## Metadata

- Release Date
- First Air Date
- Last Air Date
- Runtime
- Seasons
- Episodes
- Original Language
- Production Countries

## Cast

Horizontal carousel.

## Crew

- Director
- Writer
- Producer
- Composer
- Cinematographer
- Editor

## Where to Watch

Subscription
Free
Rent
Buy

## Content Advisory

Certification
Violence
Language
Nudity
Sexual Content
Substances
Scary Scenes
Other Mature Themes

## Technical Specifications

- Resolution
- HDR
- Aspect Ratio
- Frame Rate
- Audio
- Subtitles
- Source availability

Only show technical values if verified.

Do not invent technical metadata.

## Collections

- Franchise
- Saga
- Collection
- Universe

## Similar

- Similar titles
- More Like This
- Same genre
- Same actors
- Same director
- Same company
- Same franchise

---

# 26. TV SHOW DETAIL PAGE

Additional:

## Seasons

Season tabs.

## Episodes

Episode card:

- Episode number
- Episode title
- Thumbnail
- Synopsis
- Runtime
- Air date
- Rating
- Watched state
- Progress

## Episode Availability

Per-episode provider information when available.

---

# 27. FRANCHISE / TIMELINE

Route:

/timelines

Sections:

- Popular Franchises
- Cinematic Universes
- Shared Universes
- Sagas
- Collections

Timeline page:

/timeline/[id]

Modes:

## Release Order

## Chronological Order

## Recommended Order

## Completion Progress

Each entry:

- Title
- Release date
- Story date if verified
- Position
- Status
- Watched state

Do not invent canonical chronology.

Store:

timeline_order_type

---

# 28. MY LIBRARY

Route:

/library

Sections:

## Continue Watching

## Watchlist

## Favorites

## Recently Watched

## Unfinished

## Completed

## My Playlists

## My Collections

## Downloads / Local Media

## Followed People

## Followed Companies

## Saved Searches

---

# 29. USER LIBRARY MODEL

Do not use one table with a vague "library_type" if the application becomes large.

Use:

user_watchlist
user_favorites
user_playlist
user_playlist_items
user_followed_people
user_followed_companies
user_saved_searches

This produces clearer relationships.

---

# 30. WATCH HISTORY

Use event-based history instead of only one row.

## watch_sessions

Fields:

- id
- user_id
- content_id
- episode_id nullable
- started_at
- ended_at
- progress_seconds
- duration_seconds
- completion_percentage
- source_id
- device_id nullable
- created_at

Keep a summary table:

## watch_progress

- user_id
- content_id
- episode_id
- progress_seconds
- completion_percentage
- last_watched_at
- completed_at

This allows both analytics and fast resume.

---

# 31. VIDEO PLAYER

Route:

/watch/[id]

The player should be a SOURCE-AGNOSTIC playback layer.

Architecture:

Player
→ Entitlement Check
→ Source Resolver
→ Source Ranking
→ Health Check
→ Playback Adapter
→ Player

Source Ranking should evaluate:

1. User entitlement
2. Legal authorization
3. Availability
4. Region
5. Resolution
6. Codec compatibility
7. Audio compatibility
8. Subtitle availability
9. Latency
10. Reliability

"Quality over quantity" means:

BEST ELIGIBLE SOURCE

not:

MOST SOURCES

---

# 32. VIDEO SOURCE TABLE

Each source should have:

- id
- content_id
- episode_id
- source_type
- provider_id
- playback_url
- manifest_url
- quality
- codec
- audio_type
- subtitle_support
- region
- authorization_status
- availability_start
- availability_end
- priority
- health_status
- last_health_check

Source types:

- owned
- licensed
- public_domain
- user_local
- provider_link
- external_authorized

Never assume an arbitrary embedded stream is authorized.

---

# 33. PLAYER FEATURES

## Playback

- Play
- Pause
- Seek
- Speed
- Volume
- Fullscreen
- Picture in Picture
- Subtitle
- Audio Track

## Player Information

- Resolution
- Source
- Buffer state
- Playback latency where measurable
- Subtitle track

## Episode Features

- Previous episode
- Next episode
- Season selector
- Episode list
- Auto-play next episode

## User Features

- Resume
- Watch progress
- Mark watched
- Continue watching

---

# 34. LOCAL MEDIA VAULT

Route:

/library/local

This should be separated from online streaming.

Features:

- Scan local folder
- Match filename
- Correct metadata match
- Local poster
- Local watch progress
- Local subtitles
- Offline playback

Architecture:

Local File
→ Filename Parser
→ Metadata Matcher
→ User Confirmation
→ Local Media Record
→ Local Player

Do not upload local files automatically.

---

# 35. ACCOUNT MENU

Header right side:

## Search

## Notifications

## Subscription

## User Avatar

Dropdown:

- Profile
- My Library
- Statistics
- Achievements
- Preferences
- Playback Settings
- Content Preferences
- Region
- Privacy
- Devices
- Subscription
- Billing
- Security
- Logout

---

# 36. REGION SWITCHER

Header utility.

Example:

🌐 PH

Dropdown:

Country selector.

This should affect:

- Where to Watch
- Provider availability
- Language preferences
- Some content availability
- Regional certification

It must NOT be used to bypass licensing restrictions.

---

# 37. CONTENT PREFERENCES

User can configure:

## Preferred Languages

## Preferred Genres

## Preferred Content Types

## Preferred Quality

## Subtitle Language

## Audio Language

## Content Advisory Preferences

## Auto-play

## Auto-next

## Autoplay trailers

## Reduce motion

## Data saver

---

# 38. PARENTAL / CONTENT FILTER MODEL

Do not implement only:

"hide R"

Use:

profile content policy.

Fields:

- maximum_certification
- allow_mature_content
- hide_violence
- hide_gore
- hide_nudity
- hide_strong_language
- hide_substance_use
- hide_frightening_content

This system should be enforced at query time, not only hidden visually.

---

# 39. STATISTICS

Route:

/statistics

Sections:

## Overview

- Total Watch Time
- Movies Watched
- Shows Watched
- Episodes Watched
- Completed Titles
- Completion Rate

## Watch Pattern

- Movies vs Series
- Weekday vs Weekend
- Morning / Afternoon / Evening / Night

## Genre Profile

- Top Genres
- Top Themes

## Geography

- Most watched origins

## People

- Most watched actors
- Most watched directors

## Companies

- Most watched studios
- Most watched networks

## Decades

- Most watched decade

## Languages

- Most watched language

## Quality

- Most watched resolution

---

# 40. WATCH PERSONA

Do not hard-code a person's identity.

Calculate persona from behavior.

Examples:

- Completionist
- Explorer
- Cinephile
- Marathoner
- Genre Specialist
- Franchise Hunter
- Rewatcher
- Casual Viewer

Store:

persona_code
confidence
calculated_at

---

# 41. ACHIEVEMENTS

Route:

/achievements

Categories:

## Watching

## Completion

## Discovery

## Franchise

## Genre

## Anime

## Documentary

## Social / Library

## Streaks

Each achievement:

- id
- name
- description
- icon
- category
- XP reward
- criteria
- tier
- hidden
- enabled

Do NOT store achievements as hard-coded user strings.

---

# 42. XP SYSTEM

Use:

user_xp

Fields:

- user_id
- total_xp
- current_level
- updated_at

XP events:

- title_completed
- series_completed
- franchise_completed
- playlist_created
- watchlist_milestone
- discovery_milestone
- streak_milestone

Create:

xp_events

instead of only incrementing total_xp blindly.

This provides an audit trail.

---

# 43. RECOMMENDATION ENGINE

Do NOT immediately build a heavy AI recommendation system.

Start with explainable rules.

Signals:

- watched genre
- completion
- rating
- watch frequency
- actor affinity
- director affinity
- studio affinity
- country affinity
- language affinity
- franchise affinity
- recency
- rewatch frequency

Recommendation reasons:

"Because you watched..."
"Because you like..."
"Trending in your region"
"Popular among users with similar taste"
"From your favorite studio"
"More from this creator"

---

# 44. DISCOVERY / CATALOG DATABASE STRATEGY

Do not blindly copy every external metadata record into Supabase.

Use a layered model.

## External Metadata Layer

External API source.

Examples:

TMDB or another metadata provider.

Stores:

- external ID
- source
- last fetched
- source payload hash

## Internal Canonical Catalog

Your application's normalized content identity.

This is the most important database layer.

A title should have:

internal_content_id

Then external IDs map into it.

Example:

content_external_ids

- content_id
- provider
- external_id

This prevents your entire application from being permanently coupled to one API.

---

# 45. WHAT MOVIES / CONTENT SHOULD EXIST IN THE DATABASE?

The catalog should support:

## Movies

- Feature films
- TV movies
- Short films where supported

## TV

- Series
- Seasons
- Episodes
- Specials

## Anime

Stored using the same underlying content model.

Classification can be:

medium = anime

## Cartoons

Classification:

medium = cartoon

## Documentaries

Classification:

genre/type classification

## Specials

Standalone special content.

## Future expansion

- Live events
- Concert films
- Web series
- Educational content
- Public-domain cinema
- User-owned local media

Do not create separate databases for every category.

Use a common Content Model.

---

# 46. CORE CONTENT MODEL

## content

Fields:

- id UUID
- content_type
- title
- original_title
- original_language
- synopsis
- release_date
- first_air_date
- last_air_date
- runtime_minutes
- certification
- status
- popularity_score
- vote_average
- vote_count
- revenue
- adult_flag
- poster_path
- backdrop_path
- trailer_url
- metadata_source
- metadata_source_id
- created_at
- updated_at

For fields that apply only to certain media types, allow NULL.

---

# 47. CONTENT RELATIONSHIPS

## content_genres

content_id
genre_id

## content_keywords

content_id
keyword_id

## content_countries

content_id
country_code

## content_languages

content_id
language_code

## content_companies

content_id
company_id

## content_networks

content_id
network_id

## content_collections

content_id
collection_id

## content_people

content_id
person_id
department
job
character_name
credit_order

---

# 48. PEOPLE DATABASE

## people

- id
- external_id
- display_name
- profile_path
- biography
- birthday
- deathday
- birthplace
- known_for_department
- source
- updated_at

## person_aliases

- person_id
- alias
- language

## person_credits

- person_id
- content_id
- department
- job
- character_name
- order

This produces the filmography system.

---

# 49. COMPANY DATABASE

## companies

- id
- external_id
- name
- logo_path
- country_code
- company_type
- parent_company_id
- description
- website
- updated_at

Types:

- studio
- production_company
- network
- broadcaster
- distributor
- streamer
- publisher

---

# 50. PROVIDERS DATABASE

Separate a "provider" from "company".

## providers

- id
- name
- logo
- website
- provider_type

## provider_regions

- provider_id
- country_code

## content_availability

- content_id
- episode_id nullable
- provider_id
- country_code
- availability_type
- deep_link
- price nullable
- currency nullable
- last_checked_at

Availability type:

- subscription
- free
- free_with_ads
- rent
- buy
- broadcast
- official_source

---

# 51. SUBSCRIPTION ARCHITECTURE

Do NOT store only:

subscription_tier = Premium

Use proper subscription entities.

## subscription_plans

- id
- code
- name
- description
- monthly_price
- yearly_price
- currency
- active

## subscription_features

- plan_id
- feature_code
- feature_value

## subscriptions

- id
- user_id
- plan_id
- provider
- external_subscription_id
- status
- current_period_start
- current_period_end
- cancel_at_period_end
- created_at
- updated_at

Statuses:

- trialing
- active
- past_due
- canceled
- incomplete
- expired

---

# 52. ENTITLEMENT ENGINE

Create a unified service:

checkEntitlement(user, resource)

Possible results:

- allowed
- requires_login
- requires_subscription
- unavailable_region
- unavailable_source
- unavailable_time
- unavailable_content

Do NOT put subscription logic directly inside every React component.

Centralize entitlement checks.

---

# 53. USER DATABASE

Use Supabase Auth for identity.

DO NOT duplicate password/authentication data.

Supabase Auth manages authentication.

Your application table stores profile/business information.

## profiles

- id = auth.users.id
- username
- display_name
- avatar_url
- bio
- country_code
- timezone
- created_at
- updated_at

Supabase Auth supports common authentication methods and integrates with PostgreSQL/RLS. :contentReference[oaicite:2]{index=2}

---

# 54. USER SETTINGS

## user_settings

- user_id
- theme
- autoplay
- auto_next
- subtitle_language
- audio_language
- preferred_quality
- data_saver
- reduce_motion
- preferred_region

---

# 55. USER WATCHLIST

## user_watchlist

- id
- user_id
- content_id
- created_at
- priority

Unique:

(user_id, content_id)

---

# 56. USER FAVORITES

## user_favorites

- id
- user_id
- content_id
- created_at

Unique:

(user_id, content_id)

---

# 57. PLAYLIST SYSTEM

## playlists

- id
- user_id
- name
- description
- visibility
- created_at
- updated_at

## playlist_items

- playlist_id
- content_id
- position
- added_at

---

# 58. FOLLOWING SYSTEM

## user_followed_people

- user_id
- person_id
- created_at

## user_followed_companies

- user_id
- company_id
- created_at

## user_followed_collections

- user_id
- collection_id
- created_at

---

# 59. SAVED SEARCH

## saved_searches

- id
- user_id
- name
- query
- filters_json
- created_at
- updated_at

Example:

"2020s Japanese horror"

saved as structured filters.

---

# 60. NOTIFICATIONS

## notifications

- id
- user_id
- notification_type
- title
- body
- entity_type
- entity_id
- read_at
- created_at

Examples:

- New episode
- New movie from followed creator
- New availability
- Subscription event
- Achievement unlocked
- Recommendation

---

# 61. DEVICES

## user_devices

- id
- user_id
- device_name
- device_type
- platform
- last_active_at
- created_at

Use this for:

- playback resume
- account management
- security
- device sessions

---

# 62. ANALYTICS DATABASE

Do not store all analytics in one JSONB column.

Use events.

## analytics_events

- id
- user_id nullable
- event_type
- entity_type
- entity_id
- metadata JSONB
- occurred_at
- session_id
- device_id

Example:

event_type:

- search
- title_opened
- watch_started
- watch_completed
- watchlisted
- favorited
- provider_clicked
- trailer_played
- playlist_created

Then derive statistics.

---

# 63. SEARCH INDEX ARCHITECTURE

Search must index:

- Titles
- Alternative titles
- People
- Companies
- Genres
- Keywords
- Collections

Search ranking:

1. Exact title match
2. Exact person match
3. Prefix match
4. Title relevance
5. Popularity
6. User preference
7. Region availability

---

# 64. SEARCH RESULT ENTITY TYPES

Your search engine should return:

TITLE
PERSON
COMPANY
NETWORK
GENRE
KEYWORD
COLLECTION
PROVIDER

Each result needs:

- entity_type
- entity_id
- display_name
- subtitle
- image
- score
- route

---

# 65. DATA SOURCE REGISTRY

Create:

## metadata_sources

- id
- name
- source_type
- api_base_url
- enabled
- rate_limit_policy
- last_sync_at

Source types:

- metadata
- availability
- ratings
- images
- trailers

Do not hard-code one API into every service.

---

# 66. SYNC ENGINE

Architecture:

External API
→ Provider Adapter
→ Normalizer
→ Validator
→ Canonical Catalog
→ Database
→ Search Index

For every imported object keep:

- external source
- external ID
- fetched_at
- checksum/hash
- raw payload where appropriate
- normalized record

This makes provider replacement possible.

---

# 67. CACHE STRATEGY

Do NOT call the external metadata API on every frontend request.

Use:

Browser cache
→ Next.js cache
→ Server cache
→ Supabase canonical data
→ External provider API

Refresh based on content type.

Example:

Trending:
short cache

Movie detail:
longer cache

People:
long cache

Provider availability:
short cache

---

# 68. DATABASE RELATIONSHIP MAP

MAIN:

auth.users
    ↓
profiles
    ↓
user_settings

CONTENT:

content
    ├── content_genres
    ├── content_keywords
    ├── content_countries
    ├── content_languages
    ├── content_companies
    ├── content_networks
    ├── content_people
    ├── content_collections
    ├── content_external_ids
    └── content_availability

PEOPLE:

people
    ├── person_aliases
    └── person_credits

COMPANIES:

companies
    └── company relationships

TV:

content
    ├── seasons
    └── episodes

USER:

profiles
    ├── user_watchlist
    ├── user_favorites
    ├── playlists
    ├── watch_sessions
    ├── watch_progress
    ├── achievements
    ├── xp_events
    ├── user_followed_people
    ├── user_followed_companies
    ├── saved_searches
    ├── user_devices
    ├── subscriptions
    └── analytics_events

---

# 69. TV DATABASE MODEL

Do not create a separate giant "series database."

Use:

content
    ↓
seasons
    ↓
episodes

## seasons

- id
- content_id
- season_number
- name
- overview
- poster_path
- air_date
- episode_count

## episodes

- id
- content_id
- season_id
- episode_number
- name
- overview
- air_date
- runtime
- still_path
- vote_average
- vote_count

---

# 70. CONTENT IDENTITY

Every internal title gets:

content.id

External mapping:

content_external_ids

Example:

content_id
source
external_id

Possible sources:

tmdb
other_metadata_provider
internal
manual

This is CRITICAL.

Never use external IDs as your only primary keys.

---

# 71. ADMIN SYSTEM

Route:

/admin

Sections:

## Dashboard

- Total Users
- Active Users
- Subscribers
- Watch Sessions
- Top Titles
- Provider Clicks
- Search Queries

## Catalog

- Content
- People
- Companies
- Providers
- Collections

## Moderation

- Reports
- Broken Metadata
- Duplicate Titles
- Incorrect Credits

## Playback

- Sources
- Source Health
- Error Rates
- Availability

## Billing

- Plans
- Subscriptions
- Transactions
- Refunds
- Failed Payments

## Users

- Profiles
- Subscription state
- Devices
- Security events

---

# 72. ADMIN ROLES

Use:

- user
- moderator
- editor
- analyst
- admin
- super_admin

Do not trust a frontend "isAdmin" flag.

Authorization must be enforced server-side/database-side.

---

# 73. SUPABASE RLS

Enable RLS for user-owned tables.

Minimum protected tables:

- profiles
- user_settings
- user_watchlist
- user_favorites
- playlists
- playlist_items
- watch_sessions
- watch_progress
- user_followed_people
- user_followed_companies
- saved_searches
- notifications
- user_devices
- analytics_events
- subscriptions

Policy concept:

auth.uid() = user_id

For child tables, enforce ownership through the parent relationship.

Supabase explicitly recommends RLS for granular row-level authorization, and grants plus policies should both be considered. :contentReference[oaicite:3]{index=3}

Never expose a service-role key to the browser.

---

# 74. PUBLIC VS PRIVATE DATA

PUBLIC:

- content metadata
- public ratings
- public cast
- public companies
- public genres
- public provider availability
- public collections

PRIVATE:

- watch history
- watch progress
- subscription
- billing
- personal analytics
- playlists if private
- preferences
- devices
- saved searches

---

# 75. SUBSCRIPTION UI

Create:

/pricing

Plans should describe actual product features.

Example:

## Free

- Catalog browsing
- Search
- Watchlist
- Personal library
- Legal availability links
- Basic statistics

## Premium

- Advanced analytics
- Advanced personalization
- Enhanced library tools
- Additional supported playback features
- Enhanced cross-device sync
- Premium application features

Do NOT market unauthorized movie access as the paid feature.

---

# 76. BILLING FLOW

User
→ Pricing
→ Checkout
→ Payment Provider
→ Webhook
→ Subscription Record
→ Entitlement Engine
→ UI Update

Never trust the browser to say:

"subscription = premium"

The server/database must determine entitlement.

---

# 77. HEADER FINAL DESIGN

DESKTOP:

[LOGO]
Home
Explore
Movies
Shows
Discover
Timelines
My Library

                     [ Search ]
                     [ Globe ]
                     [ Notifications ]
                     [ Avatar ]

MOBILE:

[Logo]    [Search] [Profile/Menu]

Drawer:

Home
Explore
Movies
Shows
Anime
Documentaries
Timelines
My Library
People
Studios
Where to Watch
Collections
Statistics
Achievements
Settings
Subscription

---

# 78. WHAT SHOULD NOT BE IN THE PRIMARY HEADER

Do NOT make these primary header tabs:

- Actors
- Directors
- Studios
- Networks
- Genres
- Providers
- Achievements
- Statistics
- Settings
- Subscription
- Notifications

These belong under Discover or Account.

---

# 79. PAGE ROUTE ARCHITECTURE

/

 /discover
 /search

 /movies
 /shows
 /anime
 /documentaries
 /cartoons

 /title/[id]
 /show/[id]
 /episode/[id]

 /person/[id]

 /people

 /company/[id]
 /studios
 /networks

 /where-to-watch
 /providers/[id]

 /collections
 /collection/[id]

 /timelines
 /timeline/[id]

 /library
 /library/watchlist
 /library/favorites
 /library/playlists
 /library/history
 /library/local

 /watch/[id]
 /watch/[id]/season/[season]
 /watch/[id]/episode/[episode]

 /statistics
 /achievements

 /pricing
 /account
 /account/profile
 /account/settings
 /account/subscription
 /account/devices
 /account/privacy

 /admin

---

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
88. DATABASE QUALITY RULES
    Every external record must have:
    source
    external_id
    fetched_at
    updated_at
    Every relationship must have:
    foreign key
    unique constraint where appropriate
    Every user-owned record must have:
    user_id
    Every sensitive user table must have:
    RLS
    Every payment/subscription record must have:
    external provider reference
    server-side verification
89. DUPLICATE PREVENTION
    Create uniqueness rules such as:
    content_external_ids:
    UNIQUE(source, external_id)
    user_watchlist:
    UNIQUE(user_id, content_id)
    user_favorites:
    UNIQUE(user_id, content_id)
    user_followed_people:
    UNIQUE(user_id, person_id)
    user_followed_companies:
    UNIQUE(user_id, company_id)
90. INDEXING
    Important database indexes:
    content:
    release_date
    popularity_score
    vote_average
    content_type
    status
    content_external_ids:
    source
    external_id
    content_people:
    person_id
    content_id
    content_companies:
    company_id
    content_id
    content_availability:
    country_code
    provider_id
    availability_type
    content_id
    watch_progress:
    user_id
    last_watched_at
    analytics_events:
    user_id
    event_type
    occurred_at
91. SOFT DELETES / DATA LIFECYCLE
    For catalog records:
    Do not immediately delete.
    Use:
    is_active
    archived_at
    For user data:
    Use actual deletion according to account deletion requirements.
92. AUDIT LOG
    Create:
    audit_logs
    Fields:
    id
    actor_user_id
    action
    entity_type
    entity_id
    old_data
    new_data
    created_at
    Actions:
    catalog_updated
    content_removed
    subscription_changed
    admin_login
    user_banned
    source_disabled
93. CONTENT AVAILABILITY REFRESH
    Provider availability is time-sensitive.
    Store:
    last_checked_at
    Use jobs:
    refresh popular titles frequently
    refresh less popular titles less frequently
    refresh when user opens the title
    refresh when region changes
    Never assume provider availability is permanent.
94. PROVIDER CLICK TRACKING
    If the user clicks:
    "Watch on provider"
    create analytics event:
    provider_clicked
    Track:
    provider
    content
    region
    user
    timestamp
    This provides useful product analytics without pretending that the external provider is your own playback source.
95. DATA MODEL FOR TECHNICAL SPECS
    Create:
    content_media_specs
    Fields:
    content_id
    source_id nullable
    resolution
    width
    height
    hdr_type
    codec
    audio_codec
    audio_channels
    aspect_ratio
    frame_rate
    bitrate
    subtitle_support
    Important:
    Technical specs should be tied to an actual source/version when possible.
    Do not say a movie is automatically "4K" just because one provider has a 4K version.
96. CONTENT ADVISORY MODEL
    Create:
    content_advisories
    Fields:
    content_id
    advisory_type
    severity
    source
    notes
    Types:
    violence
    gore
    nudity
    sexual_content
    profanity
    substance_use
    frightening_content
    mature_themes
    Use:
    severity = none / mild / moderate / severe
97. COLLECTION MODEL
    Create:
    collections
    id
    name
    description
    poster_path
    backdrop_path
    collection_type
    Types:
    franchise
    universe
    saga
    editorial
    genre_collection
    decade
    country
    seasonal
    Then:
    collection_items
    collection_id
    content_id
    position
    relationship_type
98. USER EXPERIENCE PRINCIPLE
    The platform should answer these questions immediately:
    1.What should I watch?
    2.Where can I watch it?
    3.Is it free or paid?
    4.Who is in it?
    5.Who created it?
    6.What else did they make?
    7.Is it part of a franchise?
    8.Is it appropriate for me?
    9.What quality is available?
    10.Where did I stop watching?
    11.What should I watch next?
    12.What have I watched before?
99. FINAL INFORMATION ARCHITECTURE
    PRIMARY:
    Home
    Explore
    Movies
    Shows
    Discover
    Timelines
    My Library
    DISCOVER:
    People
    Studios
    Networks
    Where to Watch
    Collections
    Genres
    Countries
    Providers
    ACCOUNT:
    Statistics
    Achievements
    Profile
    Settings
    Devices
    Subscription
    ADMIN:
    Dashboard
    Users
    Catalog
    Companies
    Providers
    Availability
    Playback Sources
    Moderation
    Billing
    Audit Logs
100. FINAL SYSTEM ARCHITECTURE
     USER
     ↓
     NEXT.JS APP
     ↓
     AUTHENTICATION
     ↓
     SUPABASE AUTH
     ↓
     APPLICATION SERVICES
     ├── Search Service
     ├── Catalog Service
     ├── People Service
     ├── Company Service
     ├── Availability Service
     ├── Playback Service
     ├── Recommendation Service
     ├── Library Service
     ├── Analytics Service
     ├── Achievement Service
     ├── Subscription Service
     └── Notification Service
     ↓
     SUPABASE POSTGRES
     ├── Content
     ├── People
     ├── Companies
     ├── Providers
     ├── Availability
     ├── Collections
     ├── TV Seasons
     ├── Episodes
     ├── Users
     ├── Library
     ├── Watch History
     ├── Analytics
     ├── Achievements
     ├── Subscriptions
     └── Audit Logs
     ↓
     EXTERNAL PROVIDERS
     Metadata APIs
     Availability APIs
     Payment Provider
     Email/Notification Provider
     Authorized Playback Sources
101. GOLDEN ARCHITECTURE RULE
     The system must never have this assumption:
     "TMDB ID = the movie"
     Instead:
     Internal Content ID
     ↓
     External IDs
     ↓
     Metadata
     ↓
     Availability
     ↓
     Playback Sources
     ↓
     User Entitlement
     This gives Lantawon Lang a real platform architecture instead of an API-dependent website.
102. SUPABASE MIGRATION ORDER
     Do NOT migrate everything at once.
     Phase 1:
     Supabase Auth
     Profiles
     User Settings
     Phase 2:
     Canonical Content
     External IDs
     Genres
     People
     Companies
     Phase 3:
     Library
     Watchlist
     Favorites
     Playlists
     Phase 4:
     Watch Progress
     Watch Sessions
     Phase 5:
     Providers
     Availability
     Regions
     Phase 6:
     Achievements
     XP
     Analytics
     Phase 7:
     Subscriptions
     Plans
     Entitlements
     Phase 8:
     Admin
     Audit Logs
     Phase 9:
     Recommendations
103. FINAL SUCCESS CRITERIA
     Before calling the Supabase migration complete:
     [ ] Auth works
     [ ] Profile works
     [ ] RLS works
     [ ] Catalog has stable internal IDs
     [ ] External IDs are separate
     [ ] Movies work
     [ ] TV works
     [ ] Episodes work
     [ ] People work
     [ ] Filmography works
     [ ] Companies work
     [ ] Provider availability works
     [ ] Region switching works
     [ ] Search works
     [ ] Filters work
     [ ] Watchlist works
     [ ] Favorites work
     [ ] Playlists work
     [ ] Watch progress works
     [ ] Continue Watching works
     [ ] Statistics work
     [ ] Achievements work
     [ ] XP events are auditable
     [ ] Subscriptions are server verified
     [ ] Entitlements are centralized
     [ ] Admin roles work
     [ ] Audit logs work
     [ ] Offline Local Vault remains separate
     [ ] External API failures do not destroy core app functionality
     [ ] No client-side secret/service-role key
     [ ] No unauthorized playback source is treated as an entitled source
104. FINAL DESIGN DIRECTION
     Visual language:
     Premium cinematic dark UI
     OLED-friendly backgrounds
     Large cinematic backdrops
     Clean typography
     High information density
     Minimal border noise
     Strong hierarchy
     Smooth hover states
     No unnecessary popups
     No intrusive UI while watching
     Fullscreen player remains clean
     Account and discovery complexity stays outside playback
     PLAYER PAGE MUST BE DIFFERENT FROM THE REST OF THE APP.
     While watching:
     NO intrusive modal
     NO random promotional popup
     NO unnecessary navigation
     NO distracting recommendation overlays
     The movie/show should dominate the screen.
105. FINAL PRODUCT POSITIONING
     Lantawon Lang should be architected as:
     "Cinematic Discovery + Personal Media Library + Availability Intelligence + Authorized Playback + Personalization"
     NOT:
     "Website containing every movie from random servers."
     The database, UI, subscription system, and backend should all follow that distinction.

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
