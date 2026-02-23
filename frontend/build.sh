#!/bin/bash
# Build script for Railway
echo "Installing dependencies..."
npm install

echo "Building Next.js..."
npm run build

echo "Build complete!"
