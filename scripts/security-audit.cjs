
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔒 Starting Security Audit...\n');

try {
  // Run npm audit
  console.log('1. Checking for vulnerabilities...');
  const auditResult = execSync('npm audit --audit-level=high', { encoding: 'utf8' });
  console.log(auditResult);
  
  // Check for deprecated packages
  console.log('\n2. Checking for deprecated packages...');
  const outdatedResult = execSync('npm outdated', { encoding: 'utf8' });
  if (outdatedResult) {
    console.log('⚠️  Outdated packages found:');
    console.log(outdatedResult);
  } else {
    console.log('✅ All packages are up to date');
  }
  
  console.log('\n✅ Security audit completed');
} catch (error) {
  if (error.status === 1) {
    console.log('⚠️  Vulnerabilities found. Run `npm audit fix` to resolve.');
  } else {
    console.error('❌ Security audit failed:', error.message);
  }
}
