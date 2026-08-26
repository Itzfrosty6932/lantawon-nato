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

console.log('\n🔧 FIXING setupgaming USER\n');

const { data: profile } = await admin
  .from('profiles')
  .select('id')
  .eq('username', 'setupgaming')
  .single();

if (!profile) {
  console.log('❌ User not found');
  process.exit(0);
}

// Create account
const { data: acc, error: accErr } = await admin.from('accounts').insert({
  owner_user_id: profile.id,
  name: 'setupgaming Account',
  status: 'active',
}).select().single();

if (accErr) {
  console.log(`❌ Account error: ${accErr.message}`);
  process.exit(0);
}

console.log(`✅ Account created: ${acc.id}\n`);

// Get Solo package
const { data: solo } = await admin
  .from('subscription_packages')
  .select('id')
  .eq('code', 'solo')
  .single();

// Create subscription
const { error: subErr } = await admin.from('subscriptions').insert({
  account_id: acc.id,
  current_package_id: solo.id,
  status: 'pending_payment',
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
});

if (!subErr) {
  console.log('✅ Subscription created (pending_payment)\n');
}

// Create payment submission
const { error: payErr } = await admin.from('payment_submissions').insert({
  account_id: acc.id,
  submitted_by_user_id: profile.id,
  package_id: solo.id,
  amount: 349,
  currency: 'PHP',
  payment_method: 'gcash',
  reference_number: 'SETUP-0001',
  status: 'pending',
});

if (!payErr) {
  console.log('✅ Payment submission created\n');
} else {
  console.log(`❌ Payment error: ${payErr.message}\n`);
}

console.log('✅ setupgaming user now has:');
console.log('   • Account');
console.log('   • Solo Pass subscription (pending_payment)');
console.log('   • Payment submission (SETUP-0001)\n');
