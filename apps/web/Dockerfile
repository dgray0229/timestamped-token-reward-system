# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY tsconfig.json ./

# Build shared package
RUN npm run build --workspace=packages/shared

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_SOLANA_NETWORK
ARG VITE_SOLANA_RPC_URL

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOLANA_NETWORK=${VITE_SOLANA_NETWORK}
ENV VITE_SOLANA_RPC_URL=${VITE_SOLANA_RPC_URL}

# Build web application
RUN npm run build --workspace=apps/web

# Production stage
FROM nginx:alpine AS production

# Copy built application to nginx
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nginx /usr/share/nginx/html
RUN chown -R nextjs:nginx /var/cache/nginx
RUN chown -R nextjs:nginx /var/log/nginx
RUN chown -R nextjs:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nextjs:nginx /var/run/nginx.pid

USER nextjs

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost || exit 1

CMD ["nginx", "-g", "daemon off;"]