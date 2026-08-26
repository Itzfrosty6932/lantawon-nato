// Reset phantom XP for ItzFrosty admin account
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

// Find ItzFrosty by username
const { data: profiles, error: profileError } = await admin
  .from('profiles')
  .select('id, username, display_name, xp_total, current_level')
  .eq('username', 'ItzFrosty');

if (profileError) {
  console.error('Error finding ItzFrosty:', profileError.message);
  process.exit(1);
}

if (!profiles || profiles.length === 0) {
  console.log('ItzFrosty not found');
  process.exit(0);
}

const profile = profiles[0];
console.log(`Found ItzFrosty: ${profile.id}`);
console.log(`  Current XP: ${profile.xp_total}, Level: ${profile.current_level}`);

if (profile.xp_total > 0 || profile.current_level > 1) {
  console.log('Resetting XP to 0 and level to 1...');

  const { error: updateError } = await admin
    .from('profiles')
    .update({ xp_total: 0, current_level: 1 })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Error resetting XP:', updateError.message);
    process.exit(1);
  }

  // Also clear any xp_events for this user
  const { error: deleteError } = await admin
    .from('xp_events')
    .delete()
    .eq('user_id', profile.id);

  if (deleteError) {
    console.error('Error clearing XP events:', deleteError.message);
    process.exit(1);
  }

  console.log('✅ Reset complete!');
} else {
  console.log('No phantom XP detected.');
}
