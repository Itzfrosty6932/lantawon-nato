-- ============================================================================
-- MIGRATION 17: FORGOT-PASSWORD TICKET RPC
-- ============================================================================
-- The manual password-reset flow: a user who forgot their password requests a
-- reset; our team verifies them manually via Gmail/chat, then an admin issues
-- a temporary password from the Admin Portal.
--
-- Anonymous visitors can't INSERT into support_tickets directly (FK to
-- auth.users is NOT NULL and RLS requires auth.uid()), so this SECURITY
-- DEFINER RPC resolves the account by email server-side.
--
-- Non-enumeration: unknown emails get the SAME generic response as known
-- ones — nothing is inserted, no error surfaces.

CREATE OR REPLACE FUNCTION public.create_password_reset_ticket(
  p_email text,
  p_message text DEFAULT NULL
)
RETURNS text -- ticket_number, or 'LL-GENERIC' when the email is unknown
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
  v_ticket_number text;
  v_recent_open int;
BEGIN
  IF p_email IS NULL OR p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN 'LL-GENERIC';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(p_email);

  -- Unknown email → pretend success, insert nothing (no enumeration).
  IF v_user_id IS NULL THEN
    RETURN 'LL-GENERIC';
  END IF;

  -- Simple abuse brake: at most 1 open forgot_password ticket per user
  -- per 15 minutes; reuse its number instead of spamming new rows.
  SELECT count(*) INTO v_recent_open
  FROM public.support_tickets
  WHERE created_by_user_id = v_user_id
    AND category = 'forgot_password'
    AND status IN ('open', 'in_progress', 'waiting')
    AND created_at > now() - interval '15 minutes';

  IF v_recent_open > 0 THEN
    SELECT ticket_number INTO v_ticket_number
    FROM public.support_tickets
    WHERE created_by_user_id = v_user_id
      AND category = 'forgot_password'
      AND status IN ('open', 'in_progress', 'waiting')
      AND created_at > now() - interval '15 minutes'
    ORDER BY created_at DESC
    LIMIT 1;
    RETURN v_ticket_number;
  END IF;

  -- Resolve the user's billing account so admin sees it in context.
  SELECT account_id INTO v_account_id
  FROM public.account_members
  WHERE user_id = v_user_id
  LIMIT 1;

  INSERT INTO public.support_tickets (
    account_id, created_by_user_id, subject,
    category, priority, status
  ) VALUES (
    v_account_id, v_user_id,
    'Password reset requested',
    'forgot_password', 'high', 'open'
  )
  RETURNING ticket_number INTO v_ticket_number;

  RETURN v_ticket_number;
EXCEPTION WHEN OTHERS THEN
  -- Never leak internals to anonymous callers.
  RETURN 'LL-GENERIC';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_password_reset_ticket(text, text)
  TO anon, authenticated;
