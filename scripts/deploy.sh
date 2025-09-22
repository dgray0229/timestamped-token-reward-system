#!/bin/bash

# Deployment script for Timestamped Token Reward System
# Usage: ./scripts/deploy.sh [development|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-development}

echo -e "${BLUE}🚀 Starting deployment for ${ENVIRONMENT} environment${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_dependencies() {
    echo -e "${BLUE}📋 Checking dependencies...${NC}"

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_status "Docker is installed"

    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_status "Docker Compose is installed"
}

# Check environment file
check_env_file() {
    echo -e "${BLUE}📄 Checking environment configuration...${NC}"

    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example"
        cp .env.example .env
        print_warning "Please update .env with your actual values before continuing"
        read -p "Press enter when you've updated the .env file..."
    fi
    print_status "Environment file exists"
}

# Validate environment variables
validate_env() {
    echo -e "${BLUE}🔍 Validating environment variables...${NC}"

    required_vars=("JWT_SECRET" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")

    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env && [ "$(grep "^${var}=" .env | cut -d'=' -f2-)" != "" ]; then
            print_status "$var is set"
        else
            print_error "$var is not set in .env file"
            exit 1
        fi
    done
}

# Create necessary directories
create_directories() {
    echo -e "${BLUE}📁 Creating necessary directories...${NC}"

    mkdir -p logs/nginx
    mkdir -p nginx/ssl
    print_status "Directories created"
}

# Build and deploy
deploy() {
    echo -e "${BLUE}🏗️ Building and deploying containers...${NC}"

    if [ "$ENVIRONMENT" = "development" ]; then
        echo -e "${YELLOW}🔧 Deploying in development mode${NC}"
        docker compose -f docker-compose.dev.yml down
        docker compose -f docker-compose.dev.yml up --build -d
    elif [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${GREEN}🌟 Deploying in production mode${NC}"
        docker compose -f docker-compose.prod.yml down
        docker compose -f docker-compose.prod.yml up --build -d
    else
        print_error "Invalid environment. Use 'development' or 'production'"
        exit 1
    fi

    print_status "Containers deployed"
}

# Wait for services to be healthy
wait_for_services() {
    echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"

    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if [ "$ENVIRONMENT" = "development" ]; then
            if docker compose -f docker-compose.dev.yml ps | grep -q "healthy"; then
                break
            fi
        else
            if docker compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
                break
            fi
        fi

        attempt=$((attempt + 1))
        echo -e "${YELLOW}Waiting for services... (${attempt}/${max_attempts})${NC}"
        sleep 10
    done

    if [ $attempt -eq $max_attempts ]; then
        print_error "Services failed to start within expected time"
        exit 1
    fi

    print_status "Services are ready"
}

# Show service status
show_status() {
    echo -e "${BLUE}📊 Service Status:${NC}"

    if [ "$ENVIRONMENT" = "development" ]; then
        docker compose -f docker-compose.dev.yml ps
        echo -e "${GREEN}🌐 Application URLs:${NC}"
        echo -e "  Frontend: ${BLUE}http://localhost:5173${NC}"
        echo -e "  API: ${BLUE}http://localhost:3001${NC}"
        echo -e "  Database: ${BLUE}localhost:5432${NC}"
        echo -e "  Redis: ${BLUE}localhost:6379${NC}"
    else
        docker compose -f docker-compose.prod.yml ps
        echo -e "${GREEN}🌐 Application URLs:${NC}"
        echo -e "  Application: ${BLUE}http://localhost${NC}"
        echo -e "  HTTPS: ${BLUE}https://localhost${NC} (if SSL configured)"
    fi
}

# Cleanup function
cleanup_on_error() {
    echo -e "${RED}💥 Error occurred during deployment${NC}"
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"

    if [ "$ENVIRONMENT" = "development" ]; then
        docker compose -f docker-compose.dev.yml down
    else
        docker compose -f docker-compose.prod.yml down
    fi
}

# Set up error handling
trap cleanup_on_error ERR

# Main deployment flow
main() {
    echo -e "${BLUE}🎯 Deploying Timestamped Token Reward System${NC}"
    echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
    echo ""

    check_dependencies
    check_env_file
    validate_env
    create_directories
    deploy
    wait_for_services
    show_status

    echo ""
    print_status "Deployment completed successfully!"

    if [ "$ENVIRONMENT" = "production" ]; then
        print_warning "For production deployment, consider:"
        echo "  • Setting up SSL certificates in nginx/ssl/"
        echo "  • Configuring a proper domain name"
        echo "  • Setting up monitoring and alerting"
        echo "  • Implementing backup strategies"
    fi
}

# Run main function
main
