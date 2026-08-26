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

console.log('\n🔐 ADMIN ACCOUNT INFO\n');

// Get admin users
const { data: profiles } = await admin
  .from('profiles')
  .select('id, username, email, role')
  .eq('role', 'admin');

if (profiles && profiles.length > 0) {
  profiles.forEach(admin => {
    console.log(`✅ Admin: ${admin.username}`);
    console.log(`   Email: ${admin.email || '(no email in profiles)'}`);
    console.log(`   Role: ${admin.role}\n`);
  });
} else {
  console.log('❌ No admin profiles found\n');
}

// Get auth users for admin IDs
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 });
const adminAuthUsers = users?.filter(u => {
  const profile = profiles?.find(p => p.id === u.id);
  return profile?.role === 'admin';
});

console.log('📧 Admin Auth Accounts:\n');
adminAuthUsers?.forEach(u => {
  console.log(`  Email: ${u.email}`);
  console.log(`  Last Sign-In: ${u.last_sign_in_at || 'Never'}`);
  console.log(`  Created: ${u.created_at}\n`);
});

console.log('🔗 Admin URL: https://lantawonmovies.web.app/admin\n');
