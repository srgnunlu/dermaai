# Multi-stage build for DermaAssistAI (pnpm-based)
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack (bundled with Node 16+; preferred over npm install -g)
RUN corepack enable

# Copy lockfile + manifest first so install layer is cached when source changes
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev) for the build step
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# System deps for healthcheck and signal handling
RUN apk add --no-cache dumb-init curl

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# pnpm via corepack in the runtime image too (needed for drizzle-kit at startup)
RUN corepack enable

# Production install: only prod deps, frozen lockfile
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# Drizzle-kit pinned version for migrations at container start
RUN pnpm add drizzle-kit@0.30.4

# Copy built artifacts from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/shared ./shared
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.mjs ./drizzle.config.mjs

# Ensure uploads + migrations directories exist with correct ownership
RUN mkdir -p uploads/images migrations && chown -R nextjs:nodejs uploads migrations

ENV NODE_ENV=production

USER nextjs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

# Use pnpm exec so drizzle-kit resolves correctly under pnpm's node_modules layout
CMD ["sh", "-lc", "pnpm exec drizzle-kit push --config=drizzle.config.mjs && node dist/index.js"]
