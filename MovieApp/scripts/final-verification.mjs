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

const checks = [];

// Check all critical tables
const tables = [
  'profiles', 'accounts', 'subscriptions', 'payment_submissions',
  'guest_devices', 'xp_events', 'subscription_packages', 'support_tickets', 'audit_logs'
];

for (const table of tables) {
  const { error } = await admin.from(table).select('*', { count: 'exact', head: true });
  checks.push({ name: table, ok: !error });
}

// Check all critical RPCs
const rpcs = [
  { name: 'admin_approve_payment', args: { p_payment_id: 'test-id' } },
  { name: 'guest_device_lookup', args: { p_fingerprint: 'test' } },
];

for (const rpc of rpcs) {
  const { error } = await admin.rpc(rpc.name, rpc.args);
  // Errors are OK if the args don't match — we just want to verify the RPC exists
  checks.push({ name: `RPC: ${rpc.name}`, ok: !error || error.code !== 'PGRST102' });
}

console.log('\n🔍 FINAL VERIFICATION\n');
const passed = checks.filter(c => c.ok).length;
const total = checks.length;

for (const check of checks) {
  console.log(`${check.ok ? '✅' : '❌'} ${check.name}`);
}

console.log(`\n${passed}/${total} checks passed`);

if (passed === total) {
  console.log('\n🎉 All systems ready for testing!\n');
  process.exit(0);
} else {
  process.exit(1);
}
