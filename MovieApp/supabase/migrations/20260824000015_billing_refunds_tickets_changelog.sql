-- ============================================================================
-- MIGRATION 15: BILLING HARDENING, REFUNDS, TICKET ATTACHMENTS, CHANGELOG
-- Lantawon Lang 2.0
-- ============================================================================
-- Closes audit findings:
--   H1: subscriptions UPDATE policy let owners self-extend/upgrade for free
--       -> owners can no longer UPDATE subscriptions; approval flows through
--          SECURITY DEFINER RPCs only.
--   H2: payment-proofs bucket was PUBLIC -> made private, public-read policy
--       dropped. Proofs are visible only to the uploader and admins.
--   H3: accounts had no INSERT policy -> new subscribers could never create
--       their billing account. Owner-scoped INSERT added + auto member row.
--
-- Adds:
--   * is_trailer flags on watch telemetry (CANONICAL refund rule)
--   * refund_requests table + eligibility RPC
--   * admin approve/reject payment RPCs (writes subscription state)
--   * system_changelog table (public read) for the user-facing updates page
-- ============================================================================

-- ============================================================================
-- 1. CANONICAL REFUND RULE — SCHEMA SUPPORT
-- "A subscription payment is refundable ONLY until the account watches its
--  first NON-TRAILER video. Trailers NEVER count."
-- ============================================================================

ALTER TABLE public.watch_sessions ADD COLUMN IF NOT EXISTS is_trailer BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.watch_progress ADD COLUMN IF NOT EXISTS is_trailer BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_watch_sessions_nontrailer
    ON public.watch_sessions(user_id, started_at DESC)
    WHERE is_trailer = FALSE;

-- ============================================================================
-- 2. REFUND REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_submission_id UUID NOT NULL REFERENCES public.payment_submissions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    requested_by_user_id UUID NOT NULL REFERENCES auth.users(id),

    reason TEXT NOT NULL,
    -- Eligibility snapshot taken AT REQUEST TIME so later watching cannot
    -- rewrite history on an already-decided request.
    was_eligible_at_request BOOLEAN NOT NULL,
    first_nontrailer_watched_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    decided_by UUID REFERENCES auth.users(id),
    decided_at TIMESTAMPTZ,
    decision_note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_account ON public.refund_requests(account_id);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refund requests"
    ON public.refund_requests FOR SELECT
    USING (
        requested_by_user_id = auth.uid()
        OR account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "Users can create refund requests for their account"
    ON public.refund_requests FOR INSERT
    WITH CHECK (
        requested_by_user_id = auth.uid()
        AND account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "Admins can manage refund requests"
    ON public.refund_requests FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- ============================================================================
-- 3. FIX H3 — ACCOUNTS: owner-scoped INSERT + auto owner membership
-- ============================================================================

CREATE POLICY "Users can create their own account"
    ON public.accounts FOR INSERT
    WITH CHECK (owner_user_id = auth.uid());

-- New account automatically gets its owner as an active member.
CREATE OR REPLACE FUNCTION public.handle_new_account_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.account_members (account_id, user_id, role, status)
    VALUES (NEW.id, NEW.owner_user_id, 'owner', 'active')
    ON CONFLICT (account_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_account_created ON public.accounts;
CREATE TRIGGER on_account_created
    AFTER INSERT ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_account_membership();

-- ============================================================================
-- 4. FIX H1 — SUBSCRIPTIONS: strip owner UPDATE power
-- ============================================================================
-- Owners previously matched "Account owners can update subscription" and
-- could set status='active' / extend current_period_end without paying.
-- Subscription state now changes ONLY through the admin approval RPCs below
-- (service role bypasses RLS) — no client-writable path remains.

DROP POLICY IF EXISTS "Account owners can update subscription" ON public.subscriptions;

-- Owners may CREATE their own subscription row, but only in the
-- pending_payment state — activation happens exclusively through
-- admin_approve_payment(). Period end is clamped by a trigger below so a
-- client can't mint a long free period.
CREATE POLICY "Owners can create pending subscription"
    ON public.subscriptions FOR INSERT
    WITH CHECK (
        account_id IN (SELECT id FROM public.accounts WHERE owner_user_id = auth.uid())
        AND status = 'pending_payment'
    );

-- Clamp client-inserted periods to at most 31 days regardless of what the
-- form claims; admin approval re-extends properly from server side.
CREATE OR REPLACE FUNCTION public.clamp_pending_period()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending_payment' THEN
        IF NEW.current_period_end IS NULL OR NEW.current_period_end > NOW() + INTERVAL '31 days' THEN
            NEW.current_period_end := NOW() + INTERVAL '1 day';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_subscription_insert_clamp ON public.subscriptions;
CREATE TRIGGER on_subscription_insert_clamp
    BEFORE INSERT ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.clamp_pending_period();

-- ============================================================================
-- 5. ADMIN PAYMENT APPROVAL / REJECTION RPCs (SECURITY DEFINER)
-- ============================================================================

-- Helper: is the calling user an admin? Used by every definer function.
CREATE OR REPLACE FUNCTION public.is_caller_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
$$ LANGUAGE sql STABLE;

-- Approve a pending payment: flips submission to approved and extends the
-- account's subscription by one billing interval from NOW (renewals stack
-- from the current period end when still active).
CREATE OR REPLACE FUNCTION public.admin_approve_payment(p_payment_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_payment public.payment_submissions%ROWTYPE;
    v_pkg public.subscription_packages%ROWTYPE;
    v_sub public.subscriptions%ROWTYPE;
    v_new_end TIMESTAMPTZ;
BEGIN
    IF NOT public.is_caller_admin() THEN
        RAISE EXCEPTION 'forbidden';
    END IF;

    SELECT * INTO v_payment FROM public.payment_submissions WHERE id = p_payment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'payment not found'; END IF;
    IF v_payment.status <> 'pending' THEN
        RAISE EXCEPTION 'payment % already reviewed', p_payment_id;
    END IF;

    SELECT * INTO v_pkg FROM public.subscription_packages WHERE id = v_payment.package_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'package not found'; END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE account_id = v_payment.account_id;

    IF v_sub.id IS NULL THEN
        v_new_end := NOW() + CASE WHEN v_pkg.billing_interval = 'yearly'
                                  THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END;
        INSERT INTO public.subscriptions (account_id, current_package_id, status,
                                          current_period_start, current_period_end)
        VALUES (v_payment.account_id, v_pkg.id, 'active', NOW(), v_new_end)
        RETURNING * INTO v_sub;
    ELSE
        -- Renewal: stack on remaining time if still active, else start fresh.
        v_new_end := CASE
            WHEN v_sub.current_period_end > NOW() THEN v_sub.current_period_end
            ELSE NOW()
        END + CASE WHEN v_pkg.billing_interval = 'yearly'
                   THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END;
        UPDATE public.subscriptions
        SET status = 'active',
            current_package_id = v_pkg.id,
            current_period_start = CASE WHEN v_sub.current_period_end > NOW()
                                        THEN current_period_start ELSE NOW() END,
            current_period_end = v_new_end,
            cancel_at_period_end = FALSE,
            pending_package_id = NULL
        WHERE id = v_sub.id
        RETURNING * INTO v_sub;
    END IF;

    UPDATE public.payment_submissions
    SET status = 'approved', reviewed_at = NOW(), reviewed_by = auth.uid()
    WHERE id = p_payment_id;

    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
    VALUES (auth.uid(), 'payment.approved', 'payment_submission', p_payment_id,
            jsonb_build_object('account_id', v_payment.account_id,
                               'package', v_pkg.code, 'new_period_end', v_new_end));

    RETURN jsonb_build_object('ok', TRUE, 'subscription_id', v_sub.id,
                              'period_end', v_sub.current_period_end);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.admin_approve_payment(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_payment(UUID) TO authenticated;

-- Reject a pending payment with a reason surfaced back to the subscriber.
CREATE OR REPLACE FUNCTION public.admin_reject_payment(p_payment_id UUID, p_reason TEXT)
RETURNS JSONB AS $$
BEGIN
    IF NOT public.is_caller_admin() THEN
        RAISE EXCEPTION 'forbidden';
    END IF;
    IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
        RAISE EXCEPTION 'a rejection reason is required';
    END IF;

    UPDATE public.payment_submissions
    SET status = 'rejected', reviewed_at = NOW(), reviewed_by = auth.uid(),
        rejection_reason = p_reason
    WHERE id = p_payment_id AND status = 'pending';

    IF NOT FOUND THEN RAISE EXCEPTION 'no pending payment %', p_payment_id; END IF;

    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
    VALUES (auth.uid(), 'payment.rejected', 'payment_submission', p_payment_id,
            jsonb_build_object('reason', p_reason));

    RETURN jsonb_build_object('ok', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.admin_reject_payment(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_payment(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 6. REFUND ELIGIBILITY (CANONICAL RULE ENFORCEMENT)
-- ============================================================================

-- Returns whether ANY member of the account has watched a NON-TRAILER video
-- during the current billing period. Trailers are excluded by is_trailer.
CREATE OR REPLACE FUNCTION public.account_has_nontrailer_watch(p_account_id UUID)
RETURNS TIMESTAMPTZ AS $$
    SELECT MIN(ws.started_at)
    FROM public.watch_sessions ws
    JOIN public.account_members am ON am.user_id = ws.user_id
    WHERE am.account_id = p_account_id
      AND am.status IN ('owner', 'active')
      AND ws.is_trailer = FALSE;
$$ LANGUAGE sql STABLE;

-- Request a refund for an approved payment. Eligibility is snapshotted here.
CREATE OR REPLACE FUNCTION public.request_refund(p_payment_id UUID, p_reason TEXT)
RETURNS JSONB AS $$
DECLARE
    v_payment public.payment_submissions%ROWTYPE;
    v_first_nontrailer TIMESTAMPTZ;
    v_eligible BOOLEAN;
    v_request_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RAISE EXCEPTION 'please describe why you are requesting a refund';
    END IF;

    SELECT * INTO v_payment FROM public.payment_submissions WHERE id = p_payment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'payment not found'; END IF;

    -- Only the payer or the account owner may request.
    IF v_payment.submitted_by_user_id <> auth.uid()
       AND NOT EXISTS (SELECT 1 FROM public.accounts
                       WHERE id = v_payment.account_id AND owner_user_id = auth.uid()) THEN
        RAISE EXCEPTION 'not your payment';
    END IF;

    IF v_payment.status <> 'approved' THEN
        RAISE EXCEPTION 'only approved payments can be refunded';
    END IF;

    IF EXISTS (SELECT 1 FROM public.refund_requests
               WHERE payment_submission_id = p_payment_id
                 AND status IN ('pending', 'approved', 'processed')) THEN
        RAISE EXCEPTION 'a refund request already exists for this payment';
    END IF;

    -- ── THE CANONICAL RULE ────────────────────────────────────────────────
    v_first_nontrailer := public.account_has_nontrailer_watch(v_payment.account_id);
    v_eligible := v_first_nontrailer IS NULL;  -- trailers NEVER count

    INSERT INTO public.refund_requests (
        payment_submission_id, account_id, requested_by_user_id,
        reason, was_eligible_at_request, first_nontrailer_watched_at
    ) VALUES (
        p_payment_id, v_payment.account_id, auth.uid(),
        trim(p_reason), v_eligible, v_first_nontrailer
    ) RETURNING id INTO v_request_id;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'request_id', v_request_id,
        'eligible', v_eligible,
        'message', CASE WHEN v_eligible
            THEN 'Refund request submitted. Our team will review it shortly.'
            ELSE 'This payment is not refundable because a movie or episode has already been watched. Your request was recorded for review.' END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.request_refund(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_refund(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 7. SYSTEM CHANGELOG (public read — powers the user-facing updates page)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_changelog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(30) NOT NULL,
    title TEXT NOT NULL,
    body_md TEXT NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'improvement'
        CHECK (category IN ('feature', 'fix', 'improvement', 'security', 'content')),
    severity VARCHAR(20) NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
    published_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    published_by UUID REFERENCES auth.users(id),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_system_changelog_published
    ON public.system_changelog(is_published, published_at DESC);

ALTER TABLE public.system_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published changelog entries"
    ON public.system_changelog FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Admins can manage changelog"
    ON public.system_changelog FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Seed one entry so the page is never empty after first deploy.
INSERT INTO public.system_changelog (version, title, body_md, category, severity, is_published, published_at)
VALUES
    ('2.0.0', 'Lantawon Lang 2.0 is live', E'The all-new cinema platform launches with:\n\n- Multi-mirror streaming with automatic failover\n- Solo / Plus / Max subscription plans\n- Local-first library that works offline\n- XP, levels and leaderboards', 'feature', 'major', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. FIX H2 — PAYMENT PROOFS BUCKET MUST BE PRIVATE
-- ============================================================================

UPDATE storage.buckets SET public = FALSE WHERE id = 'payment-proofs';

DROP POLICY IF EXISTS "Public read access to payment proofs" ON storage.objects;

-- ============================================================================
-- 9. TICKET MESSAGE ATTACHMENTS (multiple files, size-limited at upload)
-- ============================================================================

ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]';

-- Attachments bucket: private, per-user folders.
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', FALSE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload ticket attachments to own folder" ON storage.objects;
CREATE POLICY "Users upload ticket attachments to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users view own ticket attachments" ON storage.objects;
CREATE POLICY "Users view own ticket attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Admins view all ticket attachments" ON storage.objects;
CREATE POLICY "Admins view all ticket attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
