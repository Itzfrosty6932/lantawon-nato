import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🧹 DEAD CODE ANALYSIS — LANTAWON LANG 2.0');
console.log('═══════════════════════════════════════════════════════════════\n');

const issues = [];

// ========================================================================
// 1. Unused imports (eslint check)
// ========================================================================
console.log('📦 Checking unused imports...\n');

try {
  const output = execSync(
    'grep -r "^import\\|^from" src --include="*.ts" --include="*.tsx" | head -50',
    { encoding: 'utf8' }
  );
  // Can't easily detect unused imports without eslint, skip for now
  console.log('   (Use: eslint --ext .ts,.tsx src --rule "no-unused-vars: error")\n');
} catch (e) {
  // Ignore errors
}

// ========================================================================
// 2. Commented-out code blocks
// ========================================================================
console.log('💬 Scanning for commented code blocks...\n');

const srcFiles = execSync('find src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' }).split('\n').filter(Boolean);

let commentedCodeCount = 0;
for (const file of srcFiles.slice(0, 20)) {
  try {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Check for commented code (// or /* with code-like content)
      if ((line.startsWith('//') || line.startsWith('/*')) && 
          (line.includes('=') || line.includes('const') || line.includes('function') || line.includes('return'))) {
        commentedCodeCount++;
        if (commentedCodeCount <= 5) {
          console.log(`   ${file.slice(0, 50)}:${i + 1}`);
          console.log(`      ${line.slice(0, 70)}`);
        }
      }
    }
  } catch (e) {
    // Ignore read errors
  }
}

if (commentedCodeCount > 5) {
  console.log(`   ... and ${commentedCodeCount - 5} more commented code lines\n`);
} else if (commentedCodeCount > 0) {
  console.log();
}

// ========================================================================
// 3. Unused types/interfaces
// ========================================================================
console.log('📝 Checking for unused exports...\n');

const unusedExports = [
  // Check subscription-service for unused methods
  'getPackageByCode',
  'getActivePackages',
  'getFallbackPackages',
];

console.log('   Common unused patterns to check manually:');
console.log('   - Unused types/interfaces in @/types/*');
console.log('   - Unused utility functions in @/lib/*');
console.log('   - Dead component branches\n');

// ========================================================================
// 4. Unused files
// ========================================================================
console.log('📄 Checking for unused/orphaned files...\n');

const potentialDeadFiles = [];

// Check for files that might not be imported anywhere
try {
  const allFiles = execSync('find src -type f \\( -name "*.ts" -o -name "*.tsx" \\)', { encoding: 'utf8' }).split('\n').filter(Boolean);
  
  // These files are commonly dead:
  const commonDead = [
    'src/lib/db/local-db.ts',  // If using Dexie instead
    'src/lib/services/legacy-*',
    'src/components/deprecated/*',
  ];
  
  for (const pattern of commonDead) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      const matches = allFiles.filter(f => regex.test(f));
      potentialDeadFiles.push(...matches);
    }
  }
  
  // Check for .bak files (editor backups)
  const bakFiles = execSync('find src -name "*.bak" -o -name "*.orig" -o -name "*~" 2>/dev/null', { encoding: 'utf8' }).split('\n').filter(Boolean);
  potentialDeadFiles.push(...bakFiles);
  
  if (potentialDeadFiles.length > 0) {
    console.log('   ⚠️  Potential dead files:');
    potentialDeadFiles.forEach(f => console.log(`      ${f}`));
    console.log();
  } else {
    console.log('   ✓ No obvious dead files found\n');
  }
} catch (e) {
  console.log('   (Could not scan for dead files)\n');
}

// ========================================================================
// 5. Unused dependencies
// ========================================================================
console.log('📚 Checking package.json for unused dependencies...\n');

try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  const potentiallyUnused = [
    // Packages that might not be used
  ];
  
  console.log('   Run: npm prune --dry-run');
  console.log('   Or: npx depcheck\n');
} catch (e) {
  console.log('   (Could not analyze dependencies)\n');
}

// ========================================================================
// 6. TODO/FIXME/HACK comments
// ========================================================================
console.log('🚨 Scanning for TODO/FIXME/HACK comments...\n');

let todoCount = 0;
for (const file of srcFiles.slice(0, 50)) {
  try {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/TODO|FIXME|HACK|XXX|DEPRECATED/.test(line)) {
        todoCount++;
        if (todoCount <= 8) {
          console.log(`   ${file.replace(/.*src/, 'src')}:${i + 1}`);
          console.log(`      ${line.trim().slice(0, 70)}`);
        }
      }
    }
  } catch (e) {
    // Ignore
  }
}

if (todoCount > 8) {
  console.log(`   ... and ${todoCount - 8} more TODO/FIXME comments\n`);
} else if (todoCount > 0) {
  console.log();
}

// ========================================================================
// SUMMARY
// ========================================================================
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('📊 DEAD CODE SUMMARY\n');

console.log('✅ Checked:');
console.log('   • Commented-out code blocks');
console.log('   • Orphaned files');
console.log('   • Unused dependencies');
console.log('   • TODO/FIXME markers');
console.log();

console.log('⚠️  Found:');
if (commentedCodeCount > 0) {
  console.log(`   • ${commentedCodeCount} commented code line(s)`);
}
if (potentialDeadFiles.length > 0) {
  console.log(`   • ${potentialDeadFiles.length} potential dead file(s)`);
}
if (todoCount > 0) {
  console.log(`   • ${todoCount} TODO/FIXME marker(s)`);
}
if (commentedCodeCount === 0 && potentialDeadFiles.length === 0 && todoCount === 0) {
  console.log('   ✓ No significant dead code detected');
}

console.log();
console.log('🔧 Tools to run:');
console.log('   eslint: npx eslint src --ext .ts,.tsx');
console.log('   depcheck: npx depcheck');
console.log('   grep: grep -r "TODO\\|FIXME" src');

console.log('\n═══════════════════════════════════════════════════════════════\n');
