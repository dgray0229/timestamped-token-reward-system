# Railway Deployment Guide

This guide explains how to deploy the Timestamped Token Reward System to Railway.

## Prerequisites

1. [Railway account](https://railway.app)
2. Railway CLI installed: `npm install -g @railway/cli`
3. Project configured with environment variables

## Deployment Steps

### 1. Create Railway Project

```bash
# Login to Railway
railway login

# Create a new project
railway init
```

### 2. Add Services

You'll need to create 4 services in your Railway project:

#### A. PostgreSQL Database
1. Go to your Railway dashboard
2. Click "Add Service" → "Database" → "PostgreSQL"
3. Note the generated `DATABASE_URL`

#### B. Redis (Optional but recommended)
1. Click "Add Service" → "Database" → "Redis"
2. Note the generated `REDIS_URL`

#### C. API Service
1. Click "Add Service" → "GitHub Repo"
2. Connect your repository
3. Set root directory to `/` (monorepo root)
4. Configure environment variables (see below)

#### D. Web Service
1. Click "Add Service" → "GitHub Repo"
2. Connect the same repository
3. Set root directory to `/` (monorepo root)
4. Configure environment variables (see below)

### 3. Environment Variables

#### API Service Variables
Set these in the API service settings:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secure-jwt-secret-here
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
CORS_ORIGIN=${{web.url}}
```

#### Web Service Variables
Set these in the Web service settings:

```
VITE_API_URL=${{api.url}}/api
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 4. Service Dependencies

Configure service dependencies in Railway:
- Web service depends on API service
- API service depends on PostgreSQL and Redis

### 5. Custom Domains (Optional)

1. Go to each service settings
2. Add custom domain under "Networking"
3. Update CORS_ORIGIN and VITE_API_URL accordingly

## Deployment Commands

### Deploy from CLI
```bash
# Deploy API service
railway up --service api

# Deploy Web service
railway up --service web
```

### Deploy from GitHub
Railway will automatically deploy when you push to your connected branch.

## Database Setup

After first deployment, you may need to run database migrations:

```bash
# Connect to API service
railway shell --service api

# Run any necessary setup commands
npm run db:setup
```

## Monitoring

- Check logs in Railway dashboard
- Monitor service health via built-in health checks
- API health check: `/health`
- Web health check: `/`

## Troubleshooting

### Common Issues

1. **Build failures**: Check build logs in Railway dashboard
2. **Environment variables**: Ensure all required vars are set
3. **Service dependencies**: Verify services can reach each other
4. **Database connection**: Check DATABASE_URL format and permissions

### Logs
```bash
# View API logs
railway logs --service api

# View Web logs
railway logs --service web
```

## Cost Optimization

- Use Railway's sleep feature for development environments
- Monitor usage in Railway dashboard
- Consider using shared databases for multiple environments

## Security Checklist

- [ ] Strong JWT_SECRET generated
- [ ] Database credentials secured
- [ ] CORS properly configured
- [ ] Environment variables not exposed in logs
- [ ] HTTPS enforced for production domains