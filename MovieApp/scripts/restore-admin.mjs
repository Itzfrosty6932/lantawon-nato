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
  console.log('❌ itzjoshuawayman@gmail.com not found in auth.users');
  process.exit(1);
}

console.log(`✓ Found auth user: ${itzUser.email}`);
console.log(`  ID: ${itzUser.id}\n`);

// Create profile for this user
const { error } = await admin.from('profiles').insert({
  id: itzUser.id,
  username: 'ItzFrosty',
  display_name: 'ItzFrosty',
  email: itzUser.email,
  role: 'admin',
  avatar_emoji: '👑',
});

if (error) {
  console.log(`❌ Error creating profile: ${error.message}`);
  process.exit(1);
}

console.log('✅ Admin profile restored:\n');
console.log(`  Username: ItzFrosty`);
console.log(`  Email: itzjoshuawayman@gmail.com`);
console.log(`  Role: admin\n`);

// Create account for admin
const { data: account, error: accError } = await admin
  .from('accounts')
  .insert({
    owner_user_id: itzUser.id,
    name: "ItzFrosty's Account",
    status: 'active',
  })
  .select()
  .single();

if (accError) {
  console.log(`⚠️  Could not create account: ${accError.message}`);
} else {
  console.log(`✅ Account created: ${account.id}\n`);
}

console.log('🎉 Admin account restored!');
console.log('\n📧 LOGIN CREDENTIALS:');
console.log(`   Email: itzjoshuawayman@gmail.com`);
console.log(`   Password: (your password)\n`);
console.log('🔗 Admin URL: https://lantawonmovies.web.app/admin\n');
