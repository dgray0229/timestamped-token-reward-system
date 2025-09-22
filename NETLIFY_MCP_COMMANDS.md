# Netlify MCP Deployment Commands

## Step-by-Step Netlify Deployment

### 1. Create New Site
Use your Netlify MCP to create a new site from your GitHub repository:

```
# Connect your GitHub repo and create site
# Repository: TimestampedTokenRewardSystem
# Build settings:
```

**Build Settings:**
- **Base directory**: `apps/web`
- **Build command**: `yarn build`
- **Publish directory**: `apps/web/dist`
- **Node.js version**: `20`

### 2. Set Environment Variables
Configure these environment variables in Netlify:

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

### 3. Deploy the Site
Trigger the initial deployment - Netlify will:
- ✅ Install dependencies with yarn
- ✅ Build the React app
- ✅ Deploy to global CDN
- ✅ Provide you with a domain (e.g., `https://amazing-app-123.netlify.app`)

### 4. Update Backend CORS (After Getting Netlify Domain)
Once you have your Netlify domain, update the Railway backend:

**In Railway dashboard:**
1. Go to your project variables
2. Set `CORS_ORIGIN` to:
   ```
   http://localhost:5173,https://YOUR-NETLIFY-DOMAIN.netlify.app
   ```

**Example:**
```
CORS_ORIGIN=http://localhost:5173,https://amazing-app-123.netlify.app
```

### 5. Redeploy Backend
```bash
railway up --service charismatic-rejoicing
```

## What's Already Configured

### ✅ Netlify Configuration Files Created:
- `apps/web/netlify.toml` - Build and redirect settings
- `apps/web/public/_redirects` - SPA routing support
- `apps/web/.env.production` - Production environment variables

### ✅ Backend Updates:
- CORS configuration supports multiple origins
- Backend deployed with updated settings
- Health check endpoint available

### ✅ Frontend Build:
- Production build tested and working
- All Solana wallet integrations configured
- React Router setup for SPA

## Testing After Deployment

### 1. Basic Functionality
- Visit your Netlify URL
- Navigate between pages (dashboard, rewards, etc.)
- Open browser dev tools - no console errors

### 2. API Connection
Test in browser console:
```javascript
fetch('https://charismatic-rejoicing-production.up.railway.app/api/v1/health')
  .then(r => r.json())
  .then(console.log)
```

### 3. Wallet Integration
- Click "Connect Wallet" button
- Connect Phantom or Solflare wallet
- Verify wallet shows as connected

## Next Steps After Deployment

1. **Custom Domain** (Optional):
   - Configure custom domain in Netlify
   - Update Railway CORS_ORIGIN with new domain

2. **Monitoring**:
   - Set up Netlify analytics
   - Configure error reporting
   - Monitor API usage in Railway

3. **Production Readiness**:
   - Switch to Solana mainnet when ready
   - Configure real monitoring/alerting
   - Set up CI/CD for automated deployments

## Troubleshooting

### Build Failures:
- Check Node.js version (should be 20)
- Verify all environment variables are set
- Check build logs for specific errors

### CORS Issues:
- Ensure Netlify domain is in Railway CORS_ORIGIN
- Check exact domain format (https://, no trailing slash)
- Verify Railway backend is running

### Wallet Connection Issues:
- Check browser wallet extensions are installed
- Verify Solana network matches (devnet)
- Check browser console for wallet-specific errors