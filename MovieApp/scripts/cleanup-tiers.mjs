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

console.log('\n🧹 Cleaning up Plus/Max tiers from database...\n');

// Delete Plus and Max packages
const { error } = await admin
  .from('subscription_packages')
  .delete()
  .in('code', ['plus', 'max']);

if (error) {
  console.error('❌ Error deleting tiers:', error.message);
  process.exit(1);
}

console.log('✅ Plus and Max tiers deleted');

// Verify only Solo remains
const { data: remaining } = await admin
  .from('subscription_packages')
  .select('code, name, price_php, is_active');

console.log('\n📦 Remaining packages:');
remaining?.forEach(p => {
  console.log(`   • ${p.code.toUpperCase()}: ${p.name} (₱${p.price_php}, active: ${p.is_active})`);
});

if (remaining?.length === 1 && remaining[0].code === 'solo') {
  console.log('\n✅ SUCCESS: Only Solo plan remains\n');
} else {
  console.log('\n❌ ERROR: Unexpected package state\n');
  process.exit(1);
}
