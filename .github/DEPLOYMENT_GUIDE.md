# 🚀 Deployment Guide - CI/CD Setup

This guide walks you through setting up automated deployment for your Timestamped Token Reward System using GitHub Actions and Railway.

## 📋 Prerequisites

- [GitHub Account](https://github.com) with repository access
- [Railway Account](https://railway.app) (free tier available)
- [Supabase Project](https://supabase.com) (external database)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│ GitHub Actions  │───▶│    Railway      │
│                 │    │                  │    │                 │
│ • Frontend      │    │ • Build & Test   │    │ • Frontend      │
│ • Backend       │    │ • Quality Gates  │    │ • Backend       │
│ • Shared Pkg    │    │ • Deploy         │    │ • Auto SSL      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Step 1: Railway Setup

### 1.1 Create Railway Account
1. Visit [Railway](https://railway.app)
2. Sign up with your GitHub account
3. Connect your repository

### 1.2 Create Services
Create two services in Railway:

**API Service:**
```bash
# Service name: api
# Root directory: apps/api
# Build command: npm run build
# Start command: npm start
```

**Web Service:**
```bash
# Service name: web
# Root directory: apps/web
# Build command: npm run build
# Start command: nginx -g "daemon off;"
```

### 1.3 Get Railway Token
1. Go to Railway Dashboard → Account Settings
2. Generate a new API token
3. Save it for GitHub Secrets setup

## 🔐 Step 2: GitHub Secrets Configuration

### 2.1 Required Secrets

Navigate to your GitHub repository → Settings → Secrets and Variables → Actions

Add the following secrets:

#### **Railway Deployment**
```
RAILWAY_TOKEN=rwy_xxx...
```

#### **Environment URLs**
```
API_HEALTH_URL=https://your-api.railway.app
WEB_HEALTH_URL=https://your-web.railway.app
```

#### **Frontend Build Variables**
```
VITE_API_URL=https://your-api.railway.app/api
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 2.2 Railway Environment Variables

In Railway, configure these environment variables for each service:

#### **API Service Environment Variables**
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-jwt-secret-256-bits-long
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
CORS_ORIGIN=https://your-web.railway.app
```

#### **Web Service Environment Variables**
```bash
VITE_API_URL=https://your-api.railway.app/api
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 🎯 Step 3: Workflow Configuration

The repository includes three main workflows:

### 3.1 CI Workflow (`.github/workflows/ci.yml`)
**Triggers:** Push to main/develop, Pull Requests
**Features:**
- Change detection (only tests/builds what changed)
- Quality gates (linting, formatting, type checking)
- Automated testing with database services
- Container image building and pushing

### 3.2 CD Workflow (`.github/workflows/cd.yml`)
**Triggers:** Successful CI completion on main branch
**Features:**
- Selective deployment based on changes
- Health checks after deployment
- Integration tests
- Automatic rollback on failure

### 3.3 Security Workflow (`.github/workflows/security-scan.yml`)
**Triggers:** Push, PR, Daily schedule
**Features:**
- Dependency vulnerability scanning
- Code security analysis (CodeQL)
- Secret scanning
- Container image scanning
- Environment validation

## 🚦 Step 4: Enable GitHub Actions

1. Go to your repository → Actions tab
2. Enable workflows if prompted
3. The workflows will run automatically on the next push to main

## 🔄 Step 5: Deployment Process

### Automatic Deployment Flow
1. **Push to main** → CI workflow runs
2. **CI passes** → CD workflow triggered
3. **Change detection** → Only changed services deploy
4. **Health checks** → Verify deployment success
5. **Integration tests** → End-to-end validation
6. **Notifications** → Deployment status

### Manual Deployment
```bash
# Trigger manual deployment
gh workflow run cd.yml
```

## 🔍 Step 6: Monitoring & Health Checks

### Health Check Endpoints
- **API Health**: `https://your-api.railway.app/health`
- **Web Health**: `https://your-web.railway.app` (homepage load)

### Monitoring Setup
1. **Railway Dashboard**: Monitor service metrics
2. **GitHub Actions**: View deployment logs
3. **Supabase Dashboard**: Monitor database performance

## 🛠️ Step 7: Environment Management

### Development Environment
```bash
npm run dev        # Start all services locally
npm run dev:web    # Frontend only
npm run dev:api    # Backend only
```

### Production Environment
- **API**: Deployed to Railway with production config
- **Web**: Deployed to Railway with optimized build
- **Database**: External Supabase (no deployment needed)

## 🔒 Security Best Practices

### Secret Management
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate JWT secrets regularly
- ✅ Use service role keys appropriately
- ✅ Enable secret scanning workflows

### Environment Isolation
- ✅ Separate dev/prod Supabase projects
- ✅ Different JWT secrets per environment
- ✅ Environment-specific CORS origins

## 🐛 Troubleshooting

### Common Issues

**1. Deployment Fails with "Health Check Failed"**
```bash
# Check Railway logs
railway logs --service api
railway logs --service web

# Verify environment variables
railway variables --service api
```

**2. Build Fails with TypeScript Errors**
```bash
# Run type checking locally
npm run type-check

# Check shared package build
npm run build:packages
```

**3. Tests Fail in CI**
```bash
# Run tests locally with same environment
npm run test:ci
```

### Getting Help

1. **Railway Issues**: Check [Railway Documentation](https://docs.railway.app)
2. **GitHub Actions Issues**: Check workflow logs in Actions tab
3. **Supabase Issues**: Check [Supabase Documentation](https://supabase.com/docs)

## 📈 Next Steps

### Production Readiness
1. **Custom Domain**: Configure custom domain in Railway
2. **SSL Certificates**: Automatic with Railway
3. **Database Backups**: Configure in Supabase
4. **Monitoring**: Set up error tracking (Sentry)
5. **Performance**: Configure CDN for static assets

### Advanced Features
1. **Staging Environment**: Create staging branch deployment
2. **Feature Branches**: Preview deployments
3. **Database Migrations**: Automated migration workflows
4. **Blue-Green Deployment**: Zero-downtime deployments

---

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ CI/CD workflows run without errors
- ✅ Both services deploy automatically on push to main
- ✅ Health checks pass after deployment
- ✅ Application is accessible via Railway URLs
- ✅ Database connections work properly
- ✅ Solana integration functions correctly

Happy deploying! 🚀