#!/usr/bin/env node
// ============================================================================
// FULL DATABASE RESET — DESTRUCTIVE
// ============================================================================
// ⚠️⚠️ Wipes the ENTIRE remote Supabase database:
//   - Drops and recreates schema `public` (all tables, RLS, functions)
//   - Truncates auth.users (removes ALL accounts, incl. admin)
//   - Removes storage bucket definitions
// Run `npm run db:migrate && npm run db:seed` immediately afterwards.
//
// Usage:
//   node scripts/db-reset.mjs --yes     (required flag = explicit consent)
// ============================================================================

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    /* optional */
  }
}
loadEnvLocal();

if (!process.argv.includes('--yes')) {
  console.error(
    '\n✗ Refusing to wipe without explicit consent.\n' +
      '  Re-run with: node scripts/db-reset.mjs --yes\n'
  );
  process.exit(1);
}

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error('\n✗ SUPABASE_DB_URL not set in .env.local\n');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  console.log('→ Connected. Wiping public schema + auth users…');

  // Kill any lingering connections to avoid "database is being accessed by other users"
  await client.query(`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND pid <> pg_backend_pid()
      AND usename NOT IN ('supabase_admin')
  `).catch(() => {});

  await client.query('DROP SCHEMA IF EXISTS public CASCADE');
  await client.query('CREATE SCHEMA public');

  // Restore Supabase default grants on the fresh schema
  await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role');
  await client.query('GRANT ALL ON SCHEMA public TO postgres, service_role');
  await client.query(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, anon, authenticated'
  );
  await client.query(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role, anon, authenticated'
  );
  await client.query(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role, anon, authenticated'
  );

  console.log('  ✓ public schema recreated with default grants');

  // Clear all auth accounts (profiles FK-cascade from migrations reference auth.users)
  await client.query('TRUNCATE TABLE auth.users CASCADE');
  console.log('  ✓ auth.users truncated (all accounts removed)');

  // Remove custom storage buckets (objects cascade)
  await client.query("DELETE FROM storage.buckets WHERE id NOT IN ('public')").catch(() => {
    console.log('  ↷ storage buckets: none found or already clean');
  });
  console.log('  ✓ storage buckets cleaned');

  const { rows } = await client.query(
    "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'"
  );
  console.log(`\n✅ Reset complete — public schema now has ${rows[0].n} tables.`);
  console.log('   Next: npm run db:migrate && npm run db:seed\n');
}

main()
  .catch((err) => {
    console.error('\n✗ Reset failed:', err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
