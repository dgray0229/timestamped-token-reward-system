# Netlify Deployment Guide

## Overview
This guide will help you deploy the React frontend to Netlify and connect it to your Railway backend API.

## Prerequisites
- ✅ Backend API deployed on Railway: `https://charismatic-rejoicing-production.up.railway.app`
- ✅ Netlify account and access to your MCP
- ✅ GitHub repository with the project

## Deployment Steps

### 1. Set Railway Environment Variables
In your Railway dashboard, add this environment variable:
```
CORS_ORIGIN=http://localhost:5173,https://your-netlify-domain.netlify.app
```
*Note: You'll update this with your actual Netlify domain after deployment*

### 2. Deploy Backend Changes
```bash
railway up
```

### 3. Configure Netlify via MCP
Use your Netlify MCP to:

#### Create a new site:
- Connect your GitHub repository
- Set build directory: `apps/web`
- Build command: `yarn build`
- Publish directory: `apps/web/dist`

#### Set Environment Variables in Netlify:
```
VITE_API_BASE_URL=https://charismatic-rejoicing-production.up.railway.app/api/v1
VITE_API_TIMEOUT=10000
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_APP_NAME=Timestamped Token Reward System
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### 4. Update CORS After Deployment
Once you get your Netlify domain (e.g., `https://amazing-app-123.netlify.app`):

1. Update Railway environment variable:
   ```
   CORS_ORIGIN=http://localhost:5173,https://amazing-app-123.netlify.app
   ```

2. Redeploy backend:
   ```bash
   railway up
   ```

## Files Created

### Configuration Files
- ✅ `apps/web/netlify.toml` - Netlify build and redirect configuration
- ✅ `apps/web/public/_redirects` - SPA routing fallback
- ✅ `apps/web/.env.production` - Production environment variables

### Key Features Enabled
- **SPA Routing**: React Router works properly with Netlify redirects
- **Security Headers**: XSS protection, content type sniffing prevention
- **Asset Caching**: Optimized caching for static assets
- **CORS Support**: Backend allows requests from Netlify domain

## Testing the Deployment

### 1. Frontend Health Check
Visit your Netlify URL and verify:
- ✅ App loads without errors
- ✅ Navigation works (React Router)
- ✅ Wallet connection modal appears

### 2. Backend Connection Test
In browser console:
```javascript
fetch('https://charismatic-rejoicing-production.up.railway.app/api/v1/health')
  .then(r => r.json())
  .then(console.log)
```

### 3. Full Flow Test
- Connect a Solana wallet (Phantom/Solflare)
- Verify API calls work
- Test reward claiming functionality

## Troubleshooting

### CORS Errors
- Ensure Netlify domain is added to Railway `CORS_ORIGIN`
- Check browser network tab for specific error messages

### Build Failures
- Verify all shared package dependencies are built
- Check Node.js version compatibility (using Node 20)

### Environment Variables
- Ensure all `VITE_*` variables are set in Netlify
- Check that Railway backend URL is accessible

## Production Considerations

### Solana Network
Currently configured for `devnet`. For mainnet:
1. Update environment variables:
   ```
   VITE_SOLANA_NETWORK=mainnet-beta
   VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ```

### Custom Domain
When ready for custom domain:
1. Configure in Netlify dashboard
2. Update Railway CORS_ORIGIN with new domain
3. Update any hardcoded URLs

### Analytics & Monitoring
Environment variables are configured for:
- Analytics tracking
- Error reporting
- Performance monitoring

Implement these features as needed for production monitoring.