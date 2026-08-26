-- ============================================================================
-- MIGRATION 14: CLOSE CRITICAL SECURITY HOLES (2026-08-24)
-- ============================================================================
-- Fixes from security audit:
--   C2: make_user_admin() was SECURITY DEFINER executable by PUBLIC —
--       any anonymous visitor could elevate themselves to admin.
--   C3: member_sessions had a FOR ALL USING(true) WITH CHECK(true)
--       catch-all policy — any authenticated user could read/revoke/
--       forge every user's sessions.
--   M1: audit_logs allowed public INSERT WITH CHECK(true) — forgery.
--
-- NOTE: This migration must be applied to the live database via
-- `supabase db push` or the SQL editor.

-- ============================================================================
-- C2: LOCK DOWN ADMIN ELEVATION
-- ============================================================================
-- The function itself is replaced to be a no-op for anyone but service_role,
-- and EXECUTE is revoked from PUBLIC/anon/authenticated. Admin elevation
-- should happen exclusively via the Supabase dashboard / service_role key.

REVOKE EXECUTE ON FUNCTION public.make_user_admin(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.make_user_admin(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Defense-in-depth: even if EXECUTE were re-granted by mistake,
  -- refuse to run unless invoked with the service role.
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'forbidden: admin elevation only via service role';
  END IF;
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = user_id;
END;
$$;

-- ============================================================================
-- C3: REMOVE member_sessions CATCH-ALL POLICY
-- ============================================================================
DROP POLICY IF EXISTS "Allow all operations on member sessions" ON public.member_sessions;
DROP POLICY IF EXISTS "member_sessions_all_access" ON public.member_sessions;
-- Drop by the actual policy name if different; sweep common variants:
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'member_sessions'
      AND (qual = 'true' OR with_check = 'true')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.member_sessions', pol.policyname);
  END LOOP;
END $$;

-- Owner-scoped policies: view + revoke own sessions only.
-- Session lifecycle writes (insert-on-login, eviction of oldest device
-- when limit exceeded) must go through a SECURITY DEFINER function or a
-- server route using the service-role key — never direct client writes.
CREATE POLICY "Users can view own sessions"
  ON public.member_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can revoke own sessions"
  ON public.member_sessions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- Helper RPC for session lifecycle (replaces the deleted catch-all):
-- called server-side after login to register the current device session.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.register_member_session(
  p_device_name TEXT DEFAULT '',
  p_device_type TEXT DEFAULT 'unknown'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_account UUID;
  v_max INT;
  v_session UUID;
  v_count INT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT account_id INTO v_account
    FROM public.account_members WHERE user_id = v_user LIMIT 1;

  SELECT COALESCE(max_concurrent_sessions, 1) INTO v_max
    FROM public.accounts WHERE id = v_account;

  INSERT INTO public.member_sessions (user_id, account_id, device_name, device_type, last_active_at)
  VALUES (v_user, v_account, p_device_name, p_device_type, now())
  RETURNING id INTO v_session;

  -- Evict oldest sessions beyond the device limit
  SELECT COUNT(*) INTO v_count FROM public.member_sessions
    WHERE account_id = v_account AND revoked_at IS NULL AND expires_at > now();

  IF v_count > v_max THEN
    WITH victims AS (
      SELECT id FROM public.member_sessions
       WHERE account_id = v_account AND revoked_at IS NULL AND expires_at > now()
         AND id <> v_session
       ORDER BY last_active_at ASC
       LIMIT (v_count - v_max)
    )
    UPDATE public.member_sessions SET revoked_at = now()
     WHERE id IN (SELECT id FROM victims);
  END IF;

  RETURN v_session;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_member_session(TEXT, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.register_member_session(TEXT, TEXT) FROM PUBLIC, anon;

-- ============================================================================
-- M1: AUDIT LOGS — no more client-side INSERT forgery
-- ============================================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_logs' AND cmd = 'INSERT'
      AND with_check::text LIKE '%true%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_logs', pol.policyname);
  END LOOP;
END $$;
-- Audit rows are written exclusively inside SECURITY DEFINER functions
-- (e.g., payment approval RPC). No direct client INSERT.

-- ============================================================================
-- H8 partial: guest trial hardening note
-- ============================================================================
-- Guest fingerprint trials remain forgeable until bound to Supabase
-- anonymous auth (tracked separately). The RPCs themselves clamp elapsed
-- seconds per heartbeat, limiting but not eliminating abuse.
