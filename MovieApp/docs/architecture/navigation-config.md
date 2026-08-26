# Canonical Navigation Architecture

**Date**: 2026-08-22  
**Purpose**: Single Source of Truth for Platform Navigation & Taxonomy Separation

---

## 1. Taxonomy Separation Principles

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEPARATION OF TAXONOMY CONCEPTS                      │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ MEDIA FORMAT      │ ORIGIN / COUNTRY  │ DISCOVERY MODE                 │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Feature Films   │ • Japan (JP)      │ • Home Spotlight               │
│ • TV Series       │ • United States   │ • Trending Worldwide           │
│ • Anime           │ • South Korea     │ • Top Masterpieces             │
│ • Animation       │ • United Kingdom  │ • Golden Age Classics          │
│ • Documentaries   │ • France / China  │ • Surprise Me Curator          │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

> [!IMPORTANT]
> Media formats (e.g. Anime, Feature Films) and Origin filters (e.g. Japan, USA) are strictly orthogonal dimensions. Anime is a style/format, while Japan is a regional filter. They are never rendered as ambiguous sibling categories.

---

## 2. Canonical Navigation Hierarchy (`src/lib/constants/navigation.ts`)

- **DISCOVER**: Home (`/`), Discover Matrix (`/discover`), Trending (`/trending`), Top Rated (`/top-rated`), Classics (`/discover?era=golden-age`).
- **CONTENT**: Movies (`/movies`), Series (`/series`), Anime (`/anime`), Animation (`/discover?media_type=animation`), Documentaries (`/documentaries`).
- **EXPLORE BY**: Genres (`/discover?focus=genre`), Countries (`/discover?focus=country`), Decades (`/discover?focus=decade`), Moods (`/discover?focus=mood`).
- **MY LIBRARY**: Watchlist (`/library?tab=watchlist`), Continue Watching (`/library?tab=continue`), History (`/library?tab=history`), Favorites (`/library?tab=favorites`), Local Library (`/library?tab=local`), Downloads (`/downloads`).
- **INSIGHTS**: Taste Profile (`/statistics?tab=taste`), Statistics (`/statistics`), AI Watch Assistant (`/ai`).
