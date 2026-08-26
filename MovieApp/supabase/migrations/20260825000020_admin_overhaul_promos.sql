-- ============================================================================
-- MIGRATION 20: ADMIN OVERHAUL — SINGLE PLAN + PROMOS + POLICY ALIGNMENT
-- ============================================================================
-- Supports the 10-tab admin portal rebuild:
--   1. Single-plan architecture: the platform sells ONE subscription
--      ("Solo Pass"). Plus/Max are retired (is_active = false) so every
--      public surface (landing hero card, /pricing, checkout) shows the
--      exact same plan the admin edits.
--   2. Promo discounts live directly on the package: a percentage off,
--      an optional label ("Launch Promo"), and a hard expiry timestamp.
--      When promo_expires_at passes, surfaces simply stop rendering the
--      promo — no cron job needed (the check is computed at read time).
--   3. audit_logs SELECT policy aligned with is_caller_admin() so
--      super_admin accounts can actually see the Audits tab.
--
-- NOTE: user-management writes (role changes, deletes) go through
-- /api/admin/* server routes using the service-role key because profiles
-- UPDATE is owner-only under RLS and auth.users cannot be touched via
-- PostgREST. Those routes write audit_logs themselves.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROMO FIELDS ON THE PACKAGE ITSELF
-- ----------------------------------------------------------------------------
ALTER TABLE public.subscription_packages
  ADD COLUMN IF NOT EXISTS promo_percent INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promo_label TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Guard against nonsense discounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_packages_promo_percent_check'
  ) THEN
    ALTER TABLE public.subscription_packages
      ADD CONSTRAINT subscription_packages_promo_percent_check
      CHECK (promo_percent IS NULL OR promo_percent BETWEEN 1 AND 100);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- SINGLE-PLAN ARCHITECTURE
-- ----------------------------------------------------------------------------
UPDATE public.subscription_packages
SET is_active = false, updated_at = TIMEZONE('utc', NOW())
WHERE code IN ('plus', 'max');

-- ----------------------------------------------------------------------------
-- AUDIT LOG VISIBILITY: admin OR super_admin (matches is_caller_admin())
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_caller_admin());

-- Normalize the remaining per-table admin policies onto is_caller_admin()
-- so every billing surface treats super_admin identically.
DROP POLICY IF EXISTS "Admins can review all payments" ON public.payment_submissions;
CREATE POLICY "Admins can review all payments"
    ON public.payment_submissions FOR ALL
    USING (public.is_caller_admin());

DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage all tickets"
    ON public.support_tickets FOR ALL
    USING (public.is_caller_admin());

DROP POLICY IF EXISTS "Only admins can manage packages" ON public.subscription_packages;
CREATE POLICY "Only admins can manage packages"
    ON public.subscription_packages FOR ALL
    USING (public.is_caller_admin());
