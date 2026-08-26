-- ============================================================================
-- MIGRATION 03: WHERE-TO-WATCH AVAILABILITY & PLAYBACK SOURCES
-- Lantawon Lang Master Database Schema (Section 64)
-- ============================================================================

-- 1. Watch Providers Table
CREATE TABLE IF NOT EXISTS public.watch_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    logo_path TEXT,
    category VARCHAR(30) DEFAULT 'subscription' CHECK (category IN ('subscription', 'free', 'rent', 'buy', 'tv_everywhere')),
    display_priority INTEGER DEFAULT 99,
    website_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Content Availability (Where to Watch per Region)
CREATE TABLE IF NOT EXISTS public.content_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.watch_providers(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL,
    availability_type VARCHAR(20) NOT NULL CHECK (availability_type IN ('flatrate', 'free', 'ads', 'rent', 'buy')),
    price_currency VARCHAR(5),
    price_amount NUMERIC(8, 2),
    quality_available VARCHAR(10) DEFAULT 'HD',
    deep_link TEXT,
    verified_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(content_id, provider_id, country_code, availability_type)
);

CREATE INDEX IF NOT EXISTS idx_availability_lookup ON public.content_availability(content_id, country_code);

-- 3. Source-Agnostic Playback Sources
CREATE TABLE IF NOT EXISTS public.playback_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    season_number INTEGER DEFAULT NULL,
    episode_number INTEGER DEFAULT NULL,
    source_adapter VARCHAR(50) NOT NULL,
    source_identifier TEXT NOT NULL,
    stream_type VARCHAR(20) DEFAULT 'embed' CHECK (stream_type IN ('hls', 'dash', 'mp4', 'embed', 'local_blob')),
    resolution VARCHAR(10) DEFAULT '1080p',
    audio_channels VARCHAR(10) DEFAULT '2.0',
    has_subtitles BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    priority_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_playback_source_lookup ON public.playback_sources(content_id, season_number, episode_number);

-- 4. Source Health & Probe Logs
CREATE TABLE IF NOT EXISTS public.source_health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES public.playback_sources(id) ON DELETE CASCADE,
    server_identifier TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('online', 'degraded', 'offline', 'error')),
    latency_ms INTEGER,
    http_status_code INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_health_logs_source ON public.source_health_logs(source_id, checked_at DESC);
