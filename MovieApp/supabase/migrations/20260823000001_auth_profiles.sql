-- ============================================================================
-- MIGRATION 01: AUTH PROFILES & USER PREFERENCES
-- Lantawon Lang Master Database Schema (Section 64)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    avatar_emoji TEXT DEFAULT '🎬',
    bio TEXT DEFAULT 'I watch therefore I am.',
    country_code VARCHAR(2) DEFAULT 'PH',
    preferred_language VARCHAR(5) DEFAULT 'tl',
    is_premium BOOLEAN DEFAULT FALSE,
    xp_total INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    viewer_persona TEXT DEFAULT 'The New Arrival',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    autoplay_next BOOLEAN DEFAULT TRUE,
    sound_effects_enabled BOOLEAN DEFAULT TRUE,
    subtitles_enabled BOOLEAN DEFAULT FALSE,
    subtitles_language VARCHAR(5) DEFAULT 'en',
    preferred_server TEXT DEFAULT 'server1',
    preferred_quality TEXT DEFAULT '1080p',
    theme TEXT DEFAULT 'dark',
    content_filter_level TEXT DEFAULT 'standard',
    hide_gore BOOLEAN DEFAULT FALSE,
    hide_nudity BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Trigger: Automatically create profile upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_emoji)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'Lantawon Viewer'),
        '🎬'
    );
    
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
