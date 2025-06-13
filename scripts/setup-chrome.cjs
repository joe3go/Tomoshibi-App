#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Setting up Chrome for Lighthouse...\n');

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

  console.log('❌ Chrome not found. Installing via Puppeteer...');
  try {
    execSync('npm install puppeteer --no-save', { stdio: 'inherit' });
    console.log('✅ Puppeteer installed with bundled Chrome');
    return 'puppeteer';
  } catch (error) {
    console.error('❌ Failed to install Chrome fallback');
    process.exit(1);
  }
}

detectChrome();
console.log('\n✅ Chrome setup completed');
