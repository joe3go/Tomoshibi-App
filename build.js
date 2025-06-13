#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building Tomoshibi for production...');

try {
  // Clean dist directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }
  fs.mkdirSync('dist', { recursive: true });

  // Build client
  console.log('📦 Building client...');
  execSync('npx vite build --outDir dist/public', { stdio: 'inherit' });

  // Build server
  console.log('🔧 Building server...');
  execSync('npx esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js --external:pg-native --external:better-sqlite3 --external:@neondatabase/serverless', { stdio: 'inherit' });

  // Copy package.json for production dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const prodPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    type: packageJson.type,
    scripts: {
      start: 'node index.js'
    },
    dependencies: packageJson.dependencies
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(prodPackageJson, null, 2));

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}