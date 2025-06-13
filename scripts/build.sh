#!/bin/bash
set -e

echo "Building Tomoshibi for production..."

# Clean previous build
rm -rf dist
mkdir -p dist

# Build client assets
echo "Building client..."
npm run build:client

# Build server files
echo "Building server..."
npm run build:server

# Create the main entry point at dist/index.js
echo "Creating production entry point..."
if [ -f "dist/server/production-index.js" ]; then
  cp dist/server/production-index.js dist/index.js
  echo "✓ Entry point created: dist/index.js"
else
  echo "Building production entry directly..."
  npx esbuild server/production-index.ts --bundle --platform=node --target=es2022 --format=esm --outfile=dist/index.js --external:express --external:@neondatabase/serverless --external:drizzle-orm --external:ws --external:bcrypt --external:jsonwebtoken --external:passport --external:express-session --external:connect-pg-simple --external:multer --external:openai
  echo "✓ Entry point built: dist/index.js"
fi

# Ensure the entry point is executable
chmod +x dist/index.js

# Create minimal production package.json
echo "Creating production package.json..."
cat > dist/package.json << 'EOF'
{
  "name": "tomoshibi-production",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Copy production dependencies
echo "Setting up dependencies..."
cp -r node_modules dist/ 2>/dev/null || echo "Note: node_modules will be installed by deployment"

echo "✓ Build completed successfully!"
echo "📁 Build structure:"
ls -la dist/
echo "🚀 Ready for deployment: dist/index.js"