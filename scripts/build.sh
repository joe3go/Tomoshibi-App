#!/bin/bash
set -e

echo "Starting build process..."

# Build client
echo "Building client..."
npm run build:client

# Build server
echo "Building server..."
node build-server.js

echo "Build completed successfully!"