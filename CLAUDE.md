# CLAUDE.md

## Projet

ShipSafe — Audit de sécurité automatique pour apps web générées par IA.

## Documentation

Toute la documentation technique est dans le dossier `/docs/`. Lis TOUS les fichiers avant de commencer à coder :

- docs/README.md — Vue d'ensemble
- docs/ARCHITECTURE.md — Architecture technique
- docs/DATA_MODEL.md — Schéma de base de données
- docs/API_ROUTES.md — Endpoints API
- docs/SCAN_ENGINE.md — Checks de sécurité
- docs/FILE_STRUCTURE.md — Arborescence du projet
- docs/DEPLOYMENT.md — Docker et déploiement
- docs/PRICING.md — Logique métier

## Stack

- Next.js 15 (App Router) — front + auth + Stripe webhooks
- Hono (Node.js) — API backend + scan engine
- PostgreSQL 16 + Drizzle ORM — base de données
- Tailwind CSS v4 — styling
- Monorepo avec npm workspaces

## Structure du monorepo

```
shipsafe/
├── package.json              # workspace root (npm workspaces)
├── tsconfig.json             # TypeScript base config
├── docker-compose.yml        # dev: web + api + postgres
├── .env                      # variables d'environnement (non committé)
├── packages/
│   └── db/                   # @shipsafe/db — schema Drizzle + types partagés
│       └── src/ (schema.ts, types.ts, client.ts, index.ts)
├── apps/
│   ├── api/                  # Hono — port 4000
│   │   ├── Dockerfile
│   │   └── src/ (index.ts, middleware/auth.ts, middleware/rate-limit.ts)
│   └── web/                  # Next.js — port 3000
│       ├── Dockerfile
│       └── src/
│           ├── app/ (layout.tsx, page.tsx, api/scans/*)
│           ├── components/ (scan-form.tsx)
│           └── lib/ (api.ts — proxy vers Hono)
```

## Commandes

```bash
# Dev local avec Docker
docker compose up -d --build

# Build individuel
npm run build --workspace=packages/db
npm run build --workspace=apps/api
npm run build --workspace=apps/web

# Dev sans Docker (nécessite postgres local)
npm run dev:api   # Hono sur port 4000
npm run dev:web   # Next.js sur port 3000

# Drizzle
npm run db:generate   # générer les migrations
npm run db:push       # appliquer le schema directement
```

## Règles

- Lire la documentation AVANT de coder
- Suivre la structure de fichiers définie dans FILE_STRUCTURE.md
- TypeScript strict partout
- Pas de Supabase
- Pas de Redis pour le MVP
- Le package @shipsafe/db est partagé entre les deux apps
- Hono n'est pas exposé publiquement — seul Next.js est accessible depuis l'extérieur
- Les appels du front vers Hono passent par des Route Handlers Next.js (proxy avec X-Internal-Token)

## État actuel

### Fait
- Monorepo initialisé (npm workspaces, tsconfig, .env)
- packages/db : schema Drizzle (users, scans, reports), types (CheckResult, ScanResult), client
- apps/api : Hono avec health check, middleware auth interne, middleware rate-limit, routes placeholder (POST/GET /api/scans)
- apps/web : Next.js App Router, landing page avec formulaire URL, proxy API vers Hono
- Docker : docker-compose.yml + Dockerfiles pour web et api, tout fonctionne avec `docker compose up`

### Pas encore fait
- Scan engine (checks de sécurité)
- Auth.js (magic link)
- Stripe (checkout, webhooks, customer portal)
- Dashboard (liste des scans, résultats, historique)
- Pages marketing (pricing, about)
- Rapport public partageable
- Cron monitoring hebdomadaire
- Alertes email via Resend
- Migrations Drizzle (schema pas encore poussé en DB)
