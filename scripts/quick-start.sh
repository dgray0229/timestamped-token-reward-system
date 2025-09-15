#!/bin/bash

# Quick development setup script - minimal requirements
set -e

echo "🚀 Quick Start - Solana Reward System"

# Check if .env file exists, create from example if not
if [ ! -f .env ]; then
    echo "📋 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your actual configuration values"
fi

# Build shared package
echo "🏗️  Building shared package..."
cd packages/shared
npx tsc
cd ../..

# Start development servers
echo "🚀 Starting development servers..."

# Start API in background
echo "📡 Starting API server..."
cd apps/api
npm run dev &
API_PID=$!
cd ../..

# Wait a moment for API to start
sleep 3

# Start frontend
echo "🌐 Starting web application..."
cd apps/web
npm run dev &
WEB_PID=$!
cd ..

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $API_PID $WEB_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo ""
echo "🎉 Development servers are starting!"
echo ""
echo "📱 Frontend: http://localhost:5173 (Vite dev server)"
echo "🔌 API: http://localhost:3001"
echo ""
echo "💡 Configuration needed:"
echo "   1. Update .env with your Supabase credentials"
echo "   2. Update .env with your Solana RPC endpoint"
echo "   3. Install Phantom wallet browser extension"
echo ""
echo "📚 Quick Setup Guide:"
echo "   - Sign up at https://supabase.com for free database"
echo "   - Use Solana devnet for testing: https://api.devnet.solana.com"
echo "   - Install browser wallet: https://phantom.app"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait