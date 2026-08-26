-- ============================================================================
-- MIGRATION 19: FIX register_member_session RPC + SESSION LIFECYCLE
-- ============================================================================
-- Migration 14 hardened member_sessions (dropped the catch-all FOR ALL
-- policy) and introduced register_member_session() as the sanctioned
-- write path. But that RPC was written against columns that don't exist:
--   ✗ last_active_at        → actual column is last_seen_at
--   ✗ accounts.max_concurrent_sessions → lives on subscription_packages
-- Meanwhile session-service.ts still wrote rows directly from the client,
-- which RLS now correctly rejects → "Session creation error {}" on login.
--
-- This migration rebuilds the RPC correctly and session-service.ts is
-- updated to call it instead of inserting directly.
-- ============================================================================

DROP FUNCTION IF EXISTS public.register_member_session(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.register_member_session(
  p_device_name TEXT DEFAULT '',
  p_device_type TEXT DEFAULT 'unknown',
  p_platform TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_expires_in_days INT DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    v_user UUID := auth.uid();
    v_account UUID;
    v_max INT;
    v_session_id UUID;
    v_session_identifier TEXT;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'unauthenticated';
    END IF;

    -- Account this user belongs to (owner or member)
    SELECT account_id INTO v_account
    FROM public.account_members
    WHERE user_id = v_user
    LIMIT 1;

    -- Concurrent-session cap comes from the ACTIVE subscription's package
    SELECT COALESCE(sp.max_concurrent_sessions, 1) INTO v_max
    FROM public.subscriptions s
    JOIN public.subscription_packages sp ON sp.id = s.current_package_id
    WHERE s.account_id = v_account AND s.status = 'active'
    LIMIT 1;
    v_max := COALESCE(v_max, 1);

    v_session_identifier := 'sess_' ||
        EXTRACT(EPOCH FROM TIMEZONE('utc', NOW()))::BIGINT::TEXT || '_' ||
        SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 9);

    INSERT INTO public.member_sessions (
        user_id, account_id, session_identifier,
        device_name, device_type, platform, browser,
        status,
        last_seen_at,
        expires_at
    ) VALUES (
        v_user, v_account, v_session_identifier,
        p_device_name, p_device_type, p_platform, p_browser,
        'active',
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW()) + MAKE_INTERVAL(days => GREATEST(p_expires_in_days, 1))
    )
    RETURNING id INTO v_session_id;

    -- Evict the oldest still-valid sessions beyond the package limit
    IF v_account IS NOT NULL THEN
        WITH victims AS (
            SELECT id FROM public.member_sessions
            WHERE account_id = v_account
              AND revoked_at IS NULL
              AND status = 'active'
              AND id <> v_session_id
            ORDER BY last_seen_at ASC
            LIMIT (
                SELECT GREATEST(
                    (SELECT COUNT(*) FROM public.member_sessions
                     WHERE account_id = v_account
                       AND revoked_at IS NULL
                       AND status = 'active')
                    - v_max, 0)
            )
        )
        UPDATE public.member_sessions
        SET status = 'revoked', revoked_at = NOW()
        WHERE id IN (SELECT id FROM victims);
    END IF;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'session_id', v_session_id,
        'session_identifier', v_session_identifier
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.register_member_session(TEXT, TEXT, TEXT, TEXT, INT)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_member_session(TEXT, TEXT, TEXT, TEXT, INT)
    TO authenticated;

-- Heartbeat keep-alive: scoped UPDATE via SECURITY DEFINER so clients never
-- need a blanket UPDATE path. Keyed by caller-owned session identifier.
CREATE OR REPLACE FUNCTION public.heartbeat_member_session(p_session_identifier TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user UUID := auth.uid();
    v_updated INT;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'unauthenticated';
    END IF;

    UPDATE public.member_sessions
    SET last_seen_at = TIMEZONE('utc', NOW())
    WHERE session_identifier = p_session_identifier
      AND user_id = v_user
      AND status = 'active'
      AND revoked_at IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;

    RETURN jsonb_build_object('ok', v_updated > 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.heartbeat_member_session(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.heartbeat_member_session(TEXT) TO authenticated;
