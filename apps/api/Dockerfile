# Build stage
FROM node:20.19.4-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ gcc libc-dev pkgconfig libusb-dev eudev-dev linux-headers

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
FROM node:20.19.4-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Install production dependencies only
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

RUN npm ci --omit=dev && npm cache clean --force

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

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/server.js"]