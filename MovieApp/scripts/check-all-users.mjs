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

console.log('\n👥 ALL USERS IN SYSTEM\n');

// Get all profiles
const { data: profiles } = await admin.from('profiles').select('id, username, email, role');

console.log(`Total profiles: ${profiles?.length || 0}\n`);
profiles?.forEach(p => {
  console.log(`• ${p.username} (${p.role})`);
  console.log(`  Email: ${p.email}`);
  console.log(`  ID: ${p.id}\n`);
});

// Get auth users
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 });
console.log(`\nTotal auth users: ${users?.length || 0}\n`);
users?.slice(0, 5).forEach(u => {
  const profile = profiles?.find(p => p.id === u.id);
  console.log(`• ${u.email}`);
  console.log(`  Profile: ${profile?.username || 'NO PROFILE'} (${profile?.role || 'no role'})`);
});
