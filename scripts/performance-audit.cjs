#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Dynamic imports for ES modules
let lighthouse, chromeLauncher;

async function loadModules() {
  try {
    lighthouse = (await import('lighthouse')).default;
    chromeLauncher = await import('chrome-launcher');
  } catch (error) {
    console.log('❌ Lighthouse modules not available:', error.message);
    return false;
  }
  return true;
}

// Analyze bundle sizes
function analyzeBundles() {
  console.log('\n📦 Bundle Analysis:');
  const distPath = path.join(__dirname, '..', 'dist', 'public', 'assets');

  if (!fs.existsSync(distPath)) {
    console.log('⚠️  No build found. Run `npm run build` first.');
    return;
  }

  const files = fs.readdirSync(distPath);
  const jsFiles = files.filter(f => f.endsWith('.js'));

  jsFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const status = stats.size > 300000 ? '❌' : '✅';
    console.log(`${status} ${file}: ${sizeKB} KB`);
  });
}

// Main audit
async function runAudit() {
  console.log('🚀 Performance Audit Starting...\n');

  // Load modules dynamically
  const modulesLoaded = await loadModules();

  // Check if Chrome is available
  try {
    const chromePath = process.env.CHROME_PATH || 
      execSync('which google-chrome || which chromium-browser || which chromium', { encoding: 'utf8' }).trim();
    console.log('✅ Chrome found at:', chromePath);
  } catch (error) {
    console.log('❌ Chrome not found. Installing...\n');
    try {
      execSync('npm install puppeteer --save-dev', { stdio: 'inherit' });
      console.log('✅ Puppeteer installed with bundled Chrome\n');
    } catch (installError) {
      console.log('❌ Failed to install Chrome. Skipping Lighthouse audit.\n');
      return;
    }
  }

  analyzeBundles();

  console.log('\n⚡ Performance recommendations:');
  console.log('1. Run `npm run build` to check current bundle sizes');
  console.log('2. Use `npm run depcheck` to find unused dependencies');
  console.log('3. Consider lazy loading for large components');
  console.log('4. Enable gzip compression on your server');

  // Additional checks from original code
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

  console.log('\n🧪 Running test suite...');
  try {
    const testResult = execSync('npm run test:types', { encoding: 'utf8' });
    console.log('✅ TypeScript checks passed');
  } catch (error) {
    console.log('❌ TypeScript issues found:');
    console.log(error.stdout);
  }

  console.log('\n✅ Performance audit completed!');
}

runAudit();