-- ============================================================================
-- MIGRATION 11: RLS POLICIES FOR NEW SUBSCRIPTION ARCHITECTURE
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUBSCRIPTION PACKAGES: Public read for active packages
-- ============================================================================

CREATE POLICY "Anyone can view active packages"
    ON public.subscription_packages FOR SELECT
    USING (is_active = true);

CREATE POLICY "Only admins can manage packages"
    ON public.subscription_packages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- ACCOUNTS: Users can view/create their own accounts
-- ============================================================================

CREATE POLICY "Users can view their own accounts"
    ON public.accounts FOR SELECT
    USING (
        owner_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.account_members
            WHERE account_id = accounts.id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

CREATE POLICY "Users can create their own account"
    ON public.accounts FOR INSERT
    WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Only account owner can update account"
    ON public.accounts FOR UPDATE
    USING (owner_user_id = auth.uid());

CREATE POLICY "Admins can view all accounts"
    ON public.accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- ACCOUNT MEMBERS: Members can view, owners can manage, users can self-insert as owner
-- ============================================================================

CREATE POLICY "Members can view their own membership"
    ON public.account_members FOR SELECT
    USING (
        user_id = auth.uid()
        OR account_id IN (
            SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can self-insert as account owner"
    ON public.account_members FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND role = 'owner'
        AND status = 'active'
        AND account_id IN (
            SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Account owners can manage members"
    ON public.account_members FOR ALL
    USING (
        account_id IN (
            SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- SUBSCRIPTIONS: Account members can view, owners can update
-- ============================================================================

CREATE POLICY "Account members can view subscription"
    ON public.subscriptions FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM public.account_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR account_id IN (
            SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Account owners can update subscription"
    ON public.subscriptions FOR UPDATE
    USING (
        account_id IN (
            SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- PAYMENT SUBMISSIONS: Users submit, admins review
-- ============================================================================

CREATE POLICY "Users can view their own payment submissions"
    ON public.payment_submissions FOR SELECT
    USING (
        submitted_by_user_id = auth.uid()
        OR account_id IN (
            SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create payment submissions"
    ON public.payment_submissions FOR INSERT
    WITH CHECK (submitted_by_user_id = auth.uid());

CREATE POLICY "Admins can review all payments"
    ON public.payment_submissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- MEMBER SESSIONS: Users can view/revoke their own sessions
-- ============================================================================

CREATE POLICY "Users can view their own sessions"
    ON public.member_sessions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can revoke their own sessions"
    ON public.member_sessions FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
    ON public.member_sessions FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- SUPPORT TICKETS: Users can view their own, admins can view all
-- ============================================================================

CREATE POLICY "Users can view their own tickets"
    ON public.support_tickets FOR SELECT
    USING (
        created_by_user_id = auth.uid()
        OR account_id IN (
            SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tickets"
    ON public.support_tickets FOR INSERT
    WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Admins can manage all tickets"
    ON public.support_tickets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- SUPPORT MESSAGES: Users can view/create for their tickets
-- ============================================================================

CREATE POLICY "Users can view messages for their tickets"
    ON public.support_messages FOR SELECT
    USING (
        ticket_id IN (
            SELECT id FROM public.support_tickets
            WHERE created_by_user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create messages for their tickets"
    ON public.support_messages FOR INSERT
    WITH CHECK (
        sender_user_id = auth.uid()
        AND (
            ticket_id IN (
                SELECT id FROM public.support_tickets
                WHERE created_by_user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- ============================================================================
-- AUDIT LOGS: Admins only
-- ============================================================================

CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can create audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);
