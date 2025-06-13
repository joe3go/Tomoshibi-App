#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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
  execSync('node build-server.js', { stdio: 'inherit' });

  // Copy package.json for production dependencies (CommonJS compatible)
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const prodPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    // Removed type: "module" to ensure CommonJS compatibility
    scripts: {
      start: 'NODE_ENV=production node index.js'
    },
    dependencies: packageJson.dependencies
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(prodPackageJson, null, 2));

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}