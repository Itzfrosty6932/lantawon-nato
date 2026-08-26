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

const { data, error } = await admin.auth.admin.listUsers({ perPage: 500 });
if (error) { console.error(error); process.exit(1); }

console.log(`\nTotal auth users: ${data.users.length}\n`);
for (const u of data.users) {
  console.log(`  ${u.email}`);
  console.log(`     confirmed=${!!u.email_confirmed_at}  created=${u.created_at?.slice(0, 19)}  id=${u.id.slice(0, 8)}`);
}
console.log('');
