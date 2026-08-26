// One-off diagnostic: reproduce the getActivePackages query exactly as the
// browser does (anon key, no auth) and print the FULL error.
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('subscription_packages')
  .select('*')
  .eq('is_active', true)
  .order('display_order', { ascending: true });

console.log('--- data:', JSON.stringify(data, null, 2));
if (error) {
  console.log('--- error (full):');
  console.dir(error, { depth: null });
}
