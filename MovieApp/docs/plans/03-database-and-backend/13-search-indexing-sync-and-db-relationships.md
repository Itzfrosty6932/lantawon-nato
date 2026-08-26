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
