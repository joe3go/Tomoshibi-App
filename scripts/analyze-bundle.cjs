
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Bundle Analysis Starting...\n');

function analyzeBundles() {
  const distPath = path.join(__dirname, '..', 'dist', 'public', 'assets');
  
  if (!fs.existsSync(distPath)) {
    console.log('⚠️  No build found. Run `npm run build` first.');
    return;
  }

  const files = fs.readdirSync(distPath);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  let totalSize = 0;
  let issues = [];

  console.log('JavaScript Bundles:');
  jsFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const status = stats.size > 300000 ? '❌' : '✅';
    
    console.log(`${status} ${file}: ${sizeKB} KB`);
    
    if (stats.size > 300000) {
      issues.push({ file, size: sizeKB });
    }
    totalSize += stats.size;
  });

  console.log(`\nTotal JS Bundle Size: ${(totalSize / 1024).toFixed(2)} KB`);
  
  if (issues.length > 0) {
    console.log('\n⚠️  Large bundles detected:');
    issues.forEach(issue => {
      console.log(`   ${issue.file}: ${issue.size} KB`);
    });
    console.log('\n💡 Recommendations:');
    console.log('   1. Use dynamic imports for large components');
    console.log('   2. Configure manual chunks in vite.config.ts');
    console.log('   3. Remove unused dependencies');
  }
}

analyzeBundles();
