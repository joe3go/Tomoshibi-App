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
npx tsc -p tsconfig.production.json

# Create production package.json
echo "Creating production package.json..."
cat > dist/package.json << 'EOF'
{
  "name": "tomoshibi-production",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server/index.js"
  }
}
EOF

# Copy node_modules (only production dependencies would be better but this ensures everything works)
echo "Copying dependencies..."
cp -r node_modules dist/

echo "Build completed successfully!"