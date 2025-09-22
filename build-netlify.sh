#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
yarn install --frozen-lockfile

echo "📦 Building shared package..."
yarn workspace @reward-system/shared build

echo "🚀 Building web app..."
yarn workspace web build

echo "✅ Build complete!"