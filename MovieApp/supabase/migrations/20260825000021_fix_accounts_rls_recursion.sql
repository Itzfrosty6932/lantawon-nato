-- ============================================================================
-- MIGRATION 21: FIX 42P17 INFINITE RECURSION IN ACCOUNT RLS POLICIES
-- ============================================================================
-- Symptom:
--   ERROR 42P17 "infinite recursion detected in policy for relation
--   \"accounts\"" whenever any surface queried payment_submissions,
--   subscriptions, support_tickets, refund_requests or accounts themselves.
--
-- Root cause (policy cycle):
--   accounts SELECT policy        -> subqueries account_members
--   account_members policies      -> subquery back into accounts
--   ...and subscriptions / payment_submissions / support_tickets /
--       refund_requests policies subquery accounts as well, so ANY query
--       touching those tables re-entered the cycle.
--
-- Fix (the canonical Postgres pattern):
--   Move the cross-table checks into SECURITY DEFINER functions. Inside a
--   definer function owned by the table owner, RLS is not re-evaluated, so
--   policies can never recurse. Every policy below now calls a helper
--   instead of sub-querying a peer table directly.
--
-- Semantics are preserved exactly:
--   user_is_account_owner(acc)    := accounts.owner_user_id = auth.uid()
--   user_can_access_account(acc)  := owner OR active account_members row
-- ============================================================================

-- ----------------------------------------------------------------------------
-- HELPERS (SECURITY DEFINER => immune to RLS => breaks the cycle)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_is_account_owner(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE id = p_account_id
          AND owner_user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_account(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.accounts
        WHERE id = p_account_id
          AND owner_user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.account_members
        WHERE account_id = p_account_id
          AND user_id = auth.uid()
          AND status = 'active'
    );
$$;

REVOKE EXECUTE ON FUNCTION public.user_is_account_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_is_account_owner(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.user_can_access_account(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_account(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- ACCOUNTS — replace the recursive SELECT policy
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
CREATE POLICY "Users can view their own accounts"
    ON public.accounts FOR SELECT
    USING (public.user_can_access_account(id));

-- Owner-only UPDATE never recursed (simple column compare) — leave as-is.
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
CREATE POLICY "Admins can view all accounts"
    ON public.accounts FOR SELECT
    USING (public.is_caller_admin());

-- "Users can create their own account" (migration 15) is a plain WITH CHECK
-- on owner_user_id — safe, untouched.

-- ----------------------------------------------------------------------------
-- ACCOUNT MEMBERS — both policies sub-queried accounts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view their own membership" ON public.account_members;
CREATE POLICY "Members can view their own membership"
    ON public.account_members FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.user_is_account_owner(account_id)
    );

DROP POLICY IF EXISTS "Account owners can manage members" ON public.account_members;
CREATE POLICY "Account owners can manage members"
    ON public.account_members FOR ALL
    USING (public.user_is_account_owner(account_id));

-- ----------------------------------------------------------------------------
-- SUBSCRIPTIONS — policies sub-queried BOTH accounts and account_members
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Account members can view subscription" ON public.subscriptions;
CREATE POLICY "Account members can view subscription"
    ON public.subscriptions FOR SELECT
    USING (public.user_can_access_account(account_id));

DROP POLICY IF EXISTS "Owners can create pending subscription" ON public.subscriptions;
CREATE POLICY "Owners can create pending subscription"
    ON public.subscriptions FOR INSERT
    WITH CHECK (
        public.user_is_account_owner(account_id)
        AND status = 'pending_payment'
    );

-- ----------------------------------------------------------------------------
-- PAYMENT SUBMISSIONS — owner-side SELECT sub-queried accounts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own payment submissions" ON public.payment_submissions;
CREATE POLICY "Users can view their own payment submissions"
    ON public.payment_submissions FOR SELECT
    USING (
        submitted_by_user_id = auth.uid()
        OR public.user_is_account_owner(account_id)
    );

-- ----------------------------------------------------------------------------
-- SUPPORT TICKETS — owner-side SELECT sub-queried accounts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own tickets"
    ON public.support_tickets FOR SELECT
    USING (
        created_by_user_id = auth.uid()
        OR public.user_is_account_owner(account_id)
    );

-- ----------------------------------------------------------------------------
-- REFUND REQUESTS — both policies sub-queried accounts (migration 15)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own refund requests" ON public.refund_requests;
CREATE POLICY "Users can view their own refund requests"
    ON public.refund_requests FOR SELECT
    USING (
        requested_by_user_id = auth.uid()
        OR public.user_is_account_owner(account_id)
    );

DROP POLICY IF EXISTS "Users can create refund requests for their account" ON public.refund_requests;
CREATE POLICY "Users can create refund requests for their account"
    ON public.refund_requests FOR INSERT
    WITH CHECK (
        requested_by_user_id = auth.uid()
        AND public.user_is_account_owner(account_id)
    );

-- ----------------------------------------------------------------------------
-- SANITY: report any remaining policies that still reference peer billing
-- tables directly, so a future migration cannot silently reintroduce a cycle.
-- (Runs at migration time; pure diagnostics, fails nothing.)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('accounts', 'account_members', 'subscriptions',
                            'payment_submissions', 'support_tickets', 'refund_requests')
          AND (
            qual::text LIKE '%FROM public.accounts%'
            OR qual::text LIKE '%FROM public.account_members%'
            OR with_check::text LIKE '%FROM public.accounts%'
            OR with_check::text LIKE '%FROM public.account_members%'
          )
    LOOP
        RAISE WARNING 'Policy %.% still sub-queries accounts/account_members directly', pol.tablename, pol.policyname;
    END LOOP;
END $$;
