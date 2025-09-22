# Railway Deployment Instructions

## Issues Fixed

1. **Health Check Configuration**: Added curl to Alpine Docker image and created a simple `/health` endpoint
2. **ES Modules Compatibility**: Fixed `__dirname` usage in ES modules by using `fileURLToPath` and `import.meta.url`
3. **Environment Variable Handling**: Improved error messages for missing environment variables

## Required Environment Variables

You need to set these environment variables in your Railway service:

### Required Variables
- `SUPABASE_URL`: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (secret key with admin privileges)
- `JWT_SECRET`: A secure random string for JWT signing (generate with: `openssl rand -base64 32`)

### Optional Variables
- `PORT`: Railway will set this automatically
- `NODE_ENV`: Set to `production` for production deployment
- `CORS_ORIGIN`: Set to your frontend URL
- `SOLANA_NETWORK`: `devnet` or `mainnet-beta`
- `SOLANA_RPC_URL`: Solana RPC endpoint
- `REWARD_RATE_PER_HOUR`: Default `0.1`
- `MIN_CLAIM_INTERVAL_HOURS`: Default `24`
- `MAX_DAILY_REWARD`: Default `2.4`

## Setting Environment Variables in Railway

1. Go to your Railway project dashboard
2. Select your service
3. Go to the "Variables" tab
4. Add each required environment variable

## Deployment Commands

```bash
# Link to your Railway project
railway link -p 59c37e50-e1d1-404f-a09c-58edbde358f2

# Deploy
railway up
```

## Troubleshooting

### 1. Health Check Failures
- Check if the service is listening on the PORT environment variable
- Verify the health endpoint is accessible at `/health`

### 2. Missing Environment Variables
- The application will show detailed error messages about missing variables
- Set all required variables in Railway dashboard

### 3. Database Connection Issues
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct
- Check if your Supabase project is accessible

## Health Check Endpoints

- `/health` - Simple health check (used by Railway)
- `/api/v1/health` - Detailed health check with database and Solana connection status
- `/api/v1/health/live` - Liveness probe
- `/api/v1/health/ready` - Readiness probe

## Docker Configuration

The Dockerfile includes:
- Multi-stage build for optimized image size
- curl installation for health checks
- Non-root user for security
- Proper health check configuration
- ES modules support