# Docker Deployment Guide

This guide provides comprehensive instructions for containerizing and running the Timestamped Token Reward System using Docker.

## Overview

The application consists of multiple services:
- **Frontend**: React app served by Nginx
- **Backend**: Node.js Express API
- **Database**: PostgreSQL with persistent storage
- **Cache**: Redis for session and cache storage
- **Proxy**: Nginx reverse proxy with SSL support

## Prerequisites

### Required Software
- Docker Engine 20.0+
- Docker Compose 1.29+
- Git

### Installation Links
- [Docker Desktop](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd TimestampedTokenRewardSystem
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your values:

```bash
# Required for all environments
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Frontend URLs
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. Deploy

#### Development Mode
```bash
# Using deployment script (recommended)
./scripts/deploy.sh development

# Or using npm scripts
npm run docker:dev

# Or using docker-compose directly
docker-compose -f docker-compose.dev.yml up --build
```

#### Production Mode
```bash
# Using deployment script (recommended)
./scripts/deploy.sh production

# Or using npm scripts
npm run docker:prod

# Or using docker-compose directly
docker-compose -f docker-compose.prod.yml up -d --build
```

## Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:build` | Build all containers |
| `npm run docker:up` | Start services (default compose file) |
| `npm run docker:down` | Stop all services |
| `npm run docker:logs` | View service logs |
| `npm run docker:dev` | Start development environment |
| `npm run docker:prod` | Start production environment |
| `npm run docker:clean` | Stop services and clean up |

## Environment Configurations

### Development (`docker-compose.dev.yml`)

**Features:**
- Hot reload for both frontend and backend
- Source code mounted as volumes
- Debug logging enabled
- Direct port exposure for debugging
- Faster startup times

**Ports:**
- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`
- Database: `localhost:5432`
- Redis: `localhost:6379`

### Production (`docker-compose.prod.yml`)

**Features:**
- Optimized multi-stage builds
- Resource limits and health checks
- Network isolation (backend services internal)
- SSL ready (configure certificates)
- Monitoring services (optional)
- Log aggregation

**Ports:**
- Application: `http://localhost:80`
- HTTPS: `https://localhost:443` (when SSL configured)
- Monitoring: `http://localhost:3000` (Grafana, if enabled)

### Default (`docker-compose.yml`)

**Features:**
- Balanced configuration for testing
- Good for staging environments
- Includes nginx reverse proxy
- Basic monitoring setup

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│   Web App       │
│   (Port 80/443) │    │   (React/Nginx) │
└─────────────────┘    └─────────────────┘
         │                       │
         ├───────────────────────┘
         │
┌─────────────────┐    ┌─────────────────┐
│   API Server    │────│   PostgreSQL    │
│   (Node.js)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘
         │
┌─────────────────┐
│     Redis       │
│    (Cache)      │
└─────────────────┘
```

## Health Monitoring

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker-compose logs <service-name>
```

### Health Check Endpoints

- **API**: `GET /api/v1/health`
- **Web**: `GET /health`
- **Nginx**: `GET /health`

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for JWT token signing | `your-secret-key-here` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `NODE_ENV` | `development` | Node environment |
| `SOLANA_NETWORK` | `devnet` | Solana network |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origins |
| `LOG_LEVEL` | `info` | Logging level |

### Production-Only Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `GRAFANA_PASSWORD` | Grafana admin password |
| `SSL_CERT_PATH` | SSL certificate path |
| `SSL_KEY_PATH` | SSL private key path |

## SSL Configuration

### For Production Deployment

1. **Obtain SSL certificates:**
   ```bash
   # Using Let's Encrypt
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Copy certificates:**
   ```bash
   mkdir -p nginx/ssl
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
   ```

3. **Update nginx configuration:**
   Uncomment the HTTPS server block in `nginx/nginx.conf`

4. **Set environment variables:**
   ```bash
   SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
   SSL_KEY_PATH=/etc/nginx/ssl/key.pem
   DOMAIN=yourdomain.com
   ```

## Monitoring and Logging

### Enable Monitoring (Production)

```bash
# Start with monitoring services
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

**Services:**
- **Prometheus**: Metrics collection (`http://localhost:9090`)
- **Grafana**: Visualization (`http://localhost:3000`)
- **Fluent Bit**: Log aggregation

### Log Access

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web

# Log files (if volume mounted)
tail -f logs/nginx/access.log
tail -f logs/api/app.log
```

## Backup and Persistence

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres reward_system > backup.sql

# Restore backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres reward_system
```

### Volume Backup

```bash
# List volumes
docker volume ls

# Backup volume
docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volume
docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check port usage
   lsof -i :3001
   lsof -i :5173

   # Change ports in environment variables
   ```

2. **Permission issues:**
   ```bash
   # Fix ownership
   sudo chown -R $USER:$USER logs/
   chmod +x scripts/deploy.sh
   ```

3. **Memory issues:**
   ```bash
   # Increase Docker memory limit
   # Docker Desktop > Settings > Resources > Memory

   # Or add to docker-compose:
   deploy:
     resources:
       limits:
         memory: 1G
   ```

4. **Build failures:**
   ```bash
   # Clean build cache
   docker builder prune

   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Debug Commands

```bash
# Access container shell
docker-compose exec api bash
docker-compose exec web sh

# Check container logs
docker-compose logs --tail 100 api

# Inspect container
docker inspect <container-name>

# Check network connectivity
docker-compose exec api ping postgres
docker-compose exec web curl api:3001/health
```

### Performance Optimization

1. **Multi-stage builds**: Already implemented in Dockerfiles
2. **Build cache**: Use `.dockerignore` files (included)
3. **Resource limits**: Set in production compose file
4. **Health checks**: Configured for all services

## Security Considerations

### Production Security

1. **Change default passwords:**
   ```bash
   JWT_SECRET=<strong-random-key>
   POSTGRES_PASSWORD=<strong-password>
   ```

2. **Network isolation:**
   - Backend services use internal network
   - Only necessary ports exposed

3. **SSL/TLS:**
   - Configure SSL certificates
   - Force HTTPS redirects

4. **Security headers:**
   - Already configured in nginx
   - CSP, HSTS, XSS protection

5. **Regular updates:**
   ```bash
   # Update base images
   docker-compose pull
   docker-compose up -d
   ```

## Scaling

### Horizontal Scaling

```yaml
# In docker-compose.yml
api:
  deploy:
    replicas: 3

web:
  deploy:
    replicas: 2
```

### Load Balancing

Nginx is configured for load balancing:
- Round-robin for API services
- Sticky sessions for web services

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          ./scripts/deploy.sh production
```

## Support

For issues related to Docker deployment:

1. Check the logs first: `docker-compose logs`
2. Verify environment variables are set correctly
3. Ensure ports are not in use by other services
4. Check Docker and Docker Compose versions

### Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)