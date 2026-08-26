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
