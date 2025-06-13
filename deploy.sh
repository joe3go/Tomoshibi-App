#!/bin/bash

# Tomoshibi Deployment Script
# This script prepares the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting Tomoshibi deployment preparation..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
mkdir -p dist

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install --production=false

# Build client
echo "🔨 Building client application..."
npm run build:client

# Build server using our custom build script
echo "🔧 Building server application..."
node build-server.js

# Verify build outputs
echo "✅ Verifying build outputs..."
if [ ! -d "dist/public" ]; then
    echo "❌ Client build failed - dist/public directory not found"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ Server build failed - dist/index.js not found"
    exit 1
fi

# Create production package.json
echo "📄 Creating production package.json..."
cat > dist/package.json << EOF
{
  "name": "tomoshibi-production",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "NODE_ENV=production node index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Copy shared schema for runtime
echo "📋 Copying shared schema..."
mkdir -p dist/shared
cp -r shared/* dist/shared/

# Set proper permissions
chmod +x dist/index.js

echo "✨ Deployment preparation complete!"
echo "📊 Build summary:"
echo "   - Client: dist/public/"
echo "   - Server: dist/index.js"
echo "   - Shared: dist/shared/"
echo ""
echo "🎯 Ready for production deployment!"