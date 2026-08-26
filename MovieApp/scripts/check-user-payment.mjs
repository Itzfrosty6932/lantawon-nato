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

console.log('\n🔍 CHECKING setupgaming USER\n');

// Get the user
const { data: profile } = await admin
  .from('profiles')
  .select('id, username, email, role')
  .eq('username', 'setupgaming')
  .single();

if (!profile) {
  console.log('❌ User not found');
  process.exit(0);
}

console.log(`✓ Found: ${profile.email}`);
console.log(`  ID: ${profile.id}\n`);

// Get account
const { data: account } = await admin
  .from('accounts')
  .select('id, name, status')
  .eq('owner_user_id', profile.id)
  .single();

if (account) {
  console.log(`✓ Account: ${account.name} (${account.status})`);
  console.log(`  ID: ${account.id}\n`);
}

// Get subscription
const { data: sub } = await admin
  .from('subscriptions')
  .select('id, status, current_package_id')
  .eq('account_id', account?.id)
  .single();

if (sub) {
  console.log(`✓ Subscription: ${sub.status}`);
  const { data: pkg } = await admin
    .from('subscription_packages')
    .select('code')
    .eq('id', sub.current_package_id)
    .single();
  console.log(`  Package: ${pkg?.code || 'unknown'}\n`);
}

// Check for payment submissions
const { data: payments } = await admin
  .from('payment_submissions')
  .select('id, status, reference_number, created_at')
  .eq('submitted_by_user_id', profile.id);

console.log(`💳 PAYMENT SUBMISSIONS:\n`);
if (payments && payments.length > 0) {
  payments.forEach(p => {
    console.log(`  ✓ ${p.reference_number} (${p.status})`);
    console.log(`    Created: ${p.created_at}\n`);
  });
} else {
  console.log(`  ❌ NO PAYMENTS FOUND\n`);
  console.log(`  Problem: User submitted payment but it wasn't saved!\n`);
}

