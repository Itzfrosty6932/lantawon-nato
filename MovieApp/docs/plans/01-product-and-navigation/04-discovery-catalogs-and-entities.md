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
