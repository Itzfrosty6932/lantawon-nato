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

console.log('\n🔍 CHECKING DEVICE RPC\n');

// Test register_device RPC
try {
  const { data, error } = await admin.rpc('register_device', {
    p_user_id: 'a05d5752-32dd-4e1a-a6ba-1fd1c69c80ed',
    p_device_fingerprint: 'test_device_001',
    p_device_name: 'Test Browser',
    p_browser: 'Chrome',
    p_os: 'Windows',
    p_ip_address: '127.0.0.1',
  });

  if (error) {
    console.log('❌ RPC call failed:');
    console.log(`   Code: ${error.code}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Details: ${JSON.stringify(error)}`);
  } else {
    console.log('✅ RPC call succeeded:');
    console.log(JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.log('❌ Exception:');
  console.log(err.message);
}

console.log('\n🔍 CHECKING user_devices TABLE\n');

// Check if table exists
const { data: tableData, error: tableError } = await admin
  .from('user_devices')
  .select('*')
  .limit(1);

if (tableError) {
  console.log(`❌ Table error: ${tableError.message}`);
} else {
  console.log('✅ user_devices table exists');
  console.log(`   Records: ${tableData?.length || 0}`);
}

console.log();
