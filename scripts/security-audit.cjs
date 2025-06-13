
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Enhanced Security Audit...\n');

// Check for vulnerable packages
const DEPRECATED_PACKAGES = ['inflight', 'glob', 'npmlog', 'iltorb'];
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

function checkDeprecatedPackages() {
  console.log('1. Checking for deprecated packages...');
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const found = DEPRECATED_PACKAGES.filter(pkg => pkg in allDeps);
  
  if (found.length > 0) {
    console.log('⚠️  Deprecated packages found:', found.join(', '));
    console.log('   Run: npm uninstall', found.join(' '));
  } else {
    console.log('✅ No deprecated packages found');
  }
}

function runSecurityAudit() {
  try {
    console.log('\n2. Running npm audit...');
    const auditResult = execSync('npm audit --audit-level=high', { encoding: 'utf8' });
    console.log('✅ No high/critical vulnerabilities found');
  } catch (error) {
    if (error.status === 1) {
      console.log('⚠️  Vulnerabilities found. Run `npm audit fix` to resolve.');
    } else {
      console.error('❌ Security audit failed:', error.message);
    }
  }
}

function checkOutdatedPackages() {
  try {
    console.log('\n3. Checking for outdated packages...');
    const outdatedResult = execSync('npm outdated', { encoding: 'utf8' });
    if (outdatedResult) {
      console.log('⚠️  Outdated packages found:');
      console.log(outdatedResult);
    } else {
      console.log('✅ All packages are up to date');
    }
  } catch (error) {
    // npm outdated exits with 1 when outdated packages exist
    if (error.stdout) {
      console.log('⚠️  Outdated packages found:');
      console.log(error.stdout);
    }
  }
}

function checkFilePermissions() {
  console.log('\n4. Checking file permissions...');
  const sensitiveFiles = ['.env', 'server/db.ts', 'server/openai.ts'];
  
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);
      if (mode !== '644' && mode !== '600') {
        console.log(`⚠️  ${file} has permissions ${mode}, consider 644 or 600`);
      }
    }
  });
  console.log('✅ File permissions checked');
}

// Run all checks
checkDeprecatedPackages();
runSecurityAudit();
checkOutdatedPackages();
checkFilePermissions();

console.log('\n✅ Enhanced security audit completed');
