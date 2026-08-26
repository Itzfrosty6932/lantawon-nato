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
