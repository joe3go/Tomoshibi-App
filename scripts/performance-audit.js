
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Performance Audit...\n');

// 1. Type Coverage Check
console.log('📊 Checking TypeScript coverage...');
try {
  const typeCoverage = execSync('npx type-coverage --detail --at-least 95', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  console.log('✅ Type coverage passed');
  console.log(typeCoverage);
} catch (error) {
  console.log('❌ Type coverage failed');
  console.log(error.stdout);
}

// 2. Bundle Analysis
console.log('\n📦 Analyzing bundle size...');
try {
  // Check if build exists
  if (!fs.existsSync('dist')) {
    console.log('Building project for analysis...');
    execSync('npm run build', { stdio: 'inherit' });
  }

  // Get bundle sizes
  const distFiles = fs.readdirSync('dist/assets', { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => {
      const filePath = path.join('dist/assets', dirent.name);
      const stats = fs.statSync(filePath);
      return {
        name: dirent.name,
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024 * 100) / 100
      };
    });

  const totalSize = distFiles.reduce((acc, file) => acc + file.size, 0);
  const totalSizeKB = Math.round(totalSize / 1024 * 100) / 100;

  console.log('Bundle Analysis:');
  console.log(`Total bundle size: ${totalSizeKB} KB`);
  
  const largeBundles = distFiles.filter(file => file.sizeKB > 500);
  if (largeBundles.length > 0) {
    console.log('⚠️  Large bundles detected:');
    largeBundles.forEach(file => {
      console.log(`  - ${file.name}: ${file.sizeKB} KB`);
    });
  } else {
    console.log('✅ All bundles are reasonably sized');
  }

} catch (error) {
  console.log('❌ Bundle analysis failed:', error.message);
}

// 3. Dependency Analysis
console.log('\n🔍 Checking dependencies...');
try {
  const depCruise = execSync('npx depcruise --config .dependency-cruiser.js client/src server', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  console.log('✅ Dependency architecture is valid');
} catch (error) {
  console.log('❌ Dependency issues found:');
  console.log(error.stdout);
}

// 4. ESLint Check
console.log('\n🔧 Running ESLint...');
try {
  const lintResults = execSync('npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  console.log('✅ ESLint passed with no warnings');
} catch (error) {
  console.log('❌ ESLint issues found:');
  console.log(error.stdout);
}

// 5. Performance Recommendations
console.log('\n💡 Performance Recommendations:');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = Object.keys(packageJson.dependencies || {});

// Check for heavy dependencies
const heavyDeps = dependencies.filter(dep => 
  ['moment', 'lodash', 'antd', 'material-ui'].includes(dep)
);

if (heavyDeps.length > 0) {
  console.log('⚠️  Consider lighter alternatives for:');
  heavyDeps.forEach(dep => {
    const alternatives = {
      'moment': 'date-fns or dayjs',
      'lodash': 'individual lodash functions or native methods',
      'antd': 'individual component imports',
      'material-ui': 'individual component imports'
    };
    console.log(`  - ${dep} → ${alternatives[dep] || 'smaller alternative'}`);
  });
}

// Check for unused dependencies
console.log('\n🧹 Checking for unused dependencies...');
try {
  const depcheck = execSync('npx depcheck', { encoding: 'utf8' });
  if (depcheck.trim()) {
    console.log('Found unused dependencies:');
    console.log(depcheck);
  } else {
    console.log('✅ No unused dependencies found');
  }
} catch (error) {
  console.log('ℹ️  Could not check unused dependencies (depcheck not available)');
}

console.log('\n🎉 Performance audit complete!');
console.log('\nNext steps:');
console.log('1. Run `npm run test` to ensure functionality');
console.log('2. Test user flows manually');
console.log('3. Deploy and run Lighthouse audit');
console.log('4. Monitor performance metrics in production');
