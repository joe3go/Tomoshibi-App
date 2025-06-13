#!/bin/bash
set -e

echo "Starting build process..."

# Change to project root directory
cd "$(dirname "$0")/.."

# Build client
echo "Building client..."
npm run build:client

# Build server
echo "Building server..."
node build-server.js

echo "Build completed successfully!"