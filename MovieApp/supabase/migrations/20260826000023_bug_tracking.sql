-- ============================================================================
-- MIGRATION 23: BUG TRACKING SYSTEM
-- ============================================================================
-- Track bugs, issues, and fixes for Lantawon Lang 2.0

create table if not exists public.bugs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null check (status in ('open', 'in_progress', 'resolved', 'wontfix')),
  category text not null,
  affected_files text[] default '{}',
  reported_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_bugs_status on public.bugs(status);
create index if not exists idx_bugs_severity on public.bugs(severity);
create index if not exists idx_bugs_category on public.bugs(category);
create index if not exists idx_bugs_created_at on public.bugs(created_at);

-- RLS: Only admins can view/edit bugs
alter table public.bugs enable row level security;

revoke all on public.bugs from anon, authenticated;
grant usage on schema public to anon, authenticated;

create policy "Admins can view all bugs"
    on public.bugs for select
    using (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

create policy "Admins can create bugs"
    on public.bugs for insert
    with check (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

create policy "Admins can update bugs"
    on public.bugs for update
    using (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

create policy "Admins can delete bugs"
    on public.bugs for delete
    using (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- SEED: Add the 15 tracked bugs
-- ============================================================================

insert into public.bugs (title, description, severity, status, category, affected_files, resolution)
values
  (
    '#001 Username shows "Lantawon Viewer"',
    'User signs up with username "alice" but profile shows "Lantawon Viewer"',
    'high',
    'resolved',
    'auth',
    array['src/context/AuthContext.tsx', 'src/app/api/auth/init-profile/route.ts'],
    'Updated auth metadata to pass display_name. Enhanced init-profile to UPDATE profile row.'
  ),
  (
    '#002 Duplicates allowed at signup',
    'User could sign up with same email/username multiple times',
    'critical',
    'resolved',
    'auth',
    array['src/app/api/auth/check-signup/route.ts', 'src/app/(auth)/signup/page.tsx'],
    'Created check-signup endpoint. Validates email + username before payment step.'
  ),
  (
    '#003 Payments not saved',
    'User submits payment but it never appears in admin Payments tab',
    'critical',
    'resolved',
    'payments',
    array['src/app/api/payments/submit/route.ts', 'src/app/(auth)/signup/page.tsx'],
    'Created server-side /api/payments/submit. Uses service-role to bypass RLS timing issues.'
  ),
  (
    '#004 User can watch before payment approved',
    'User can browse/watch content immediately after payment submission',
    'critical',
    'resolved',
    'streaming',
    array['src/app/api/stream/resolve/route.ts'],
    'Fixed by resolving #003. Stream resolve already had correct pending_payment check.'
  ),
  (
    '#005 Plus/Max tiers not deleted from DB',
    'Business rule: only ₱349 Solo. But Plus/Max packages still in database.',
    'medium',
    'resolved',
    'database',
    array['supabase/migrations/20260826000022_device_management.sql'],
    'Ran migration 22. Deleted Plus/Max packages. Only Solo remains.'
  ),
  (
    '#006 Device RPC not found',
    'Console error: registerDevice fails. register_device RPC missing.',
    'high',
    'resolved',
    'device',
    array['src/lib/services/device-service.ts'],
    'Applied migration 22 to remote DB. RPC + user_devices table now created.'
  ),
  (
    '#007 Admin visible in Users tab',
    'Admin account shown in Users list. Attacker could target it.',
    'high',
    'resolved',
    'security',
    array['src/app/api/admin/users/route.ts', 'src/components/admin/tabs/AdminUsersTab.tsx'],
    'Filter admins: .neq("role", "admin"). Removed role dropdown. Added backend demotion check.'
  ),
  (
    '#008 Dashboard counts admin as user',
    'Dashboard shows "1 Total Users" (includes admin). Users tab shows 0 (excludes admin).',
    'medium',
    'resolved',
    'admin',
    array['src/components/admin/tabs/AdminOverviewTab.tsx'],
    'Updated dashboard query to exclude admins. Now consistent with Users tab.'
  ),
  (
    '#009 Backup file in codebase',
    'Found src/app/(auth)/signup/page.tsx.bak cluttering repo',
    'low',
    'resolved',
    'cleanup',
    array['src/app/(auth)/signup/page.tsx.bak'],
    'Deleted backup file. Ran: find src -name "*.bak" | xargs rm'
  ),
  (
    '#010 Delete user fails',
    'Admin tries to delete user. "Failed to delete user" error.',
    'high',
    'resolved',
    'admin',
    array['src/app/api/admin/users/route.ts'],
    'Updated DELETE handler. Clean up order: subscriptions → accounts → payments → devices → auth user.'
  ),
  (
    '#011 Tier shows "free" not "solo"',
    'User subscribes to Solo Pass but tier displays as "free"',
    'medium',
    'resolved',
    'subscription',
    array['src/context/AuthContext.tsx', 'src/app/api/auth/profile/route.ts', 'src/lib/auth/entitlement-engine.ts'],
    'Updated /api/auth/profile to resolve tier from subscription. Changed types: "pro" → "solo".'
  ),
  (
    '#012 No payment warning on home',
    'User auto-logged in with pending payment. No warning shown.',
    'high',
    'resolved',
    'ui',
    array['src/app/(platform)/home/page.tsx'],
    'Added amber warning banner: "Payment Under Review". Link to /account/subscription.'
  ),
  (
    '#013 Admin password not enforced',
    'Admin gets default password. No forced change.',
    'high',
    'resolved',
    'security',
    array['src/app/admin/page.tsx'],
    'Added security warning on /admin page. Shows on first visit. Link to change password.'
  ),
  (
    '#014 Database profiles wiped',
    'All profiles disappeared from database. Admin + users gone.',
    'critical',
    'resolved',
    'database',
    array['scripts/restore-data.mjs'],
    'Created restoration scripts. Restored admin + test users. Recreated accounts/subscriptions/payments.'
  ),
  (
    '#015 Payment not saved on signup',
    'User submitted payment. Never appeared in admin panel. Account never created.',
    'critical',
    'resolved',
    'payments',
    array['scripts/fix-setup-user.mjs'],
    'Manually created account + subscription + payment. Verified in admin Payments tab.'
  );
