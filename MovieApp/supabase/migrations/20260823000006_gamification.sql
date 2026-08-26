-- ============================================================================
-- MIGRATION 06: GAMIFICATION, AUDITABLE XP EVENTS & ACHIEVEMENTS
-- Lantawon Lang Master Database Schema (Section 64)
-- ============================================================================

-- 1. Master Achievements Registry
CREATE TABLE IF NOT EXISTS public.achievements (
    id VARCHAR(50) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('milestones', 'genres', 'anime', 'cinema', 'features', 'secret', 'social')),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    xp_reward INTEGER NOT NULL DEFAULT 50,
    icon_name VARCHAR(50) DEFAULT 'Trophy',
    badge_color VARCHAR(30) DEFAULT 'emerald',
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 2. User Unlocked Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    progress_current INTEGER DEFAULT 1,
    progress_target INTEGER DEFAULT 1,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    claimed_at TIMESTAMPTZ,
    UNIQUE(user_id, achievement_id)
);

-- 3. Auditable XP Events Stream
CREATE TABLE IF NOT EXISTS public.xp_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    xp_amount INTEGER NOT NULL,
    source_entity_type VARCHAR(30),
    source_entity_id TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user ON public.xp_events(user_id, created_at DESC);

-- Trigger: Automatically update profile total XP and Level upon XP event creation
CREATE OR REPLACE FUNCTION public.process_xp_event()
RETURNS TRIGGER AS $$
DECLARE
    new_total_xp INTEGER;
    new_level INTEGER;
BEGIN
    SELECT COALESCE(SUM(xp_amount), 0) INTO new_total_xp
    FROM public.xp_events
    WHERE user_id = NEW.user_id;

    -- Standard Level Curve: Level = FLOOR(SQRT(Total_XP / 100)) + 1
    new_level := GREATEST(1, FLOOR(SQRT(new_total_xp::FLOAT / 100.0)) + 1);

    UPDATE public.profiles
    SET xp_total = new_total_xp,
        current_level = new_level,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_xp_event_logged ON public.xp_events;
CREATE TRIGGER on_xp_event_logged
    AFTER INSERT ON public.xp_events
    FOR EACH ROW EXECUTE FUNCTION public.process_xp_event();
