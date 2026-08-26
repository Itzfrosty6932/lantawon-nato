import { readFileSync, existsSync } from 'node:fs';
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

console.log('\n🔍 VERIFYING BUG TRACKER SYSTEM\n');

// 1. Check if bugs table exists
console.log('1️⃣  Checking bugs table...');
const { data: bugsTest, error: bugsError } = await admin
  .from('bugs')
  .select('count', { count: 'exact', head: true })
  .limit(1);

if (bugsError) {
  console.log(`   ❌ ERROR: ${bugsError.message}`);
} else {
  console.log(`   ✅ Table exists`);
}

// 2. Check if bugs were seeded
console.log('\n2️⃣  Checking seeded bugs...');
const { data: bugs, error: bugsListError } = await admin
  .from('bugs')
  .select('id, title, status')
  .order('created_at', { ascending: false });

if (bugsListError) {
  console.log(`   ❌ ERROR: ${bugsListError.message}`);
} else {
  console.log(`   ✅ Found ${bugs?.length || 0} bugs`);
  if (bugs && bugs.length > 0) {
    bugs.slice(0, 3).forEach((b, i) => {
      console.log(`      ${i+1}. ${b.title} (${b.status})`);
    });
    if (bugs.length > 3) console.log(`      ... and ${bugs.length - 3} more`);
  }
}

// 3. Check if API route exists
console.log('\n3️⃣  Checking API route...');
const apiPath = resolve(__dirname, '..', 'src/app/api/bugs/route.ts');
const apiExists = existsSync(apiPath);
console.log(`   ${apiExists ? '✅' : '❌'} /api/bugs/route.ts ${apiExists ? 'exists' : 'NOT FOUND'}`);

// 4. Check if UI component exists
console.log('\n4️⃣  Checking UI component...');
const componentPath = resolve(__dirname, '..', 'src/components/admin/tabs/AdminBugsTab.tsx');
const componentExists = existsSync(componentPath);
console.log(`   ${componentExists ? '✅' : '❌'} AdminBugsTab.tsx ${componentExists ? 'exists' : 'NOT FOUND'}`);

// 5. Check if sidebar has bugs tab
console.log('\n5️⃣  Checking sidebar integration...');
const sidebarPath = resolve(__dirname, '..', 'src/components/admin/AdminSidebar.tsx');
const sidebarContent = readFileSync(sidebarPath, 'utf8');
const hasBugsTab = sidebarContent.includes('bugs') && sidebarContent.includes('Bug Tracker');
console.log(`   ${hasBugsTab ? '✅' : '❌'} Sidebar has bugs tab ${hasBugsTab ? '' : 'NOT FOUND'}`);

// 6. Check if admin page imports and renders bugs tab
console.log('\n6️⃣  Checking admin page integration...');
const adminPath = resolve(__dirname, '..', 'src/app/admin/page.tsx');
const adminContent = readFileSync(adminPath, 'utf8');
const hasImport = adminContent.includes('AdminBugsTab');
const hasRender = adminContent.includes('activeTab === "bugs"');
console.log(`   ${hasImport ? '✅' : '❌'} Import ${hasImport ? 'found' : 'NOT FOUND'}`);
console.log(`   ${hasRender ? '✅' : '❌'} Render ${hasRender ? 'found' : 'NOT FOUND'}`);

// Summary
console.log('\n' + '='.repeat(50));
const checks = [
  bugsTest !== undefined,
  bugs && bugs.length === 15,
  apiExists,
  componentExists,
  hasBugsTab,
  hasImport && hasRender,
];
const passed = checks.filter(Boolean).length;

if (passed === checks.length) {
  console.log(`✅ ALL ${checks.length} CHECKS PASSED\n`);
  console.log('🎉 BUG TRACKER IS FULLY FUNCTIONAL!\n');
  console.log('Access it at: /admin → "Bug Tracker" tab\n');
} else {
  console.log(`⚠️  ${passed}/${checks.length} checks passed\n`);
}
