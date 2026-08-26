#!/usr/bin/env node
// ============================================================================
// ADMIN SEED: promote/create the canonical admin account (ItzFrosty)
// ============================================================================
// ⚠️ DEV-ONLY. Uses the Supabase Admin API via SUPABASE_SERVICE_ROLE_KEY,
// which bypasses ALL RLS. Never run against production.
//
// What it does:
//   1. Loads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from .env.local
//   2. Finds the auth user by email — creates it if missing (the
//      on_auth_user_created trigger then auto-creates its profile).
//   3. Sets profiles.role = 'admin' (server-side checks read this column).
//   4. Prints verification output.
//
// Usage:
//   1. Add to .env.local:
//        SUPABASE_SERVICE_ROLE_KEY=<service_role key from Supabase dashboard>
//   2. Optional overrides:
//        ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
// ============================================================================

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Load .env.local (no dotenv dependency needed) --------------------------
function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // .env.local optional if vars already exported in shell
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.ADMIN_EMAIL ?? 'itzjoshuawayman@gmail.com';
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'LantawonAdmin!2026';
const USERNAME = process.env.ADMIN_USERNAME ?? 'ItzFrosty';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\n✗ Missing configuration.\n' +
      '  Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Dashboard → Project Settings → API).\n'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\n→ Seeding admin account: ${EMAIL}`);

  // 1) Look up existing user (paginated lookup by email)
  let userId = null;
  {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    userId = data.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase())?.id ?? null;
  }

  // 2) Create if missing — trigger handle_new_user() creates profile + prefs
  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: USERNAME, display_name: USERNAME },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`  ✓ Created auth user ${userId}`);
  } else {
    console.log(`  ✓ Found existing auth user ${userId}`);
  }

  // 3) Promote to admin in profiles (bypasses RLS via service role)
  const { error: roleErr } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);
  if (roleErr) throw roleErr;
  console.log(`  ✓ Set profiles.role = 'admin'`);

  // 4) Verify
  const { data: profile, error: verifyErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, role')
    .eq('id', userId)
    .single();
  if (verifyErr) throw verifyErr;

  console.log('\n✅ Admin seed complete:');
  console.table(profile);
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message ?? err);
  process.exit(1);
});
