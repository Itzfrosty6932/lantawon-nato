-- ============================================================================
-- MIGRATION 02: CANONICAL CONTENT CATALOG & FILMOGRAPHIES
-- Lantawon Lang Master Database Schema (Section 64)
-- ============================================================================

-- 1. Canonical Content Table
CREATE TABLE IF NOT EXISTS public.content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('movie', 'tv', 'anime', 'documentary', 'cartoon')),
    title TEXT NOT NULL,
    original_title TEXT,
    tagline TEXT,
    overview TEXT,
    release_date DATE,
    first_air_date DATE,
    last_air_date DATE,
    status VARCHAR(30) DEFAULT 'Released',
    original_language VARCHAR(5) DEFAULT 'en',
    poster_path TEXT,
    backdrop_path TEXT,
    runtime_minutes INTEGER,
    number_of_seasons INTEGER DEFAULT 0,
    number_of_episodes INTEGER DEFAULT 0,
    vote_average NUMERIC(3, 1) DEFAULT 0.0,
    vote_count INTEGER DEFAULT 0,
    popularity NUMERIC(10, 3) DEFAULT 0.0,
    is_adult BOOLEAN DEFAULT FALSE,
    certification VARCHAR(10),
    mtrcb_rating VARCHAR(10),
    advisory_violence VARCHAR(15) DEFAULT 'none',
    advisory_gore VARCHAR(15) DEFAULT 'none',
    advisory_sexual VARCHAR(15) DEFAULT 'none',
    advisory_language VARCHAR(15) DEFAULT 'none',
    advisory_substances VARCHAR(15) DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Decoupled External IDs Mapping (TMDB, IMDB, MAL, Internal)
CREATE TABLE IF NOT EXISTS public.content_external_ids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('tmdb', 'imdb', 'mal', 'anilist', 'tvdb', 'wikidata', 'internal')),
    external_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(content_id, provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_ext_ids_lookup ON public.content_external_ids(provider, external_id);

-- 3. Content Genres & Taxonomies
CREATE TABLE IF NOT EXISTS public.content_genres (
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL,
    genre_name VARCHAR(50) NOT NULL,
    is_anime_tag BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (content_id, genre_id)
);

-- 4. Content Origin Countries
CREATE TABLE IF NOT EXISTS public.content_countries (
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL,
    PRIMARY KEY (content_id, country_code)
);

-- 5. Seasons Table
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    overview TEXT,
    poster_path TEXT,
    air_date DATE,
    episode_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(content_id, season_number)
);

-- 6. Episodes Table
CREATE TABLE IF NOT EXISTS public.episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    overview TEXT,
    still_path TEXT,
    air_date DATE,
    runtime_minutes INTEGER,
    vote_average NUMERIC(3, 1) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(season_id, episode_number)
);

-- 7. People & Filmography Masters
CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tmdb_person_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    original_name TEXT,
    biography TEXT,
    profile_path TEXT,
    known_for_department VARCHAR(50),
    gender INTEGER DEFAULT 0,
    birthday DATE,
    deathday DATE,
    place_of_birth TEXT,
    popularity NUMERIC(10, 3) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 8. Credits (Actors, Directors, Writers, Producers)
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    credit_type VARCHAR(10) NOT NULL CHECK (credit_type IN ('cast', 'crew')),
    department VARCHAR(50) NOT NULL,
    job VARCHAR(100),
    character_name TEXT,
    credit_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_credits_content ON public.credits(content_id);
CREATE INDEX IF NOT EXISTS idx_credits_person ON public.credits(person_id);

-- 9. Companies, Studios & Broadcasters
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tmdb_company_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    category VARCHAR(30) DEFAULT 'studio' CHECK (category IN ('studio', 'production_company', 'network', 'broadcaster', 'distributor', 'streamer')),
    origin_country VARCHAR(2),
    logo_path TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.content_companies (
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    relationship_type VARCHAR(30) DEFAULT 'production',
    PRIMARY KEY (content_id, company_id)
);

-- 10. Franchise Collections & Universes
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tmdb_collection_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    universe_key VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.collection_items (
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    chronological_order INTEGER,
    release_order INTEGER,
    PRIMARY KEY (collection_id, content_id)
);
