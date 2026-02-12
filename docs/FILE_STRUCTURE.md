# Structure du projet

## Organisation

Monorepo avec deux apps (Next.js + Hono) et un package partagé pour le schema DB et les types.

```
shipsafe/
├── docker-compose.yml
├── .env.example
├── package.json                  # workspace root
├── turbo.json                    # turborepo config (optionnel, npm workspaces suffit)
│
├── packages/
│   └── db/                       # Schema Drizzle + types partagés
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts          # export tout
│       │   ├── schema.ts         # tables Drizzle (users, scans, reports)
│       │   ├── types.ts          # types TypeScript partagés (CheckResult, ScanResult, etc.)
│       │   └── client.ts         # connexion Drizzle, export du db client
│       └── drizzle/
│           └── migrations/       # fichiers de migration auto-générés
│
├── apps/
│   ├── web/                      # Next.js (front + auth + stripe)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   ├── Dockerfile
│   │   ├── public/
│   │   │   └── ...
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx                    # Landing page + champ URL scan
│   │       │   ├── globals.css
│   │       │   │
│   │       │   ├── (marketing)/                # Pages marketing SSR
│   │       │   │   ├── pricing/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── about/
│   │       │   │       └── page.tsx
│   │       │   │
│   │       │   ├── (app)/                      # Dashboard (authentifié)
│   │       │   │   ├── layout.tsx              # Layout avec sidebar/nav
│   │       │   │   ├── dashboard/
│   │       │   │   │   └── page.tsx            # Liste des scans
│   │       │   │   ├── scan/
│   │       │   │   │   └── [id]/
│   │       │   │   │       └── page.tsx        # Résultat d'un scan
│   │       │   │   └── settings/
│   │       │   │       └── page.tsx            # Paramètres compte + billing
│   │       │   │
│   │       │   ├── report/
│   │       │   │   └── [token]/
│   │       │   │       └── page.tsx            # Rapport public partageable
│   │       │   │
│   │       │   └── api/
│   │       │       ├── auth/
│   │       │       │   └── [...nextauth]/
│   │       │       │       └── route.ts        # Auth.js handlers
│   │       │       ├── webhooks/
│   │       │       │   └── stripe/
│   │       │       │       └── route.ts        # Stripe webhooks
│   │       │       └── scans/
│   │       │           ├── route.ts            # POST (create) + GET (list) → proxy Hono
│   │       │           └── [id]/
│   │       │               └── route.ts        # GET scan by id → proxy Hono
│   │       │
│   │       ├── components/
│   │       │   ├── ui/                         # Composants UI réutilisables
│   │       │   │   ├── button.tsx
│   │       │   │   ├── card.tsx
│   │       │   │   ├── badge.tsx
│   │       │   │   ├── input.tsx
│   │       │   │   ├── progress.tsx
│   │       │   │   └── ...
│   │       │   ├── scan-form.tsx               # Formulaire URL de scan
│   │       │   ├── scan-loader.tsx             # Loader avec progression simulée
│   │       │   ├── score-display.tsx           # Score en gros avec couleur
│   │       │   ├── check-list.tsx              # Liste des checks pass/fail
│   │       │   ├── check-item.tsx              # Un check individuel avec détail + fix
│   │       │   └── score-history.tsx           # Graphique historique (Pro)
│   │       │
│   │       ├── lib/
│   │       │   ├── auth.ts                     # Config Auth.js
│   │       │   ├── stripe.ts                   # Helpers Stripe (create checkout, portal)
│   │       │   ├── api.ts                      # Client API (fetch wrapper vers /api/*)
│   │       │   └── utils.ts                    # Helpers divers
│   │       │
│   │       └── styles/
│   │           └── globals.css
│   │
│   └── api/                      # Hono (backend API + scan engine)
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       └── src/
│           ├── index.ts                        # Hono app entry point
│           ├── middleware/
│           │   ├── auth.ts                     # Vérification X-Internal-Token + extraction user
│           │   └── rate-limit.ts               # Rate limiting en mémoire
│           │
│           ├── routes/
│           │   ├── scans.ts                    # POST /api/scans, GET /api/scans, GET /api/scans/:id
│           │   └── reports.ts                  # GET /api/reports/:token
│           │
│           ├── engine/
│           │   ├── index.ts                    # runScan() — orchestrateur principal
│           │   ├── score.ts                    # calculateScore()
│           │   ├── checks/
│           │   │   ├── https.ts                # checkHttps()
│           │   │   ├── headers.ts              # checkSecurityHeaders()
│           │   │   ├── cors.ts                 # checkCors()
│           │   │   ├── cookies.ts              # checkCookies()
│           │   │   ├── exposed-paths.ts        # checkExposedPaths()
│           │   │   ├── info-leakage.ts         # checkInformationLeakage()
│           │   │   ├── dns.ts                  # checkDns()
│           │   │   ├── tls.ts                  # checkTls()
│           │   │   ├── mixed-content.ts        # checkMixedContent()
│           │   │   └── open-redirects.ts       # checkOpenRedirects()
│           │   └── utils.ts                    # safeFetch, timeout wrapper, helpers
│           │
│           └── cron/
│               └── monitoring.ts               # Job hebdomadaire pour users Pro
```

## Packages partagés

### packages/db

Ce package contient tout ce qui est lié à la base de données :

- **schema.ts** — Définitions Drizzle des tables (source de vérité unique)
- **types.ts** — Types TypeScript pour les résultats de scan, checks, etc.
- **client.ts** — Initialisation de la connexion Drizzle (lit `DATABASE_URL` depuis env)

Les deux apps (`web` et `api`) importent depuis `@shipsafe/db` :

```typescript
import { users, scans, reports } from '@shipsafe/db';
import { type CheckResult, type ScanResult } from '@shipsafe/db';
import { db } from '@shipsafe/db';
```

## Variables d'environnement

### .env.example

```bash
# Database
DATABASE_URL=postgresql://shipsafe:password@postgres:5432/shipsafe

# Auth.js
AUTH_SECRET=generate-a-secret
AUTH_URL=https://shipsafe.app

# Resend (email)
RESEND_API_KEY=re_xxx

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx

# Internal communication
INTERNAL_API_TOKEN=generate-a-secret
HONO_API_URL=http://hono:4000

# App
NEXT_PUBLIC_APP_URL=https://shipsafe.app
```

## Docker

### docker-compose.yml (développement)

```yaml
services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - postgres
      - api

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "4000:4000"
    env_file: .env
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: shipsafe
      POSTGRES_USER: shipsafe
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

### Notes Docker

- En production sur Dokploy, les 3 services seront des containers séparés dans le même réseau Docker.
- Seul le container `web` (Next.js) est exposé via le reverse proxy de Dokploy.
- `api` (Hono) et `postgres` restent sur le réseau interne.
- Les volumes Postgres doivent être persistants (configuré dans Dokploy).