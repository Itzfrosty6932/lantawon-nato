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
