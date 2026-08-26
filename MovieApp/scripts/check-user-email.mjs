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

console.log('\n🔍 CHECKING ALL USERS\n');

const { data: profiles } = await admin.from('profiles').select('id, username, email, role');

console.log(`Total profiles: ${profiles?.length || 0}\n`);
profiles?.forEach(p => {
  console.log(`• ${p.username} (${p.role})`);
  console.log(`  Email: ${p.email}\n`);
});

// Get all payment submissions
console.log('\n💳 ALL PAYMENT SUBMISSIONS\n');
const { data: payments } = await admin.from('payment_submissions').select('id, submitted_by_user_id, reference_number, status, created_at').order('created_at', { ascending: false });

if (payments && payments.length > 0) {
  payments.forEach(p => {
    console.log(`• ${p.reference_number} (${p.status})`);
    console.log(`  User ID: ${p.submitted_by_user_id}`);
    console.log(`  Created: ${p.created_at}\n`);
  });
} else {
  console.log(`❌ NO PAYMENTS IN DATABASE\n`);
}
