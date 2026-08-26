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

console.log('\n🔍 PAYMENT FLOW DIAGNOSTIC\n');

// 1. Check if any pending payments exist
const { data: payments } = await admin
  .from('payment_submissions')
  .select('id, reference_number, status, submitted_by_user_id, created_at')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });

console.log(`Pending payments: ${payments?.length || 0}`);
if (payments && payments.length > 0) {
  for (const p of payments) {
    const { data: profile } = await admin
      .from('profiles')
      .select('display_name, username, email')
      .eq('id', p.submitted_by_user_id)
      .single();
    
    console.log(`  - Ref: ${p.reference_number} | User: ${profile?.display_name || '?'} (${profile?.username}) | Time: ${p.created_at}`);
  }
}

// 2. Check profile creation for recent users
const { data: recentUsers } = await admin
  .from('profiles')
  .select('id, display_name, username, email, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

console.log(`\nRecent profiles:`);
if (recentUsers) {
  for (const u of recentUsers) {
    console.log(`  - ${u.display_name || '(none)'} (${u.username}) | Email: ${u.email} | Created: ${u.created_at}`);
  }
}

// 3. Check if users are getting created but profiles are not
const { data: recentAuthUsers } = await admin.auth.admin.listUsers({ perPage: 10 });
console.log(`\nRecent auth users (last 10):`);
if (recentAuthUsers?.users) {
  for (const u of recentAuthUsers.users.slice(0, 5)) {
    const { data: profile } = await admin
      .from('profiles')
      .select('display_name, username')
      .eq('id', u.id)
      .single();
    
    const hasProfile = profile ? '✅' : '❌';
    console.log(`  ${hasProfile} ${u.email} | Profile: ${profile?.display_name || 'MISSING'}`);
  }
}

console.log('\n');
