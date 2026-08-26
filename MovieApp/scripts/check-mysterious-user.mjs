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

console.log('\n🔍 CHECKING MYSTERIOUS USER: juan.member@gmail.com\n');

// Find the auth user
const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 500 });
const juan = authUsers?.users?.find(u => u.email === 'juan.member@gmail.com');

if (!juan) {
  console.log('❌ User juan.member@gmail.com NOT found in auth.users');
  process.exit(0);
}

console.log(`✓ Found in auth.users:`);
console.log(`  ID: ${juan.id}`);
console.log(`  Email: ${juan.email}`);
console.log(`  Created: ${juan.created_at}`);
console.log(`  Last Sign In: ${juan.last_sign_in_at || 'Never'}`);
console.log();

// Check profile
const { data: profile } = await admin
  .from('profiles')
  .select('*')
  .eq('id', juan.id)
  .single();

if (profile) {
  console.log(`✓ Found in profiles:`);
  console.log(`  Username: ${profile.username}`);
  console.log(`  Display Name: ${profile.display_name}`);
  console.log(`  Role: ${profile.role}`);
  console.log(`  Created: ${profile.created_at}`);
}

// Check account
const { data: account } = await admin
  .from('accounts')
  .select('*')
  .eq('owner_user_id', juan.id)
  .single();

if (account) {
  console.log(`\n✓ Found in accounts:`);
  console.log(`  Account ID: ${account.id}`);
  console.log(`  Account Name: ${account.name}`);
  console.log(`  Status: ${account.status}`);
}

// Check subscription
const { data: subs } = await admin
  .from('subscriptions')
  .select('*')
  .eq('account_id', account?.id);

if (subs?.length > 0) {
  console.log(`\n✓ Found ${subs.length} subscription(s):`);
  subs.forEach(s => {
    console.log(`  - Status: ${s.status}, Period End: ${s.current_period_end}`);
  });
}

// Try to delete
console.log(`\n🗑️  Attempting to delete user...\n`);

try {
  const { error } = await admin.auth.admin.deleteUser(juan.id);
  
  if (error) {
    console.log(`❌ Delete failed: ${error.message}`);
    console.log(`   Error Code: ${error.code}`);
    console.log(`\n   Likely cause: Cascading constraints or RLS policies`);
    console.log(`   Solution: Clean up related records first or disable constraints`);
  } else {
    console.log(`✅ User deleted successfully!`);
  }
} catch (err) {
  console.log(`❌ Error: ${err.message}`);
}

console.log();
