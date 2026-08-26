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
