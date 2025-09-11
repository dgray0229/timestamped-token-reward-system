#!/bin/bash

# Development environment setup script
set -e

echo "🔧 Setting up development environment..."

# Check if .env file exists, create from example if not
if [ ! -f .env ]; then
    echo "📋 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your actual configuration values"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
echo "🔍 Checking Node.js..."
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2)
REQUIRED_VERSION="18.0.0"

if ! node -p "process.version" | grep -E "v(18|19|20)" > /dev/null; then
    echo "⚠️  Node.js version $NODE_VERSION detected. Recommended: 18.x or later"
fi

# Check npm
if ! command_exists npm; then
    echo "❌ npm is not installed"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Anchor is installed (for Solana program development)
echo "🔍 Checking Anchor CLI..."
if ! command_exists anchor; then
    echo "⚠️  Anchor CLI not found. Installing..."
    if command_exists cargo; then
        cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
    else
        echo "❌ Rust/Cargo is required to install Anchor CLI"
        echo "   Visit: https://rustup.rs/"
    fi
fi

# Check if Solana CLI is installed
echo "🔍 Checking Solana CLI..."
if ! command_exists solana; then
    echo "⚠️  Solana CLI not found. Please install from: https://docs.solana.com/cli/install-solana-cli-tools"
fi

# Build shared packages
echo "🏗️  Building shared packages..."
cd packages/shared
npx tsc
cd ../..

# Initialize Solana program if Anchor is available
if command_exists anchor; then
    echo "⚓ Setting up Solana program..."
    cd programs/reward-system
    
    # Initialize if not already done
    if [ ! -f Anchor.toml ]; then
        anchor init reward-system --typescript
    fi
    
    # Build the program
    echo "🏗️  Building Solana program..."
    anchor build
    
    cd ../..
fi

# Start development services with Docker Compose
echo "🐳 Starting development services..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres; do
    echo "   Waiting for postgres..."
    sleep 2
done

# Run database initialization
echo "🗄️  Initializing database..."
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -f /docker-entrypoint-initdb.d/init-db.sql

# Create development launch script
echo "📝 Creating development launch script..."
cat > start-dev.sh << 'EOF'
#!/bin/bash

# Start development servers
echo "🚀 Starting development servers..."

# Start backend API
echo "📡 Starting API server..."
npm run dev --workspace=apps/api &
API_PID=$!

# Start frontend
echo "🌐 Starting web application..."
npm run dev --workspace=apps/web &
WEB_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $API_PID $WEB_PID 2>/dev/null
    docker-compose -f docker-compose.dev.yml down
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo ""
echo "🎉 Development environment is running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo "🗄️  Database: localhost:5432"
echo "📊 Redis: localhost:6379"
echo ""
echo "💡 Useful commands:"
echo "   npm run test            # Run all tests"
echo "   npm run build           # Build all packages"
echo "   npm run type-check      # Check TypeScript"
echo "   anchor test             # Test Solana program"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait
EOF

chmod +x start-dev.sh

# Create docker-compose.dev.yml for development services only
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: reward_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  postgres_dev_data:
  redis_dev_data:
EOF

echo ""
echo "✅ Development environment setup completed!"
echo ""
echo "🚀 To start development:"
echo "   ./start-dev.sh"
echo ""
echo "📚 Documentation:"
echo "   - API: http://localhost:3001/docs (when running)"
echo "   - Frontend: React + TypeScript + Redux Toolkit"
echo "   - Backend: Express + TypeScript + Supabase"
echo "   - Blockchain: Solana + Anchor"
echo ""
echo "🔧 Configuration:"
echo "   - Update .env file with your Supabase and Solana settings"
echo "   - Refer to .env.example for all available options"