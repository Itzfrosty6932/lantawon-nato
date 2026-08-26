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
