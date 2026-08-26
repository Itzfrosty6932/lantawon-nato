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

// Get itzjoshuawayman@gmail.com user
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 });
const itzUser = users?.find(u => u.email === 'itzjoshuawayman@gmail.com');

if (!itzUser) {
  console.log('❌ itzjoshuawayman@gmail.com not found');
  process.exit(1);
}

console.log(`✓ Found: ${itzUser.email}\n`);

// Create profile (without email column)
const { error } = await admin.from('profiles').insert({
  id: itzUser.id,
  username: 'ItzFrosty',
  display_name: 'ItzFrosty',
  role: 'admin',
  avatar_emoji: '👑',
});

if (error) {
  console.log(`❌ Error: ${error.message}`);
  process.exit(1);
}

console.log('✅ Admin profile created\n');

// Create account
const { data: account } = await admin
  .from('accounts')
  .insert({
    owner_user_id: itzUser.id,
    name: "ItzFrosty's Account",
    status: 'active',
  })
  .select()
  .single();

if (account) {
  console.log('✅ Account created\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 ADMIN RESTORED!\n');
console.log('📧 LOGIN CREDENTIALS:');
console.log('   Email: itzjoshuawayman@gmail.com');
console.log('   Password: (your password)\n');
console.log('🔗 Go to: /login');
console.log('   Then: /admin\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
