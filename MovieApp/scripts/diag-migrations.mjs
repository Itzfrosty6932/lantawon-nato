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
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } });
const check = async (name, fn) => {
  const r = await fn();
  console.log(`${r.ok ? 'OK  ' : 'MISS'}  ${name}${r.ok ? '' : '  <-- ' + (r.detail || '')}`);
  return r.ok;
};
const results = {};
results.guest_devices = await check('table guest_devices', async () => {
  const { error } = await admin.from('guest_devices').select('id').limit(1);
  return { ok: !error, detail: error?.message };
});
results.lookup_rpc = await check('rpc guest_device_lookup', async () => {
  const { error } = await admin.rpc('guest_device_lookup', { p_fingerprint: '__none__' });
  return { ok: !error, detail: error?.message };
});
results.create_ticket_rpc = await check('rpc create_password_reset_ticket', async () => {
  const { error } = await admin.rpc('create_password_reset_ticket', { p_email: 'x@x.x', p_message: null });
  return { ok: !error, detail: error?.message };
});
results.packages = await check('table subscription_packages', async () => {
  const { data, error } = await admin.from('subscription_packages').select('code, price_php').order('code');
  if (!error) console.log('    packages:', JSON.stringify(data));
  return { ok: !error, detail: error?.message };
});
results.refund_rpc = await check('rpc request_refund', async () => {
  const { error } = await admin.rpc('request_refund', { p_payment_id: '00000000-0000-0000-0000-000000000000', p_reason: '' });
  return { ok: !error, detail: error?.message };
});
const missing = Object.values(results).filter(v => !v).length;
console.log(`\n${Object.values(results).filter(v => v).length}/${Object.values(results).length} present. ${missing ? missing + ' MISSING.' : 'All present.'}`);
