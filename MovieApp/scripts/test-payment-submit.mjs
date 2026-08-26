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

console.log('\n📝 CREATING TEST PAYMENT\n');

// Get setupgaming user
const { data: profile } = await admin
  .from('profiles')
  .select('id')
  .eq('username', 'setupgaming')
  .single();

if (!profile) {
  console.log('❌ setupgaming user not found');
  process.exit(0);
}

// Get their account
const { data: account } = await admin
  .from('accounts')
  .select('id')
  .eq('owner_user_id', profile.id)
  .single();

if (!account) {
  console.log('❌ Account not found');
  process.exit(0);
}

// Get Solo package
const { data: solo } = await admin
  .from('subscription_packages')
  .select('id')
  .eq('code', 'solo')
  .single();

if (!solo) {
  console.log('❌ Solo package not found');
  process.exit(0);
}

// Submit payment
const { error } = await admin.from('payment_submissions').insert({
  account_id: account.id,
  submitted_by_user_id: profile.id,
  package_id: solo.id,
  amount: 349,
  currency: 'PHP',
  payment_method: 'gcash',
  reference_number: 'TEST-0001',
  status: 'pending',
});

if (error) {
  console.log(`❌ Error: ${error.message}`);
} else {
  console.log('✅ Payment submitted');
  console.log(`   User: setupgaming`);
  console.log(`   Reference: TEST-0001`);
  console.log(`   Amount: ₱349\n`);
}
