import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
for (const line of raw.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n🔍 AUDIT: Orphaned pending users (no payment record to verify)\n');

// All non-admin profiles
const { data: profiles } = await admin
  .from('profiles')
  .select('id, username, display_name, role')
  .neq('role', 'admin');

// All payment submissions
const { data: payments } = await admin
  .from('payment_submissions')
  .select('id, submitted_by_user_id, account_id, status, reference_number');

const paymentsByUser = new Map();
for (const p of payments || []) {
  if (!paymentsByUser.has(p.submitted_by_user_id)) paymentsByUser.set(p.submitted_by_user_id, []);
  paymentsByUser.get(p.submitted_by_user_id).push(p);
}

// All accounts + subscriptions
const { data: accounts } = await admin
  .from('accounts')
  .select('id, owner_user_id, name, status');
const accountByOwner = new Map((accounts || []).map((a) => [a.owner_user_id, a]));

const { data: subs } = await admin
  .from('subscriptions')
  .select('id, account_id, status');
const subByAccount = new Map((subs || []).map((s) => [s.account_id, s]));

const orphans = [];
for (const prof of profiles || []) {
  const acct = accountByOwner.get(prof.id);
  const sub = acct ? subByAccount.get(acct.id) : null;
  const userPayments = paymentsByUser.get(prof.id) || [];

  const isPendingLike =
    (sub && sub.status === 'pending_payment') ||
    (acct && acct.status === 'pending') ||
    (!acct && !sub); // signed up, nothing created at all

  if (isPendingLike && userPayments.length === 0) {
    orphans.push({
      id: prof.id,
      username: prof.username || prof.display_name,
      hasAccount: !!acct,
      hasSubscription: !!sub,
      subStatus: sub?.status || 'none',
      acctStatus: acct?.status || 'none',
    });
  }
}

console.log(`Total non-admin profiles: ${(profiles || []).length}`);
console.log(`Total payment submissions: ${(payments || []).length}`);
console.log(`\n⚠️  ORPHANED (pending-like, zero payments): ${orphans.length}\n`);
for (const o of orphans) {
  console.log(`  • ${o.username}  [${o.id.slice(0, 8)}]`);
  console.log(`      account=${o.hasAccount} (${o.acctStatus})  subscription=${o.hasSubscription} (${o.subStatus})  payments=0`);
}
if (orphans.length === 0) console.log('  ✅ None — every pending user has a payment record.');
console.log('');
