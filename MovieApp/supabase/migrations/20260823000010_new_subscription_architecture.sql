-- ============================================================================
-- MIGRATION 10: NEW SUBSCRIPTION ARCHITECTURE
-- Lantawon Lang - Accounts, Packages, Sessions Model
-- ============================================================================
-- Replaces old subscription_plans with new session-based architecture

-- 1. Subscription Packages (Solo/Plus/Max)
CREATE TABLE IF NOT EXISTS public.subscription_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_php NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PHP',
    billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),

    -- Session limit (NOT member limit)
    max_concurrent_sessions INTEGER NOT NULL DEFAULT 1,

    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Accounts (billing container)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled', 'expired')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Account Members (who can use the account)
CREATE TABLE IF NOT EXISTS public.account_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'removed', 'inactive_due_to_package')),

    joined_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    removed_at TIMESTAMPTZ,

    UNIQUE(account_id, user_id)
);

-- 4. Subscriptions (belong to account)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

    current_package_id UUID REFERENCES public.subscription_packages(id),
    pending_package_id UUID REFERENCES public.subscription_packages(id),
    package_change_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'expired', 'pending_payment')),

    current_period_start TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),

    UNIQUE(account_id)
);

-- 5. Payment Submissions (manual GCash verification)
CREATE TABLE IF NOT EXISTS public.payment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.subscription_packages(id),
    submitted_by_user_id UUID NOT NULL REFERENCES auth.users(id),

    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PHP',
    payment_method VARCHAR(50) DEFAULT 'gcash',
    reference_number VARCHAR(200),
    proof_image_url TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

    submitted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT
);

-- 6. Member Sessions (authentication sessions, NOT devices)
CREATE TABLE IF NOT EXISTS public.member_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,

    session_identifier TEXT NOT NULL,
    device_name VARCHAR(200),
    device_type VARCHAR(50),
    platform VARCHAR(50),
    browser VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

-- 7. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,

    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id),

    subject VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('forgot_password', 'account', 'subscription', 'payment', 'playback', 'technical', 'bug_report', 'content', 'other')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),

    assigned_to UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    closed_at TIMESTAMPTZ
);

-- 8. Support Messages
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES auth.users(id),

    message TEXT NOT NULL,
    attachment_url TEXT,
    is_internal BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Audit Logs (minimal - only important admin actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,

    old_data JSONB,
    new_data JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_owner ON public.accounts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_account_members_account ON public.account_members(account_id);
CREATE INDEX IF NOT EXISTS idx_account_members_user ON public.account_members(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_account ON public.subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package ON public.subscriptions(current_package_id);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_status ON public.payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_member_sessions_user ON public.member_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_member_sessions_account ON public.member_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_member_sessions_status ON public.member_sessions(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_account ON public.support_tickets(account_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id);

-- ============================================================================
-- SEED DATA: Subscription Packages
-- ============================================================================

INSERT INTO public.subscription_packages (code, name, description, price_php, max_concurrent_sessions, display_order, is_active)
VALUES
    ('solo', 'Solo', '1 active session at a time. Perfect for individual use.', 149.00, 1, 1, true),
    ('plus', 'Plus', '3 active sessions at a time. Great for sharing with family.', 249.00, 3, 2, true),
    ('max', 'Max', '5 active sessions at a time. Maximum flexibility for larger groups.', 349.00, 5, 3, true)
ON CONFLICT (code) DO UPDATE SET price_php = EXCLUDED.price_php;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_packages_updated_at BEFORE UPDATE ON public.subscription_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Auto-generate ticket numbers
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'LL-' || LPAD(CAST(FLOOR(RANDOM() * 999999) AS TEXT), 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number BEFORE INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();
