-- ============================================================================
-- MIGRATION 18: USER-SIDE BILLING ACTIONS
-- Lantawon Lang 2.0
-- ============================================================================
-- Gives subscribers self-service control over THEIR OWN money without
-- reopening any H1-style free-upgrade hole:
--
--   * payment_submissions gains a 'canceled' status so a user can withdraw
--     a payment that is still awaiting admin review.
--   * cancel_own_pending_payment() — user cancels THEIR OWN pending payment.
--   * set_cancel_at_period_end() — user toggles auto-renewal on THEIR OWN
--     active subscription (renews stay paid via admin approval either way;
--     this flag only signals intent + lets the UI stop nagging).
--
-- Everything is SECURITY DEFINER but caller-scoped: you can only ever touch
-- rows whose ownership traces back to auth.uid().
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Widen payment_submissions.status to include 'canceled'
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    c text;
BEGIN
    -- Constraint name varies between environments — find it dynamically.
    SELECT conname INTO c
    FROM pg_constraint
    WHERE conrelid = 'public.payment_submissions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';

    IF c IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.payment_submissions DROP CONSTRAINT %I', c);
    END IF;
END $$;

ALTER TABLE public.payment_submissions
    ADD CONSTRAINT payment_submissions_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'canceled'));

-- ---------------------------------------------------------------------------
-- 2. Cancel my own PENDING payment submission
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_own_pending_payment(p_payment_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'unauthenticated';
    END IF;

    UPDATE public.payment_submissions
    SET status = 'canceled',
        reviewed_at = NOW(),
        reviewed_by = NULL,
        rejection_reason = NULL
    WHERE id = p_payment_id
      AND submitted_by_user_id = auth.uid()
      AND status = 'pending';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'no pending payment % belongs to you', p_payment_id;
    END IF;

    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'payment.canceled_by_user', 'payment_submission', p_payment_id);

    RETURN jsonb_build_object('ok', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.cancel_own_pending_payment(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_own_pending_payment(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Toggle auto-renewal intent on MY OWN subscription
-- ---------------------------------------------------------------------------
-- cancel_at_period_end = TRUE  → "huwag munang mag-renew" (access stays until
--                                current_period_end, then naturally expires)
-- cancel_at_period_end = FALSE → resume normal renewal intent

CREATE OR REPLACE FUNCTION public.set_cancel_at_period_end(p_cancel BOOLEAN)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'unauthenticated';
    END IF;

    UPDATE public.subscriptions s
    SET cancel_at_period_end = p_cancel,
        updated_at = TIMEZONE('utc', NOW())
    WHERE s.account_id IN (
        SELECT a.id FROM public.accounts a
        WHERE a.owner_user_id = auth.uid()
    )
    AND s.status = 'active';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'no active subscription found for your account';
    END IF;

    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
    SELECT auth.uid(),
           CASE WHEN p_cancel THEN 'subscription.renewal_canceled' ELSE 'subscription.renewal_resumed' END,
           'subscriptions', s.id::text,
           jsonb_build_object('cancel_at_period_end', p_cancel)
    FROM public.subscriptions s
    WHERE s.account_id IN (
        SELECT a.id FROM public.accounts a WHERE a.owner_user_id = auth.uid()
    );

    RETURN jsonb_build_object('ok', TRUE, 'cancel_at_period_end', p_cancel);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.set_cancel_at_period_end(BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_cancel_at_period_end(BOOLEAN) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. DAILY WATCH BONUS — real server-side XP (previously UI-only)
-- ---------------------------------------------------------------------------
-- Canonical rules enforced HERE, not in the client:
--   * the user must have REAL watch telemetry today (a watch_sessions row
--     with progress_seconds > 60 written today) — login alone never earns it;
--   * one bonus per UTC day (unique index makes double-claims impossible
--     even across devices/tabs);
--   * +50 XP flows through the standard xp_events trigger so totals,
--     levels and the leaderboard update automatically.

ALTER TABLE public.xp_events ADD COLUMN IF NOT EXISTS event_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_events_daily_bonus
    ON public.xp_events(user_id, event_date)
    WHERE event_type = 'daily_watch_bonus';

CREATE OR REPLACE FUNCTION public.claim_daily_watch_bonus()
RETURNS JSONB AS $$
DECLARE
    v_watched_today BOOLEAN;
    v_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'unauthenticated';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.watch_sessions
        WHERE user_id = auth.uid()
          AND is_trailer = FALSE
          AND progress_seconds > 60
          AND started_at::date = TIMEZONE('utc', NOW())::date
    ) INTO v_watched_today;

    IF NOT v_watched_today THEN
        RAISE EXCEPTION 'no qualifying watch session today';
    END IF;

    INSERT INTO public.xp_events (user_id, event_type, xp_amount, event_date, description)
    VALUES (auth.uid(), 'daily_watch_bonus', 50, TIMEZONE('utc', NOW())::date,
            'Daily watch bonus')
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('ok', TRUE, 'xp', 50, 'event_id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.claim_daily_watch_bonus() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_watch_bonus() TO authenticated;

-- ============================================================
-- §5: Email-confirmation lookup (login UX)
--
-- Supabase returns "Invalid login credentials" both for a wrong
-- password AND for an unconfirmed account. This SECURITY DEFINER
-- helper lets the login form distinguish the two without exposing
-- auth.users. Returns only booleans, granted to anon + authenticated.
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_email_confirmed(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    v_exists BOOLEAN;
    v_confirmed BOOLEAN;
BEGIN
    SELECT
        COUNT(*) > 0,
        COALESCE(BOOL_AND(email_confirmed_at IS NOT NULL), FALSE)
    INTO v_exists, v_confirmed
    FROM auth.users
    WHERE LOWER(email) = LOWER(p_email);

    RETURN jsonb_build_object(
        'exists', v_exists,
        'confirmed', CASE WHEN v_exists THEN v_confirmed ELSE TRUE END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.check_email_confirmed(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_confirmed(TEXT) TO anon, authenticated;
