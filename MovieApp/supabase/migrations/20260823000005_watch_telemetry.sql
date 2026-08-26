-- ============================================================================
-- MIGRATION 05: WATCH TELEMETRY & DUAL PROGRESS MODEL
-- Lantawon Lang Master Database Schema (Section 64)
-- ============================================================================

-- 1. Watch Progress (Fast Resume Table)
CREATE TABLE IF NOT EXISTS public.watch_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL,
    season_number INTEGER DEFAULT NULL,
    episode_number INTEGER DEFAULT NULL,
    progress_seconds NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    duration_seconds NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    completed BOOLEAN DEFAULT FALSE,
    last_server_used TEXT,
    last_watched_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, content_id, season_number, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_watch_progress_resume ON public.watch_progress(user_id, last_watched_at DESC);

-- 2. Watch Sessions (Immutable Stream Event Log)
CREATE TABLE IF NOT EXISTS public.watch_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    season_number INTEGER DEFAULT NULL,
    episode_number INTEGER DEFAULT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    ended_at TIMESTAMPTZ,
    watch_duration_seconds INTEGER DEFAULT 0,
    server_identifier TEXT,
    stream_resolution VARCHAR(10),
    device_type VARCHAR(50) DEFAULT 'web_browser',
    country_code VARCHAR(2) DEFAULT 'PH',
    completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_watch_sessions_analytics ON public.watch_sessions(user_id, started_at DESC);
