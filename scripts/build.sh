#!/bin/bash
set -e

echo "Building Tomoshibi for production..."

# Clean previous build
rm -rf dist

# Build client
echo "Building client..."
npx vite build --outDir dist/public

# Build server
echo "Building server..."
npx esbuild server/index.ts --bundle --platform=node --target=node18 --outfile=dist/index.js --external:pg-native --external:better-sqlite3 --external:@neondatabase/serverless --format=cjs

# Copy shared files
echo "Copying shared files..."
mkdir -p dist/shared
cp -r shared/* dist/shared/

echo "Build completed successfully!"