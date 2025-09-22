# Railway CORS Configuration Fix

## Issue

The frontend at `https://tokenrewards.devingray.io` is being blocked by CORS policy when trying to access the API at `https://charismatic-rejoicing-production.up.railway.app`.

## Root Cause

The Railway deployment doesn't have the `CORS_ORIGIN` environment variable configured to allow the production frontend domain.

## Solution

### 1. Set Environment Variable on Railway

In your Railway dashboard:

1. Go to your API service project
2. Navigate to the **Variables** tab
3. Add a new environment variable:
   - **Key**: `CORS_ORIGIN`
   - **Value**: `https://tokenrewards.devingray.io`

### 2. For Multiple Domains (Optional)

If you need to allow multiple origins (e.g., both development and production):

- **Key**: `CORS_ORIGIN`
- **Value**: `http://localhost:5173,https://tokenrewards.devingray.io`

### 3. Redeploy

After setting the environment variable, Railway should automatically redeploy your service. If not, trigger a manual redeploy.

## Verification

Once deployed, you can verify the CORS configuration by:

1. Opening browser developer tools
2. Visiting `https://tokenrewards.devingray.io`
3. Attempting to connect a wallet
4. Checking that there are no CORS errors in the console

## Backup Configuration

The API code has been updated to automatically use `https://tokenrewards.devingray.io` as the default CORS origin when `NODE_ENV=production`, so even if the environment variable isn't set, it should work for your production domain.

## Commands to Run After Deployment

```bash
# Test the API health endpoint
curl https://charismatic-rejoicing-production.up.railway.app/health

# Test CORS preflight request
curl -H "Origin: https://tokenrewards.devingray.io" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://charismatic-rejoicing-production.up.railway.app/api/v1/auth/wallet/connect
```

The OPTIONS request should return CORS headers including:

```
Access-Control-Allow-Origin: https://tokenrewards.devingray.io
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID
```
