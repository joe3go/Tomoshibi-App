#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Performance Audit Starting...\n');

// Check Chrome installation
function detectChrome() {
  const chromePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    process.env.CHROME_PATH
  ];

  for (const chromePath of chromePaths) {
    if (chromePath && fs.existsSync(chromePath)) {
      console.log(`✅ Chrome found at: ${chromePath}`);
      process.env.CHROME_PATH = chromePath;
      return chromePath;
    }
  }

  console.log('❌ Chrome not found. Installing...');
  try {
    execSync('npm install puppeteer --no-save', { stdio: 'inherit' });
    console.log('✅ Puppeteer installed with bundled Chrome');
    return 'puppeteer';
  } catch (error) {
    console.error('❌ Failed to install Chrome fallback');
    process.exit(1);
  }
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
function runAudit() {
  detectChrome();
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

  console.log('\n✅ Performance audit completed!');
}

runAudit();