// Remove all @demo.lantawon.local seed/demo users (auth user + cascading profile data).
// One-off cleanup: the platform must only ever contain real registered accounts.
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

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 500 });
if (listErr) {
  console.error('Failed to list users:', listErr.message);
  process.exit(1);
}

const demos = (list?.users || []).filter((u) =>
  (u.email || '').endsWith('@demo.lantawon.local')
);

if (demos.length === 0) {
  console.log('No demo users found — database is already clean.');
} else {
  console.log(`Removing ${demos.length} demo user(s):`);
  for (const u of demos) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    console.log(`  ${error ? 'FAILED' : 'deleted'}  ${u.email}${error ? ' — ' + error.message : ''}`);
  }
}

const { data: after } = await admin.auth.admin.listUsers({ perPage: 500 });
console.log(`\nRemaining accounts (${after?.users?.length ?? 0}):`);
for (const u of after?.users || []) console.log(`  - ${u.email}`);
