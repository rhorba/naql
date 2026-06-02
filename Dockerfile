# =============================================================================
# Naql — Multi-stage Dockerfile
# =============================================================================

FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY packages/billing/package.json ./packages/billing/
COPY packages/payroll/package.json ./packages/payroll/
COPY packages/ocr/package.json ./packages/ocr/
COPY packages/notifications/package.json ./packages/notifications/
COPY apps/web/package.json ./apps/web/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
COPY tsconfig.json ./

# ---- Web build stage ----
FROM base AS web-builder
RUN pnpm --filter web build

# ---- Web runtime ----
FROM node:20-alpine AS web
RUN npm install -g pnpm@9
WORKDIR /app
COPY --from=web-builder /app/apps/web/.next ./apps/web/.next
COPY --from=web-builder /app/apps/web/public ./apps/web/public
COPY --from=web-builder /app/apps/web/package.json ./apps/web/
COPY --from=web-builder /app/node_modules ./node_modules
COPY --from=web-builder /app/packages ./packages
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/web/node_modules/.bin/next", "start", "apps/web"]

# ---- Worker runtime ----
FROM node:20-alpine AS worker
RUN npm install -g pnpm@9
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps ./apps
COPY --from=base /app/tsconfig.json ./
ENV NODE_ENV=production
CMD ["node", "--import=tsx/esm", "apps/web/src/worker/index.ts"]
