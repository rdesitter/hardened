# Modèle de données

## Vue d'ensemble

3 tables principales. Le schema est géré par Drizzle ORM et partagé entre Next.js et Hono via un package commun (ou simplement un dossier partagé dans un monorepo).

## Tables

### users

Gérée par Auth.js + champs custom pour Stripe et plan.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  plan          VARCHAR(20) DEFAULT 'free',  -- 'free' | 'pro'
  stripe_customer_id  VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

**Notes :**
- `plan` : détermine les features accessibles. Free = scan + score + checks. Pro = fixes + monitoring + alertes + historique.
- `stripe_customer_id` : créé au premier checkout Stripe.
- `stripe_subscription_id` : pour vérifier le statut de l'abonnement.
- Auth.js créera aussi ses tables (`accounts`, `sessions`, `verification_tokens`). Les laisser gérer par Auth.js, ne pas les modifier.

### scans

Un scan = une exécution du scan engine sur une URL.

```sql
CREATE TABLE scans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable pour scans anonymes
  url           VARCHAR(2048) NOT NULL,
  status        VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'running' | 'completed' | 'failed'
  score         INTEGER,  -- 0-100, null si pas encore complété
  results       JSONB,    -- résultats détaillés de tous les checks
  error         TEXT,     -- message d'erreur si status = 'failed'
  is_monitoring BOOLEAN DEFAULT FALSE,  -- true si lancé par le cron monitoring
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_url ON scans(url);
CREATE INDEX idx_scans_created_at ON scans(created_at);
```

**Notes :**
- `user_id` nullable : les scans gratuits depuis la landing page n'ont pas forcément d'utilisateur associé. Si l'utilisateur se crée un compte ensuite, on peut rattacher les scans via l'URL ou un cookie.
- `results` en JSONB : structure détaillée ci-dessous.
- `is_monitoring` : distingue un scan manuel d'un scan automatique hebdo.

### reports

Un rapport = une vue partageable d'un scan.

```sql
CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id       UUID REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  public_token  VARCHAR(32) UNIQUE NOT NULL,  -- token pour URL publique
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_public_token ON reports(public_token);
```

**Notes :**
- `public_token` : string aléatoire de 32 chars (nanoid). Permet de générer une URL partageable `/report/abc123def456...` sans exposer l'UUID interne.
- Un rapport est créé automatiquement à la fin de chaque scan complété.

## Structure JSONB des résultats de scan

Le champ `scans.results` contient un tableau de check results :

```json
{
  "checks": [
    {
      "id": "https-valid",
      "category": "critical",
      "group": "transport",
      "passed": true,
      "label": "HTTPS Certificate",
      "detail": "Valid certificate, expires in 84 days",
      "fix": null
    },
    {
      "id": "csp-header",
      "category": "critical",
      "group": "headers",
      "passed": false,
      "label": "Content Security Policy",
      "detail": "No CSP header found. Your app is vulnerable to XSS attacks.",
      "fix": "Add this header to your server configuration:\n\nNext.js (next.config.js):\n```js\nconst securityHeaders = [\n  {\n    key: 'Content-Security-Policy',\n    value: \"default-src 'self'; script-src 'self' 'unsafe-inline'\"\n  }\n]\n```\n\nExpress/Hono:\n```js\napp.use((req, res, next) => {\n  res.setHeader('Content-Security-Policy', \"default-src 'self'\");\n  next();\n});\n```"
    }
  ],
  "summary": {
    "total": 12,
    "passed": 7,
    "failed": 5,
    "critical_failed": 2,
    "warning_failed": 3
  },
  "scan_duration_ms": 8432,
  "scanned_at": "2025-01-15T14:30:00Z"
}
```

### Catégories de checks

- `critical` : faille de sécurité exploitable. Poids élevé dans le score.
- `warning` : mauvaise pratique, risque modéré. Poids moyen.
- `info` : recommandation, pas de risque immédiat. Poids faible.

### Groupes de checks

- `transport` : HTTPS, TLS, certificat
- `headers` : Security headers (CSP, HSTS, X-Frame-Options, etc.)
- `cors` : Configuration CORS
- `cookies` : Flags de sécurité des cookies
- `exposure` : Paths sensibles exposés, information leakage
- `dns` : SPF, DMARC

## Calcul du score

```
Score = 100 - (somme des pénalités des checks échoués)

Pénalités :
- critical échoué : -15 points
- warning échoué : -8 points
- info échoué : -3 points

Score minimum : 0
Score maximum : 100
```

Le score est calculé côté Hono après exécution de tous les checks et stocké dans `scans.score`.

## Drizzle Schema (TypeScript)

```typescript
// schema.ts — partagé entre Next.js et Hono

import { pgTable, uuid, varchar, integer, boolean, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  plan: varchar('plan', { length: 20 }).default('free'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const scans = pgTable('scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  url: varchar('url', { length: 2048 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  score: integer('score'),
  results: jsonb('results'),
  error: text('error'),
  isMonitoring: boolean('is_monitoring').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').references(() => scans.id, { onDelete: 'cascade' }).notNull(),
  publicToken: varchar('public_token', { length: 32 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```