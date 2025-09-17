# Multi-stage build for DermaAssistAI
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init and curl (for HEALTHCHECK)
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force \
  && npm install --no-save drizzle-kit@0.30.4

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/shared ./shared
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.mjs ./drizzle.config.mjs

# Create uploads directory with proper permissions
RUN mkdir -p uploads/images migrations && chown -R nextjs:nodejs uploads migrations

# Ensure production environment
ENV NODE_ENV=production

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run lightweight schema push with npx, then start app
CMD ["sh", "-lc", "./node_modules/.bin/drizzle-kit push && node dist/index.js"]
