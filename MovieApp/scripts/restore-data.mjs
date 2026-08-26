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

console.log('\n🔧 RESTORING ADMIN PROFILE\n');

const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 });
const itzUser = users?.find(u => u.email === 'itzjoshuawayman@gmail.com');

if (itzUser) {
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
  
  if (!error) {
    console.log('✅ Admin restored');
  }
}

// Restore test user
const setupUser = users?.find(u => u.email === 'setupgaming278@gmail.com');
if (setupUser) {
  const { error } = await admin.from('profiles').upsert(
    {
      id: setupUser.id,
      username: 'setupgaming',
      display_name: 'setupgaming',
      email: setupUser.email,
      role: 'user',
    },
    { onConflict: 'id' }
  );
  
  if (!error) {
    console.log('✅ Test user restored');

    // Create account
    const { data: acc } = await admin.from('accounts').insert({
      owner_user_id: setupUser.id,
      name: 'setupgaming Account',
      status: 'active',
    }).select().single();

    if (acc) {
      console.log('✅ Account created');

      // Create subscription
      const { data: solo } = await admin
        .from('subscription_packages')
        .select('id')
        .eq('code', 'solo')
        .single();

      if (solo) {
        await admin.from('subscriptions').insert({
          account_id: acc.id,
          current_package_id: solo.id,
          status: 'pending_payment',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        });

        console.log('✅ Subscription created (pending_payment)\n');
      }
    }
  }
}

console.log('✅ Data restored\n');
