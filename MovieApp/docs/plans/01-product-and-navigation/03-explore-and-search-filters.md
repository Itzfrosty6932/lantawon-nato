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
