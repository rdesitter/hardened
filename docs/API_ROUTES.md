# API Routes

## Vue d'ensemble

Deux couches d'API :
1. **Next.js Route Handlers** (`/api/*`) — exposés publiquement, gèrent auth et proxient vers Hono
2. **Hono API** (`/api/*`) — réseau interne Docker, logique métier

Le navigateur ne communique jamais directement avec Hono.

---

## Next.js Route Handlers (public)

### Auth (géré par Auth.js)

```
GET/POST /api/auth/[...nextauth]
```

Routes Auth.js automatiques : signin, signout, callback, session, etc.
Provider : Email (magic link via Resend).

### Stripe Webhooks

```
POST /api/webhooks/stripe
```

Reçoit les événements Stripe :
- `checkout.session.completed` → met à jour `user.plan = 'pro'` et `stripe_customer_id`
- `customer.subscription.updated` → met à jour le plan si changement
- `customer.subscription.deleted` → met à jour `user.plan = 'free'`
- `invoice.payment_failed` → envoie email d'alerte à l'utilisateur

Vérification de signature Stripe obligatoire.

### Proxy vers Hono

Toutes les routes `/api/scans/*` et `/api/reports/*` sont des proxy vers Hono.
Next.js ajoute un header interne `X-Internal-Token` pour authentifier la communication.
Next.js ajoute aussi les infos user (id, plan) extraites de la session Auth.js.

```
POST /api/scans         → proxy → Hono POST /api/scans
GET  /api/scans/:id     → proxy → Hono GET /api/scans/:id
GET  /api/scans         → proxy → Hono GET /api/scans (liste user)
GET  /api/reports/:token → proxy → Hono GET /api/reports/:token
```

---

## Hono API (interne)

Base URL interne : `http://hono:4000`

### Headers requis

Toutes les routes (sauf `/api/reports/:token`) nécessitent :

```
X-Internal-Token: <secret partagé>
```

Les routes authentifiées nécessitent aussi :

```
X-User-Id: <uuid>
X-User-Plan: <free|pro>
```

Ces headers sont injectés par le proxy Next.js.

---

### POST /api/scans

Crée et lance un nouveau scan.

**Body :**
```json
{
  "url": "https://myapp.com"
}
```

**Logique :**
1. Valide l'URL (format, accessible)
2. Rate limiting : max 5 scans/heure par IP pour les anonymes, 20/heure pour les users authentifiés
3. Crée un enregistrement `scans` en DB (status: "pending")
4. Lance le scan engine en async (sans bloquer la réponse)
5. Retourne immédiatement

**Réponse (201) :**
```json
{
  "id": "uuid-du-scan",
  "status": "pending",
  "url": "https://myapp.com"
}
```

**Erreurs :**
- `400` : URL invalide
- `429` : Rate limit atteint

---

### GET /api/scans/:id

Récupère l'état et les résultats d'un scan.

**Logique :**
- Si `status === "pending"` ou `"running"` : retourne le statut (le front continue de poll)
- Si `status === "completed"` : retourne le résultat
- Si l'utilisateur est `free` : les champs `fix` dans chaque check sont remplacés par `null`
- Si l'utilisateur est `pro` : résultat complet avec fixes

**Réponse (200) — scan en cours :**
```json
{
  "id": "uuid",
  "status": "running",
  "url": "https://myapp.com"
}
```

**Réponse (200) — scan complété :**
```json
{
  "id": "uuid",
  "status": "completed",
  "url": "https://myapp.com",
  "score": 62,
  "results": {
    "checks": [...],
    "summary": {
      "total": 12,
      "passed": 7,
      "failed": 5,
      "critical_failed": 2,
      "warning_failed": 3
    }
  },
  "report_url": "/report/abc123token",
  "created_at": "2025-01-15T14:30:00Z"
}
```

**Erreurs :**
- `404` : Scan non trouvé

---

### GET /api/scans

Liste des scans de l'utilisateur authentifié.

**Query params :**
- `limit` (default: 20, max: 100)
- `offset` (default: 0)

**Réponse (200) :**
```json
{
  "scans": [
    {
      "id": "uuid",
      "url": "https://myapp.com",
      "status": "completed",
      "score": 62,
      "is_monitoring": false,
      "created_at": "2025-01-15T14:30:00Z"
    }
  ],
  "total": 42
}
```

**Requiert :** Utilisateur authentifié.

---

### GET /api/reports/:token

Récupère un rapport public par son token.

**Logique :**
- Lookup par `reports.public_token`
- Retourne le scan associé avec résultats complets
- Les fixes sont **toujours inclus** dans les rapports publics (c'est du contenu partageable, ça sert de vitrine)

**Réponse (200) :**
```json
{
  "url": "https://myapp.com",
  "score": 62,
  "results": {
    "checks": [...],
    "summary": {...}
  },
  "scanned_at": "2025-01-15T14:30:00Z"
}
```

**Erreurs :**
- `404` : Rapport non trouvé

---

## Rate Limiting

Implémenté en mémoire dans Hono (pas de Redis pour le MVP).

| Contexte | Limite |
|----------|--------|
| Scan anonyme | 5 scans / heure / IP |
| Scan user free | 10 scans / heure |
| Scan user pro | 50 scans / heure |

Reset automatique toutes les heures. Simple Map en mémoire avec cleanup périodique.

En cas de dépassement : réponse `429 Too Many Requests` avec header `Retry-After`.

---

## Validation

Toutes les entrées sont validées avec **Zod** :

```typescript
import { z } from 'zod';

const createScanSchema = z.object({
  url: z.string().url().max(2048),
});
```

Zod est partagé entre Hono (validation backend) et potentiellement le front (validation formulaire).