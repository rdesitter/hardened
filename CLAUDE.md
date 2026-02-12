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
- Auth.js v5 (next-auth 5.0.0-beta.30) — authentification magic link
- Resend — envoi d'emails (magic link)
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
│   │   └── src/
│   │       ├── index.ts
│   │       ├── middleware/ (auth.ts, rate-limit.ts)
│   │       ├── routes/ (scans.ts)
│   │       └── engine/
│   │           ├── index.ts (runScan orchestrateur)
│   │           ├── score.ts (calculateScore, calculateSummary)
│   │           ├── utils.ts (safeFetch, safeCheck)
│   │           └── checks/ (https.ts, headers.ts, exposed-paths.ts)
│   └── web/                  # Next.js — port 3000
│       ├── Dockerfile
│       └── src/
│           ├── app/
│           │   ├── layout.tsx, page.tsx (landing)
│           │   ├── scan/[id]/page.tsx (résultat scan avec polling)
│           │   ├── dashboard/page.tsx (protégé, requiert auth)
│           │   ├── auth/signin/page.tsx (formulaire email magic link)
│           │   ├── auth/verify/page.tsx (page "vérifiez votre email")
│           │   ├── api/auth/[...nextauth]/route.ts (Auth.js handlers)
│           │   └── api/scans/ (proxy routes vers Hono)
│           ├── components/ (scan-form.tsx, header.tsx, providers.tsx)
│           └── lib/ (api.ts — proxy vers Hono, auth.ts — config Auth.js)
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
- Le proxy enrichit les headers avec X-User-Id et X-User-Plan quand l'utilisateur est authentifié
- Le scan fonctionne SANS être connecté — l'auth est optionnelle

## État actuel

### Fait
- Monorepo initialisé (npm workspaces, tsconfig, .env)
- packages/db : schema Drizzle (users, scans, reports), types (CheckResult, ScanResult), client, re-export drizzle-orm helpers (eq, desc, etc.)
- apps/api : Hono avec health check, middleware auth interne, middleware rate-limit
- apps/api : routes scans (POST /api/scans, GET /api/scans/:id, GET /api/scans) avec intégration DB
- apps/api : scan engine avec 3 checks implémentés :
  - https.ts — certificat valide, redirect HTTP→HTTPS (suit la chaîne), expiration certificat
  - headers.ts — 6 security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
  - exposed-paths.ts — 5 paths sensibles (.env, .git, /debug, /graphql, security.txt) avec validation du contenu
- apps/web : Next.js App Router, landing page avec formulaire URL, proxy API vers Hono
- apps/web : flow scan complet connecté au backend :
  - Landing page POST /api/scans → redirect vers /scan/[id]
  - Page /scan/[id] poll GET /api/scans/:id toutes les 2s
  - Loader animé pendant pending/running
  - Affichage score + liste checks pass/fail avec badges category
- Docker : docker-compose.yml + Dockerfiles, tout fonctionne avec `docker compose up`
- Schema Drizzle poussé en DB via `drizzle-kit push`
- Auth.js v5 configuré avec :
  - Provider Resend (magic link email)
  - DrizzleAdapter (tables users, accounts, sessions, verificationTokens dans le même Postgres)
  - Session strategy: database
  - Callback session injectant user.id
  - Pages custom: /auth/signin, /auth/verify
- Header avec Sign in / Dashboard / Sign out selon l'état de session (useSession)
- SessionProvider via composant Providers wrappant le layout
- Dashboard /dashboard protégé (redirect vers /auth/signin si non connecté)
- Proxy api.ts enrichi : X-User-Id + X-User-Plan (lookup DB) quand authentifié

### Pas encore fait
- 7 checks restants du scan engine (cors, cookies, info-leakage, dns, tls, mixed-content, open-redirects)
- Stripe (checkout, webhooks, customer portal)
- Page résultat scan : style élaboré, groupement par catégorie, affichage fixes
- Dashboard : afficher la liste des scans de l'utilisateur, résultats, historique
- Pages marketing (pricing, about)
- Rapport public partageable
- Cron monitoring hebdomadaire
- Alertes email via Resend
