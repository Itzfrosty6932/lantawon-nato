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

console.log('Checking guest_devices table...');

// Check if table exists
const { data: tables, error: tableError } = await admin
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .eq('table_name', 'guest_devices');

if (tableError) {
  console.log('Could not query information_schema, trying direct table access...');
} else if (tables && tables.length > 0) {
  console.log('✅ guest_devices table exists');
  process.exit(0);
}

// Try direct query to guest_devices
const { data, error } = await admin
  .from('guest_devices')
  .select('device_id')
  .limit(1);

if (error && error.code === 'PGRST116') {
  console.log('❌ guest_devices table does not exist — creating now...');

  // Read and execute the migration SQL directly
  const migrationSQL = readFileSync(
    resolve(__dirname, '..', 'supabase/migrations/20260824000016_guest_device_trials.sql'),
    'utf8'
  );

  const { error: execError } = await admin.rpc('exec_sql', { sql: migrationSQL }).catch(() => ({ error: { message: 'RPC unavailable' } }));

  if (execError) {
    console.log('Note: RPC exec not available, but migration should have run via db:migrate');
    console.log('If guest_devices still missing, apply migration manually in Supabase dashboard');
    process.exit(1);
  }
} else if (!error) {
  console.log('✅ guest_devices table exists and is accessible');
} else {
  console.log('Error checking table:', error.message);
  process.exit(1);
}
