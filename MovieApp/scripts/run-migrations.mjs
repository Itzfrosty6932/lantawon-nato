#!/usr/bin/env node
// ============================================================================
// MIGRATION RUNNER: apply all supabase/migrations/*.sql in filename order
// ============================================================================
// ⚠️ Uses the direct Postgres connection (SUPABASE_DB_URL) because this
// project has no supabase CLI set up. Tracks applied migrations in a
// `schema_migrations` table so re-runs are idempotent.
//
// Usage:
//   1. Add to .env.local:
//        SUPABASE_DB_URL=postgresql://postgres:<PASSWORD>@db.<ref>.supabase.co:5432/postgres
//   2. npm run db:migrate
// ============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
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

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error(
    '\n✗ SUPABASE_DB_URL not set.\n' +
      "  Add it to .env.local (Dashboard → Connect → Connection string → URI).\n"
  );
  process.exit(1);
}

const MIGRATIONS_DIR = resolve(__dirname, '..', 'supabase', 'migrations');
const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort(); // filename prefix (YYYYMMDD...) defines order

const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const { rows } = await client.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.filename));

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  ↷ ${basename(file)} (already applied)`);
      continue;
    }
    const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`  ▶ applying ${basename(file)} ... `);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log('✓');
      ran++;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.log(`✗\n\n✗ Migration failed: ${basename(file)}`);
      console.error(err.message ?? err);
      process.exit(1);
    }
  }

  console.log(`\n✅ Done — ${ran} new migration(s) applied, ${files.length - ran} skipped.`);
}

main()
  .catch((err) => {
    console.error('\n✗ Migration run failed:', err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
