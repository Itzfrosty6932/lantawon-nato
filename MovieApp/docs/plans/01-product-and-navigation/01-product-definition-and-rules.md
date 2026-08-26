
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
