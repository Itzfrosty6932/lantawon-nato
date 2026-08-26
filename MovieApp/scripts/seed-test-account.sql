-- ============================================================================
-- DEV-ONLY SEED: ItzFrosty test account
-- ============================================================================
-- ⚠️ RUN ONLY IN LOCAL/DEV. Never run in production.
--
-- Creates the canonical test user (ItzFrosty / itzjoshuawayman@gmail.com)
-- with an ACTIVE monthly subscription so the manual-payment flow, refund
-- flow, and player can be exercised end-to-end.
--
-- The auth.users row CANNOT be created from plain SQL (password hashing is
-- managed by GoTrue), so this script assumes the account was created via the
-- normal /signup UI first, then:
--   1. promotes it to admin (server-side role checks read profiles.role);
--   2. wires up its billing container + active monthly Solo subscription;
--   3. inserts a sample APPROVED payment into history.
--
-- Usage: paste into the Supabase SQL editor while pointed at the DEV project,
-- after signing up ItzFrosty through /signup.
-- ============================================================================

BEGIN;

CREATE TEMP TABLE seed_ctx AS
SELECT
  u.id AS user_id,
  p.id AS profile_id
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'itzjoshuawayman@gmail.com'
LIMIT 1;

-- Guard: stop if the signup hasn't happened yet.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM seed_ctx) THEN
    RAISE EXCEPTION 'ItzFrosty not found — sign up via /signup first, then re-run this script.';
  END IF;
END $$;

-- 1) Promote to admin (server-side role checks read profiles.role).
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT profile_id FROM seed_ctx);

-- 2) Ensure the Solo package exists (matches migration 10 seeds).
INSERT INTO public.subscription_packages (code, name, description, price_php, max_concurrent_sessions, display_order, is_active)
VALUES ('solo', 'Solo', '1 active session at a time.', 149.00, 1, 1, true)
ON CONFLICT (code) DO NOTHING;

-- 3) Billing container + owner membership + ACTIVE monthly subscription.
INSERT INTO public.accounts (name, owner_user_id, status)
SELECT 'ItzFrosty''s Account', user_id, 'active' FROM seed_ctx
ON CONFLICT DO NOTHING;

INSERT INTO public.account_members (account_id, user_id, role, status)
SELECT a.id, a.owner_user_id, 'owner', 'active'
FROM public.accounts a
WHERE a.owner_user_id = (SELECT user_id FROM seed_ctx)
ON CONFLICT (account_id, user_id) DO NOTHING;

INSERT INTO public.subscriptions
  (account_id, current_package_id, status, current_period_start, current_period_end)
SELECT
  a.id,
  sp.id,
  'active',
  TIMEZONE('utc', NOW()),
  TIMEZONE('utc', NOW() + INTERVAL '30 days')
FROM public.accounts a
CROSS JOIN public.subscription_packages sp
WHERE a.owner_user_id = (SELECT user_id FROM seed_ctx)
  AND sp.code = 'solo'
ON CONFLICT (account_id) DO UPDATE SET
  status = 'active',
  current_package_id = EXCLUDED.current_package_id,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = TIMEZONE('utc', NOW());

-- 4) Sample APPROVED payment in history (dev-only; no proof attached).
INSERT INTO public.payment_submissions
  (account_id, package_id, submitted_by_user_id, amount, reference_number, proof_image_url, status, submitted_at, reviewed_at)
SELECT
  s.account_id,
  s.current_package_id,
  (SELECT user_id FROM seed_ctx),
  149.00,
  'DEV-SEED-000001',
  NULL,
  'approved',
  TIMEZONE('utc', NOW()),
  TIMEZONE('utc', NOW())
FROM public.subscriptions s
WHERE s.account_id IN (
  SELECT a.id FROM public.accounts a WHERE a.owner_user_id = (SELECT user_id FROM seed_ctx)
)
LIMIT 1;

COMMIT;

-- ============================================================================
-- POST-CHECK QUERIES (run manually to verify):
--   SELECT p.username, p.role FROM public.profiles p
--     JOIN auth.users u ON u.id = p.id
--     WHERE u.email = 'itzjoshuawayman@gmail.com';
--
--   SELECT s.status, s.current_period_end FROM public.subscriptions s
--     JOIN public.accounts a ON a.id = s.account_id
--     WHERE a.owner_user_id =
--       (SELECT id FROM auth.users WHERE email = 'itzjoshuawayman@gmail.com');
-- ============================================================================
