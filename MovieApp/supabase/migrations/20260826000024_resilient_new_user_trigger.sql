-- ============================================================================
-- MIGRATION 24: RESILIENT NEW-USER TRIGGER
-- ============================================================================
-- Root cause of "Database error saving new user":
--   handle_new_user() inserted profiles.username straight from auth metadata.
--   profiles.username has a UNIQUE constraint, so any username collision (or a
--   retried signup) made the trigger throw — and a throw inside the
--   AFTER INSERT trigger aborts the whole auth.users insert, which Supabase
--   surfaces to the client as "Database error saving new user".
--
-- Fix: never let the trigger abort signup.
--   - Deduplicate the username: if taken, suffix with a short id fragment.
--   - Guard both inserts with ON CONFLICT DO NOTHING.
--   - Wrap in an exception handler so a profile hiccup can never block auth;
--     the /api/auth/init-profile route reconciles display_name/username after.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_base_username TEXT;
    v_username TEXT;
    v_display_name TEXT;
BEGIN
    v_base_username := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
        'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
    );
    v_display_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
        v_base_username
    );

    -- If the desired username is already taken, append a short id fragment so
    -- the UNIQUE constraint never trips the trigger.
    v_username := v_base_username;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
        v_username := v_base_username || '_' || SUBSTRING(NEW.id::TEXT, 1, 6);
    END IF;

    INSERT INTO public.profiles (id, username, display_name, avatar_emoji)
    VALUES (NEW.id, v_username, v_display_name, '🎬')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Never abort the auth.users insert because of a profile-side issue.
        -- init-profile reconciles the row immediately after signup.
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
