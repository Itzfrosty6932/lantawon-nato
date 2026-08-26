import { readFileSync } from 'node:fs';
import { execSync } from 'child_process';

console.log('\n🔍 DETAILED DEAD CODE SCAN\n');

// ========================================================================
// Unused subscriptionService methods
// ========================================================================
console.log('📚 Checking subscription-service methods...\n');

const serviceFile = readFileSync('src/lib/services/subscription-service.ts', 'utf8');
const methods = [
  'getPackages',
  'getPackageByCode',
  'getActivePackages',
  'submitPayment',
  'getUserAccount',
  'createOrUpdateSession',
];

for (const method of methods) {
  try {
    const count = execSync(
      `grep -r "${method}" src --include="*.ts" --include="*.tsx" --exclude-dir=services | wc -l`,
      { encoding: 'utf8' }
    ).trim();
    const usage = parseInt(count) - 1; // -1 for the definition itself
    
    if (usage <= 1) {
      console.log(`   ⚠️  ${method}: used ${usage} time(s) (potentially unused)`);
    } else {
      console.log(`   ✓ ${method}: used ${usage} time(s)`);
    }
  } catch (e) {
    // Ignore
  }
}

// ========================================================================
// Unused device-service exports
// ========================================================================
console.log('\n📱 Checking device-service exports...\n');

const deviceMethods = [
  'generateDeviceFingerprint',
  'parseDeviceInfo',
  'registerDevice',
  'getUserDevices',
  'revokeDevice',
];

for (const method of deviceMethods) {
  try {
    const count = execSync(
      `grep -r "${method}" src --include="*.ts" --include="*.tsx" | wc -l`,
      { encoding: 'utf8' }
    ).trim();
    const usage = parseInt(count) - 1;
    
    if (usage === 0) {
      console.log(`   ⚠️  ${method}: NOT USED`);
    } else {
      console.log(`   ✓ ${method}: used ${usage} time(s)`);
    }
  } catch (e) {
    // Ignore
  }
}

// ========================================================================
// Unused components
// ========================================================================
console.log('\n🎨 Checking for unused components...\n');

const commonComponents = [
  'PersonModal',
  'SaveToPlaylistModal',
  'WatchSettingsModal',
  'ServerPickerDrawer',
  'EpisodeSelectorDrawer',
];

for (const comp of commonComponents) {
  try {
    const count = execSync(
      `grep -r "${comp}" src --include="*.ts" --include="*.tsx" | wc -l`,
      { encoding: 'utf8' }
    ).trim();
    const usage = parseInt(count) - 1;
    
    if (usage <= 1) {
      console.log(`   ⚠️  ${comp}: used ${usage} time(s)`);
    } else {
      console.log(`   ✓ ${comp}: used ${usage} time(s)`);
    }
  } catch (e) {
    // Ignore
  }
}

// ========================================================================
// Unused API routes
// ========================================================================
console.log('\n🔧 Checking API route usage...\n');

const routes = [
  '/api/auth/check-signup',
  '/api/auth/init-profile',
  '/api/payments/submit',
  '/api/guest-device',
];

for (const route of routes) {
  try {
    const count = execSync(
      `grep -r "${route.replace(/\//g, '\\/')}" src --include="*.ts" --include="*.tsx" | wc -l`,
      { encoding: 'utf8' }
    ).trim();
    
    console.log(`   ${route}: referenced ${parseInt(count)} time(s)`);
  } catch (e) {
    // Ignore
  }
}

console.log('\n');
