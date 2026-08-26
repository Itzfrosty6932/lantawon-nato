#!/usr/bin/env node
// ============================================================================
// DATABASE SEEDER — post-migration bootstrap
// ============================================================================
// Idempotent. Run after `npm run db:migrate` on a fresh/reset database:
//   1. Creates the ADMIN auth user (ItzFrosty) + profile (role=admin)
//      + user_preferences row
//   2. Verifies Solo/Plus/Max packages exist (migration 10 seeds them;
//      this repairs if missing)
//   3. Creates ONE subscribed MEMBER account — full real-world billing
//      chain: auth user → profile → account → ACTIVE subscription
//      (Solo) → APPROVED payment submission. No fake XP, no leaderboard
//      filler — leaderboards grow organically from real watches only.
//
// Usage: npm run db:seed
// Env:   SUPABASE_SERVICE_ROLE_KEY in .env.local (required)
//        ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_USERNAME  (admin login)
//        MEMBER_EMAIL / MEMBER_PASSWORD / MEMBER_USERNAME (member login)
// ============================================================================

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* optional */
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'itzjoshuawayman@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'LantawonAdmin!2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'ItzFrosty';

// The sample subscribed member ("kunwari may nag-subscribe na sa akin").
const MEMBER_EMAIL = process.env.MEMBER_EMAIL ?? 'juan.member@gmail.com';
const MEMBER_PASSWORD = process.env.MEMBER_PASSWORD ?? 'LantawonMember!2026';
const MEMBER_USERNAME = process.env.MEMBER_USERNAME ?? 'JuanMember';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\n✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n'
  );
  process.exit(1);
}

// Service role bypasses RLS — server-side only.
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page++;
  }
}

async function seedUser({ email, password, username, role }) {
  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: username },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  ✓ created auth user ${email}`);
  } else {
    console.log(`  ↷ auth user ${email} already exists`);
  }

  // Profile row (handle_new_user trigger may have missed pre-existing users)
  const { error: profErr } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      username,
      display_name: username,
      role,
    },
    { onConflict: 'id' }
  );
  if (profErr) throw profErr;

  // Preferences row (idempotent)
  await supabase.from('user_preferences').upsert({ user_id: user.id }, { onConflict: 'user_id' });

  console.log(`  ✓ profile ready (${role})`);
  return user.id;
}

async function seedPackages() {
  const packages = [
    ['solo', 'Solo', '1 active session at a time. Perfect for individual use.', 149.0, 1, 1],
    ['plus', 'Plus', '3 active sessions at a time. Great for sharing with family.', 249.0, 3, 2],
    ['max', 'Max', '5 active sessions at a time. Maximum flexibility for larger groups.', 349.0, 5, 3],
  ];
  for (const [code, name, description, price, sessions, order] of packages) {
    const { error } = await supabase.from('subscription_packages').upsert(
      { code, name, description, price_php: price, max_concurrent_sessions: sessions, display_order: order, is_active: true },
      { onConflict: 'code' }
    );
    if (error) throw error;
  }
  console.log('  ✓ packages verified: solo / plus / max');
}

/**
 * Full real-world subscription chain for the sample member:
 *   auth user → profile → account → active Solo subscription
 *   → approved payment submission.
 * Mirrors exactly what the app produces after an admin approves a real
 * payment — so the member can log in and watch immediately.
 */
async function seedSubscribedMember() {
  const userId = await seedUser({
    email: MEMBER_EMAIL,
    password: MEMBER_PASSWORD,
    username: MEMBER_USERNAME,
    role: 'user',
  });

  // 1. Account owned by the member
  let { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (!account) {
    const { data: created, error } = await supabase
      .from('accounts')
      .insert({ name: `${MEMBER_USERNAME}'s Account`, owner_user_id: userId, status: 'active' })
      .select()
      .single();
    if (error) throw error;
    account = created;
    console.log(`  ✓ account created (${account.id.slice(0, 8)}…)`);
  } else {
    console.log('  ↷ account already exists');
  }

  // Owner membership row
  const { data: existingMember } = await supabase
    .from('account_members')
    .select('id')
    .eq('account_id', account.id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!existingMember) {
    const { error } = await supabase.from('account_members').insert({
      account_id: account.id,
      user_id: userId,
      role: 'owner',
      status: 'active',
    });
    if (error) throw error;
  }

  // 2. Active Solo subscription
  const { data: soloPkg } = await supabase
    .from('subscription_packages')
    .select('*')
    .eq('code', 'solo')
    .single();
  if (!soloPkg) throw new Error('Solo package missing — package seeding failed?');

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('account_id', account.id)
    .maybeSingle();

  if (!existingSub) {
    const { error } = await supabase.from('subscriptions').insert({
      account_id: account.id,
      current_package_id: soloPkg.id,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    });
    if (error) throw error;
    console.log('  ✓ active Solo subscription (30-day period)');
  } else {
    // Repair stale state: if the seeded member's sub isn't active, activate it
    if (existingSub.status !== 'active') {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', current_package_id: soloPkg.id })
        .eq('id', existingSub.id);
      if (error) throw error;
      console.log(`  ↷ repaired subscription status → active (was ${existingSub.status})`);
    } else {
      console.log('  ↷ subscription already active');
    }
  }

  // 3. Approved payment submission (the audit trail of their "payment")
  const { data: existingPayment } = await supabase
    .from('payment_submissions')
    .select('id')
    .eq('submitted_by_user_id', userId)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();

  if (!existingPayment) {
    const { error } = await supabase.from('payment_submissions').insert({
      account_id: account.id,
      package_id: soloPkg.id,
      submitted_by_user_id: userId,
      amount: soloPkg.price_php,
      currency: 'PHP',
      payment_method: 'gcash',
      reference_number: `SEED-${now.getTime().toString().slice(-8)}`,
      proof_image_url: '',
      status: 'approved',
      reviewed_at: now.toISOString(),
    });
    if (error) throw error;
    console.log('  ✓ approved Solo payment recorded');
  } else {
    console.log('  ↷ approved payment already recorded');
  }
}

async function main() {
  console.log('\n→ Seeding Lantawon Lang database\n');

  console.log('[1/3] Admin account');
  await seedUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, username: ADMIN_USERNAME, role: 'admin' });

  console.log('[2/3] Subscription packages');
  await seedPackages();

  console.log('[3/3] Sample subscribed member');
  await seedSubscribedMember();

  console.log('\n✅ Seed complete.');
  console.log(`   Admin login : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`   Member login: ${MEMBER_EMAIL} / ${MEMBER_PASSWORD}\n`);
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message ?? err);
  process.exit(1);
});
