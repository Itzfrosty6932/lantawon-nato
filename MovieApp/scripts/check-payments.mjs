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

console.log('Checking payment_submissions table...\n');

const { data: payments, error } = await admin
  .from('payment_submissions')
  .select('*')
  .order('submitted_at', { ascending: false })
  .limit(10);

if (error) {
  console.log('❌ Error querying payments:', error.message);
  process.exit(1);
}

console.log(`Found ${payments?.length || 0} payment submissions:\n`);

if (!payments || payments.length === 0) {
  console.log('⚠️  NO PAYMENTS FOUND — payment submission is not being inserted!');
} else {
  for (const p of payments) {
    console.log(`- ${p.reference_number || '(no ref)'} | User: ${p.submitted_by_user_id.slice(0, 8)} | Status: ${p.status} | Amount: ₱${p.amount} | Proof: ${p.proof_image_url ? 'Yes' : 'No'}`);
  }
}

