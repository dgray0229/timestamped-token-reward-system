#!/bin/bash

# Deployment script for Solana Reward System
set -e

echo "🚀 Starting deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Default values
ENVIRONMENT=${ENVIRONMENT:-production}
BUILD_CACHE=${BUILD_CACHE:-false}

echo "📝 Deployment Configuration:"
echo "   Environment: $ENVIRONMENT"
echo "   Build Cache: $BUILD_CACHE"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "🔍 Checking dependencies..."
if ! command_exists docker; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start services
echo "🏗️  Building and starting services..."
if [ "$BUILD_CACHE" = "false" ]; then
    docker-compose build --no-cache
else
    docker-compose build
fi

# Start services
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps | grep -q "healthy"; then
        echo "✅ Services are healthy!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 10
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Services failed to become healthy"
    docker-compose logs
    exit 1
fi

# Run database migrations (if needed)
echo "🗄️  Running database migrations..."
docker-compose exec -T api npm run migrate

# Display status
echo "📊 Deployment Status:"
docker-compose ps

echo "🎉 Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost"
echo "   API: http://localhost/api"
echo "   Health Check: http://localhost/health"
echo ""
echo "📊 Monitoring:"
echo "   Logs: docker-compose logs -f"
echo "   Status: docker-compose ps"