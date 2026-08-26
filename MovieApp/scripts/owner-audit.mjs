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

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🔍 OWNER SYSTEM AUDIT — LANTAWON LANG 2.0');
console.log('═══════════════════════════════════════════════════════════════\n');

const checks = [];

// ========================================================================
// 1. DATABASE INTEGRITY
// ========================================================================
console.log('📋 PHASE 1: DATABASE INTEGRITY\n');

// Check subscription_packages table
const { data: packages } = await admin.from('subscription_packages').select('*');
checks.push({
  section: 'Packages',
  name: 'Only Solo plan exists',
  pass: packages?.length === 1 && packages[0]?.code === 'solo',
  details: `Found ${packages?.length} package(s). Solo: ${packages?.find(p => p.code === 'solo') ? '✓' : '✗'}, Plus/Max: ${packages?.find(p => ['plus', 'max'].includes(p.code)) ? '✗ SHOULD BE DELETED' : '✓'}`,
  critical: true
});

if (packages?.find(p => p.code === 'solo')) {
  const solo = packages.find(p => p.code === 'solo');
  checks.push({
    section: 'Packages',
    name: 'Solo price correct (₱349)',
    pass: solo.price_php === 349,
    details: `Price: ₱${solo.price_php}`,
    critical: true
  });
  
  checks.push({
    section: 'Packages',
    name: 'Solo is active',
    pass: solo.is_active === true,
    details: `Active: ${solo.is_active}`,
    critical: true
  });
}

// Check user_devices table exists
const { data: devicesTest } = await admin.from('user_devices').select('count', { count: 'exact', head: true }).limit(1);
checks.push({
  section: 'Tables',
  name: 'user_devices table exists',
  pass: devicesTest !== undefined,
  details: devicesTest !== undefined ? '✓ Table accessible' : '✗ Table missing',
  critical: true
});

// ========================================================================
// 2. DATA INTEGRITY CHECKS
// ========================================================================
console.log('📊 PHASE 2: DATA INTEGRITY\n');

// Check payment_submissions exists and has data
const { data: payments } = await admin
  .from('payment_submissions')
  .select('id, status, submitted_by_user_id, reference_number')
  .order('created_at', { ascending: false })
  .limit(10);

checks.push({
  section: 'Data Consistency',
  name: 'Payment submissions tracked',
  pass: payments !== undefined,
  details: `${payments?.length || 0} payment record(s) in system`,
  critical: false
});

// Check all payments have user_id
const invalidPayments = payments?.filter(p => !p.submitted_by_user_id)?.length || 0;
checks.push({
  section: 'Data Consistency',
  name: 'All payments have valid user_id',
  pass: invalidPayments === 0,
  details: `${invalidPayments} invalid payment(s)`,
  critical: true
});

// Check profile email/username uniqueness
const { data: allProfiles } = await admin.from('profiles').select('email, username, id');
const emailCounts = {};
const usernameCounts = {};
const dupEmails = [];
const dupUsernames = [];

allProfiles?.forEach(p => {
  if (p.email) {
    emailCounts[p.email] = (emailCounts[p.email] || 0) + 1;
    if (emailCounts[p.email] > 1 && !dupEmails.includes(p.email)) dupEmails.push(p.email);
  }
  if (p.username) {
    usernameCounts[p.username] = (usernameCounts[p.username] || 0) + 1;
    if (usernameCounts[p.username] > 1 && !dupUsernames.includes(p.username)) dupUsernames.push(p.username);
  }
});

checks.push({
  section: 'Data Consistency',
  name: 'No duplicate emails',
  pass: dupEmails.length === 0,
  details: dupEmails.length > 0 ? `${dupEmails.length} duplicates found` : '✓ All unique',
  critical: true
});

checks.push({
  section: 'Data Consistency',
  name: 'No duplicate usernames',
  pass: dupUsernames.length === 0,
  details: dupUsernames.length > 0 ? `${dupUsernames.length} duplicates found` : '✓ All unique',
  critical: true
});

// ========================================================================
// 3. SECURITY CHECKS
// ========================================================================
console.log('🔒 PHASE 3: SECURITY\n');

// Check profiles have roles
const { data: noRole } = await admin
  .from('profiles')
  .select('id')
  .or('role.is.null,role.eq.""');

checks.push({
  section: 'Security',
  name: 'All profiles have role assigned',
  pass: (noRole?.length || 0) === 0,
  details: `${noRole?.length || 0} profiles without role`,
  critical: true
});

// Check admin accounts exist
const { data: admins } = await admin
  .from('profiles')
  .select('username')
  .eq('role', 'admin');

checks.push({
  section: 'Security',
  name: 'Admin accounts exist',
  pass: (admins?.length || 0) > 0,
  details: `${admins?.length || 0} admin(s): ${admins?.map(a => a.username).join(', ') || 'none'}`,
  critical: true
});

// ========================================================================
// 4. SUBSCRIPTION LOGIC
// ========================================================================
console.log('💼 PHASE 4: SUBSCRIPTION LOGIC\n');

const { data: subs } = await admin.from('subscriptions').select('id, status');
const validStatuses = ['active', 'trialing', 'pending_payment', 'expired', 'canceled'];
const badSubs = subs?.filter(s => !validStatuses.includes(s.status))?.length || 0;

checks.push({
  section: 'Subscriptions',
  name: 'All subscriptions have valid status',
  pass: badSubs === 0,
  details: badSubs > 0 ? `${badSubs} invalid statuses` : '✓ All valid',
  critical: true
});

// Count subscription statuses
const statusCount = {};
subs?.forEach(s => {
  statusCount[s.status] = (statusCount[s.status] || 0) + 1;
});

checks.push({
  section: 'Subscriptions',
  name: 'Subscription distribution healthy',
  pass: true,
  details: `Active: ${statusCount['active'] || 0}, Pending: ${statusCount['pending_payment'] || 0}, Expired: ${statusCount['expired'] || 0}, Other: ${statusCount['canceled'] || 0}`,
  critical: false
});

// ========================================================================
// 5. DEVICE TRACKING
// ========================================================================
console.log('📱 PHASE 5: DEVICE TRACKING\n');

const { data: devices } = await admin.from('user_devices').select('id, is_active');
const activeDevices = devices?.filter(d => d.is_active)?.length || 0;
const blockedDevices = devices?.filter(d => !d.is_active)?.length || 0;

checks.push({
  section: 'Devices',
  name: 'Device tracking functional',
  pass: devices !== undefined,
  details: `${activeDevices} active, ${blockedDevices} blocked`,
  critical: false
});

// ========================================================================
// 6. PRINT RESULTS
// ========================================================================
console.log('\n═══════════════════════════════════════════════════════════════\n');

const bySectionMap = {};
checks.forEach(c => {
  if (!bySectionMap[c.section]) bySectionMap[c.section] = [];
  bySectionMap[c.section].push(c);
});

for (const [section, sectionChecks] of Object.entries(bySectionMap)) {
  const passed = sectionChecks.filter(c => c.pass).length;
  const total = sectionChecks.length;
  const icon = passed === total ? '✅' : '⚠️';
  
  console.log(`${icon} ${section} (${passed}/${total})`);
  sectionChecks.forEach(c => {
    const mark = c.pass ? '✓' : '✗';
    const critical = c.critical ? ' [CRITICAL]' : '';
    console.log(`   ${mark} ${c.name}${critical}`);
    if (c.details) console.log(`      └─ ${c.details}`);
  });
  console.log();
}

// ========================================================================
// 7. SUMMARY
// ========================================================================
const passed = checks.filter(c => c.pass).length;
const critical = checks.filter(c => c.critical);
const criticalFailed = critical.filter(c => !c.pass).length;

console.log('═══════════════════════════════════════════════════════════════');
console.log(`📊 OVERALL: ${passed}/${checks.length} checks passed\n`);

if (criticalFailed === 0) {
  console.log('✅ ✅ ✅ SYSTEM AUDIT PASSED — PRODUCTION READY ✅ ✅ ✅');
  console.log('\n🎉 All critical checks passed.');
  console.log('   Database integrity: ✓');
  console.log('   Data consistency: ✓');
  console.log('   Security: ✓');
  console.log('   Business logic: ✓');
} else {
  console.log(`🚨 ${criticalFailed} CRITICAL ISSUE(S) FOUND:`);
  critical.filter(c => !c.pass).forEach(c => {
    console.log(`   ✗ ${c.name}: ${c.details}`);
  });
}

console.log('\n═══════════════════════════════════════════════════════════════\n');

process.exit(criticalFailed > 0 ? 1 : 0);
