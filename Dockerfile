# Railway Root Dockerfile - defaults to API service
# This allows Railway to deploy the API from the root directory
# For web service, use apps/web/Dockerfile specifically

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/config ./packages/config
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Build shared package
RUN npm run build --workspace=packages/shared

# Build API
RUN npm run build --workspace=apps/api

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Create logs directory
RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app/logs

USER nextjs

# Railway will inject the PORT variable
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/server.js"]