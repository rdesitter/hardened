# Déploiement

## Infrastructure

Tout tourne sur un VPS unique avec Dokploy.

```
VPS (Dokploy)
├── Reverse proxy (Traefik/Nginx — géré par Dokploy)
│   └── shipsafe.app → container web (port 3000)
│
├── Container: web (Next.js)
│   ├── Port 3000
│   ├── Exposé publiquement via reverse proxy
│   └── Communique avec api via réseau Docker interne
│
├── Container: api (Hono)
│   ├── Port 4000
│   ├── NON exposé publiquement
│   └── Communique avec postgres via réseau Docker interne
│
└── Container: postgres
    ├── Port 5432
    ├── NON exposé publiquement
    └── Volume persistant pour les données
```

## Dockerfiles

### apps/web/Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=apps/web

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

### apps/api/Dockerfile

```dockerfile
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
RUN npm run build --workspace=apps/api

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "dist/index.js"]
```

## Configuration Dokploy

### Étapes de setup

1. **Créer un projet** "ShipSafe" dans Dokploy
2. **Ajouter 3 services :**
   - `web` — type Docker, source GitHub, Dockerfile `apps/web/Dockerfile`
   - `api` — type Docker, source GitHub, Dockerfile `apps/api/Dockerfile`
   - `postgres` — type Database PostgreSQL
3. **Réseau :** les 3 services doivent être dans le même réseau Docker interne Dokploy
4. **Domaine :** configurer `shipsafe.app` (ou domaine choisi) pointant vers le service `web`
5. **SSL :** Let's Encrypt via Dokploy (automatique)
6. **Variables d'environnement :** configurer dans Dokploy pour chaque service

### Variables par service

**web :**
```
DATABASE_URL=postgresql://shipsafe:xxx@postgres:5432/shipsafe
AUTH_SECRET=xxx
AUTH_URL=https://shipsafe.app
RESEND_API_KEY=re_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
INTERNAL_API_TOKEN=xxx
HONO_API_URL=http://api:4000
NEXT_PUBLIC_APP_URL=https://shipsafe.app
```

**api :**
```
DATABASE_URL=postgresql://shipsafe:xxx@postgres:5432/shipsafe
INTERNAL_API_TOKEN=xxx
RESEND_API_KEY=re_xxx
```

**postgres :**
```
POSTGRES_DB=shipsafe
POSTGRES_USER=shipsafe
POSTGRES_PASSWORD=xxx
```

## Migrations DB

Les migrations Drizzle sont exécutées manuellement avant chaque déploiement (ou en script de pre-deploy) :

```bash
# Depuis le package db
npx drizzle-kit push
# ou
npx drizzle-kit migrate
```

En production, lancer via un container éphémère ou un script dans le CI.

## Déploiement continu

Pour le MVP, déploiement manuel via Dokploy (push sur GitHub → rebuild dans Dokploy).

Futur : configurer un webhook GitHub → Dokploy pour auto-deploy sur push sur `main`.

## Backups

PostgreSQL backup à configurer dans Dokploy :
- Snapshot quotidien du volume Postgres
- Ou utiliser `pg_dump` via un cron dans un container sidecar

À mettre en place après le MVP, pas critique pour le lancement.

## Monitoring

Pour le MVP, monitoring basique :
- Dokploy health checks sur les containers
- Logs accessibles via Dokploy UI
- Pas de monitoring externe au lancement (ironie : ShipSafe pourrait se monitorer lui-même plus tard)