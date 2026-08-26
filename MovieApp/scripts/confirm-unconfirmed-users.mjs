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

const unconfirmed = data.users.filter((u) => !u.email_confirmed_at);
console.log(`\nUnconfirmed users: ${unconfirmed.length}\n`);

for (const u of unconfirmed) {
  const { error: upErr } = await admin.auth.admin.updateUserById(u.id, { email_confirm: true });
  if (upErr) console.log(`  ✗ ${u.email} — ${upErr.message}`);
  else console.log(`  ✓ confirmed ${u.email}`);
}
if (unconfirmed.length === 0) console.log('  ✅ Nothing to do — all users already confirmed.');
console.log('');
