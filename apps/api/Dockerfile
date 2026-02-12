FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=packages/db && npm run build --workspace=apps/api

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json

EXPOSE 4000
CMD ["node", "dist/index.js"]
