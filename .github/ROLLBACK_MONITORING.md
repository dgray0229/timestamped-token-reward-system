# 🔄 Rollback Procedures & Monitoring Guide

This guide covers rollback strategies, monitoring setup, and incident response procedures for the Timestamped Token Reward System deployment pipeline.

## 🎯 Rollback Strategy Overview

Our rollback strategy implements multiple layers of safety nets to ensure system reliability and quick recovery from deployment issues.

```
┌─────────────────────────────────────────────────────────────┐
│                    Rollback Hierarchy                      │
├─────────────────────────────────────────────────────────────┤
│ Level 1: Automatic │ Health Check Failures                 │
├─────────────────────────────────────────────────────────────┤
│ Level 2: Manual    │ Performance Issues                    │
├─────────────────────────────────────────────────────────────┤
│ Level 3: Emergency │ Critical System Failures              │
└─────────────────────────────────────────────────────────────┘
```

## 🤖 Automatic Rollback Mechanisms

### 1. Health Check-Based Rollback
**Trigger**: Health check failures after deployment

```yaml
# Configured in CD workflow
- name: Health check API
  run: |
    max_attempts=10
    attempt=1
    while [ $attempt -le $max_attempts ]; do
      if curl -f "${{ secrets.API_HEALTH_URL }}/health"; then
        echo "✅ Health check passed"
        break
      else
        if [ $attempt -eq $max_attempts ]; then
          echo "❌ Health check failed - triggering rollback"
          exit 1
        fi
        sleep 10
        attempt=$((attempt + 1))
      fi
    done
```

**Automatic Actions**:
- CI/CD pipeline detects health check failure
- Triggers rollback workflow automatically
- Reverts to previous known-good deployment
- Sends failure notifications

### 2. Integration Test Rollback
**Trigger**: Post-deployment integration test failures

```bash
# Integration test failure detection
if npm run test:integration:production; then
  echo "✅ Integration tests passed"
else
  echo "❌ Integration tests failed - initiating rollback"
  exit 1
fi
```

## 🔧 Manual Rollback Procedures

### Railway Platform Rollback

#### Option 1: Railway Dashboard
1. **Navigate to Railway Dashboard**
   - Go to [railway.app](https://railway.app)
   - Select your project
   - Choose the affected service (api/web)

2. **View Deployment History**
   - Click on the service
   - Navigate to "Deployments" tab
   - View list of recent deployments

3. **Rollback to Previous Version**
   - Click on the last known good deployment
   - Click "Redeploy" button
   - Confirm the rollback action

#### Option 2: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login --token $RAILWAY_TOKEN

# List recent deployments
railway deployment list --service api

# Rollback to specific deployment
railway deployment redeploy <deployment-id>
```

#### Option 3: GitHub Actions Manual Rollback
```bash
# Trigger manual rollback workflow
gh workflow run rollback.yml \
  --field service=api \
  --field deployment_id=<previous-deployment-id>
```

### Emergency Rollback Checklist

When critical issues occur:

1. **⚡ Immediate Actions (0-5 minutes)**
   - [ ] Assess severity of the issue
   - [ ] Check system health dashboards
   - [ ] Determine rollback scope (api/web/both)
   - [ ] Initiate rollback procedure

2. **🔄 Rollback Execution (5-15 minutes)**
   - [ ] Execute rollback using preferred method
   - [ ] Monitor rollback progress
   - [ ] Verify health checks pass
   - [ ] Confirm system stability

3. **✅ Post-Rollback Validation (15-30 minutes)**
   - [ ] Run smoke tests
   - [ ] Check critical user flows
   - [ ] Monitor error rates
   - [ ] Verify database integrity

4. **📋 Communication & Documentation (30+ minutes)**
   - [ ] Notify stakeholders of rollback completion
   - [ ] Document incident timeline
   - [ ] Schedule post-mortem meeting
   - [ ] Plan fix and re-deployment

## 📊 Monitoring & Alerting Setup

### 1. Health Check Monitoring

#### API Health Endpoint
```typescript
// apps/api/src/routes/health.ts
export const healthCheck = async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    database: await checkDatabaseConnection(),
    external_services: await checkExternalServices()
  };

  const isHealthy = healthStatus.database.status === 'connected' &&
                   healthStatus.external_services.supabase === 'connected';

  res.status(isHealthy ? 200 : 503).json(healthStatus);
};
```

#### Web Health Check
```nginx
# apps/web/nginx.conf - Health check endpoint
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

### 2. Application Performance Monitoring

#### Key Performance Indicators (KPIs)
```javascript
// Monitoring metrics to track
const monitoringMetrics = {
  // Response Time Metrics
  'api.response_time.p95': 'Response time 95th percentile',
  'api.response_time.p99': 'Response time 99th percentile',
  'web.page_load_time': 'Frontend page load time',

  // Error Rate Metrics
  'api.error_rate': 'API error rate percentage',
  'api.5xx_errors': 'Server error count',
  'web.js_errors': 'Frontend JavaScript errors',

  // Business Metrics
  'rewards.claims_per_minute': 'Reward claims rate',
  'users.active_sessions': 'Active user sessions',
  'solana.transaction_success_rate': 'Solana transaction success rate',

  // Infrastructure Metrics
  'api.memory_usage': 'API service memory usage',
  'api.cpu_usage': 'API service CPU usage',
  'database.connection_pool': 'Database connection pool status'
};
```

### 3. Real-time Monitoring Dashboard

#### Railway Built-in Monitoring
```bash
# View real-time logs
railway logs --service api --follow

# Monitor resource usage
railway metrics --service api

# Check service status
railway status
```

#### Custom Health Check Script
```bash
#!/bin/bash
# scripts/health-monitor.sh

API_URL="${API_HEALTH_URL:-https://your-api.railway.app}"
WEB_URL="${WEB_HEALTH_URL:-https://your-web.railway.app}"

check_service() {
    local service_name=$1
    local url=$2

    if curl -f -s "$url" > /dev/null; then
        echo "✅ $service_name is healthy"
        return 0
    else
        echo "❌ $service_name is unhealthy"
        return 1
    fi
}

echo "🔍 Running health checks..."
check_service "API" "$API_URL/health"
check_service "Web" "$WEB_URL/health"

if [ $? -eq 0 ]; then
    echo "✅ All services are healthy"
else
    echo "❌ Some services are unhealthy - check logs"
    exit 1
fi
```

### 4. Alerting Configuration

#### GitHub Actions Notifications
```yaml
# .github/workflows/monitoring.yml
name: Production Monitoring

on:
  schedule:
    # Run health checks every 5 minutes
    - cron: '*/5 * * * *'

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check API Health
        run: |
          if ! curl -f "${{ secrets.API_HEALTH_URL }}/health"; then
            echo "🚨 API health check failed!"
            # Send notification (Slack, Discord, etc.)
            exit 1
          fi

      - name: Check Web Health
        run: |
          if ! curl -f "${{ secrets.WEB_HEALTH_URL }}/health"; then
            echo "🚨 Web health check failed!"
            exit 1
          fi
```

#### Webhook Notifications
```javascript
// scripts/notify-webhook.js
const sendAlert = async (message, severity = 'warning') => {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;

  if (!webhookUrl) return;

  const payload = {
    text: `🚨 ${severity.toUpperCase()}: ${message}`,
    timestamp: new Date().toISOString(),
    service: 'reward-system',
    environment: 'production'
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};
```

## 📈 Performance Monitoring

### 1. Response Time Tracking
```typescript
// apps/api/src/middleware/metrics.ts
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const metric = `${req.method}_${req.route?.path}_duration`;

    // Log metric for monitoring system
    console.log(JSON.stringify({
      metric,
      value: duration,
      timestamp: new Date().toISOString(),
      status: res.statusCode
    }));
  });

  next();
};
```

### 2. Error Rate Monitoring
```typescript
// apps/api/src/middleware/error-tracking.ts
export const errorTracker = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with context
  console.error(JSON.stringify({
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    user_agent: req.get('User-Agent')
  }));

  // Send to monitoring system
  if (process.env.NODE_ENV === 'production') {
    // Integration with error tracking service
  }

  next(error);
};
```

## 🎛️ Incident Response Workflow

### Incident Severity Levels

#### Level 1 - Critical (Immediate Response)
- Complete service outage
- Data loss or corruption
- Security breaches
- **Response Time**: < 5 minutes

#### Level 2 - High (Urgent Response)
- Partial service degradation
- Performance issues affecting users
- Failed deployments
- **Response Time**: < 15 minutes

#### Level 3 - Medium (Standard Response)
- Minor bugs not affecting core functionality
- Monitoring alerts
- Documentation issues
- **Response Time**: < 2 hours

### Incident Response Steps

1. **🚨 Detection & Alert**
   ```bash
   # Automated monitoring detects issue
   # Sends alert via configured channels
   # Creates incident tracking ticket
   ```

2. **🔍 Assessment & Triage**
   ```bash
   # Assess impact and severity
   # Determine affected components
   # Assign incident commander
   # Notify stakeholders if needed
   ```

3. **🛠️ Response & Mitigation**
   ```bash
   # Execute appropriate rollback procedure
   # Implement temporary fixes if possible
   # Monitor system recovery
   # Update stakeholders on progress
   ```

4. **✅ Resolution & Verification**
   ```bash
   # Verify system stability
   # Run post-incident tests
   # Update monitoring/alerting
   # Close incident ticket
   ```

5. **📝 Post-Mortem Analysis**
   ```bash
   # Document timeline of events
   # Identify root cause
   # Plan preventive measures
   # Update runbooks and procedures
   ```

## 🔧 Runbook Templates

### Quick Reference Commands
```bash
# Emergency rollback commands
railway deployment list --service api
railway deployment redeploy <deployment-id>

# Check service status
curl -f https://your-api.railway.app/health
railway logs --service api --tail 100

# Monitor performance
railway metrics --service api
railway ps --service web
```

### Escalation Contacts
```yaml
Primary On-call: DevOps Engineer
Secondary: Technical Lead
Emergency: Engineering Manager

Contact Methods:
- Slack: #alerts channel
- Email: alerts@yourcompany.com
- Phone: Emergency contact list
```

## 📊 Success Metrics

### Deployment Success Metrics
- **Deployment Success Rate**: > 95%
- **Mean Time to Recovery (MTTR)**: < 15 minutes
- **Deployment Frequency**: Multiple times per day
- **Change Failure Rate**: < 5%

### Monitoring Effectiveness
- **Alert Accuracy**: > 90% (low false positive rate)
- **Detection Time**: < 2 minutes
- **Response Time**: < 5 minutes for critical issues

## 🎯 Best Practices Summary

### Prevention
- ✅ Comprehensive testing before deployment
- ✅ Gradual rollout strategies
- ✅ Health checks on all services
- ✅ Performance monitoring baselines

### Detection
- ✅ Automated health checks
- ✅ Real-time error monitoring
- ✅ Performance threshold alerts
- ✅ Business metric monitoring

### Response
- ✅ Automated rollback triggers
- ✅ Clear escalation procedures
- ✅ Documented runbooks
- ✅ Post-incident learning

### Recovery
- ✅ Fast rollback capabilities
- ✅ Data integrity validation
- ✅ Service dependency management
- ✅ Communication protocols

---

## 🎉 Implementation Checklist

Your monitoring and rollback system is ready when:

- ✅ Health check endpoints are implemented and tested
- ✅ Automated rollback workflows are configured
- ✅ Monitoring dashboards are set up
- ✅ Alert notifications are working
- ✅ Incident response procedures are documented
- ✅ Team is trained on rollback procedures
- ✅ Post-mortem process is established

**Remember**: The best incident is the one that never happens. Invest in prevention, but be prepared for anything! 🛡️