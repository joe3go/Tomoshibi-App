#!/bin/bash
set -e

echo "Building Tomoshibi for production..."

# Clean previous build
rm -rf dist

# Build client
echo "Building client..."
npx vite build --outDir dist/public

# Build server with TypeScript project
echo "Building server..."
npx tsc -p tsconfig.production.json

# Move the built production entry point to the correct location
echo "Setting up production entry point..."
if [ -f "dist/server/production-index.js" ]; then
  mv dist/server/production-index.js dist/index.js
  echo "Production entry point moved to dist/index.js"
else
  echo "Warning: dist/server/production-index.js not found"
  # Fallback: build it directly
  npx tsc server/production-index.ts --target es2022 --module esnext --moduleResolution node --outDir . --skipLibCheck --esModuleInterop
  mv production-index.js dist/index.js
fi

# Create production package.json
echo "Creating production package.json..."
cat > dist/package.json << 'EOF'
{
  "name": "tomoshibi-production",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}
EOF

# Copy package.json dependencies info for production
echo "Copying node_modules..."
cp -r node_modules dist/

echo "Build completed successfully!"
echo "Entry point: dist/index.js"
ls -la dist/