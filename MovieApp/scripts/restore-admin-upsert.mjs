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

console.log('\n🔧 RESTORING ADMIN ACCOUNT\n');

const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 });
const itzUser = users?.find(u => u.email === 'itzjoshuawayman@gmail.com');

if (!itzUser) {
  console.log('❌ User not found');
  process.exit(1);
}

// Upsert (insert or update)
const { error } = await admin.from('profiles').upsert(
  {
    id: itzUser.id,
    username: 'ItzFrosty',
    display_name: 'ItzFrosty',
    role: 'admin',
    avatar_emoji: '👑',
  },
  { onConflict: 'id' }
);

if (error) {
  console.log(`❌ Error: ${error.message}`);
  process.exit(1);
}

console.log('✅ Admin profile updated\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 READY TO LOGIN!\n');
console.log('📧 EMAIL: itzjoshuawayman@gmail.com');
console.log('🔑 PASSWORD: (your password)\n');
console.log('🔗 STEPS:');
console.log('   1. Go to /login');
console.log('   2. Enter your credentials');
console.log('   3. Go to /admin\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
