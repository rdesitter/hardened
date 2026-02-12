# Architecture technique

## Vue d'ensemble

ShipSafe est composé de 3 services déployés en containers Docker :

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌────────────┐
│   Next.js (Front)       │────▶│   Hono (API Backend)    │────▶│  Postgres  │
│   Port 3000             │     │   Port 4000             │     │  Port 5432 │
│                         │     │                         │     │            │
│ • Landing page (SSR)    │     │ • POST /api/scans       │     │ • users    │
│ • Dashboard (client)    │     │ • GET /api/scans/:id    │     │ • scans    │
│ • Auth (Auth.js)        │     │ • GET /api/reports/:token│    │ • reports  │
│ • Stripe webhooks       │     │ • Scan engine           │     │            │
│ • Pages marketing (SSR) │     │ • Cron monitoring       │     │            │
└─────────────────────────┘     └─────────────────────────┘     └────────────┘
         │                               │
    ┌────┴─────┐                  ┌──────┴──────┐
    │  Stripe  │                  │   Resend    │
    └──────────┘                  └─────────────┘
```

## Responsabilités par service

### Next.js (Front + Auth + Webhooks)

Responsable de tout ce qui est côté utilisateur :

- **Landing page** — SSR pour le SEO. Champ URL pour lancer un scan gratuit.
- **Dashboard** — Client-side. Liste des scans, rapports, historique des scores.
- **Auth** — Auth.js avec provider email (magic link via Resend). Pas de mot de passe.
- **Stripe webhooks** — Route API Next.js `/api/webhooks/stripe` pour gérer les événements de paiement.
- **Proxy API** — Les appels du front vers le backend Hono passent par des Route Handlers Next.js qui proxient vers Hono en interne (réseau Docker). Le front ne parle jamais directement à Hono.

### Hono (API Backend + Scan Engine)

Responsable de toute la logique métier :

- **API REST** — Endpoints pour créer/lire les scans et rapports.
- **Scan engine** — Module qui exécute les checks de sécurité sur une URL donnée.
- **Cron monitoring** — Job planifié (node-cron) qui re-scanne les URLs des utilisateurs Pro chaque semaine.
- **Alertes** — Détecte les régressions de score et envoie des emails via Resend.

### PostgreSQL

Base de données unique partagée entre Next.js (auth, users) et Hono (scans, rapports). Drizzle ORM utilisé des deux côtés avec le même schema partagé.

## Communication entre services

```
Navigateur → Next.js (port 3000)
                │
                ├── Pages SSR (landing, marketing)
                ├── Pages client (dashboard)
                ├── Auth (Auth.js sessions)
                │
                └── Route Handlers /api/*
                        │
                        ▼
                    Hono (port 4000) ← réseau Docker interne
                        │
                        ▼
                    PostgreSQL (port 5432) ← réseau Docker interne
```

Le frontend Next.js communique avec Hono via le réseau Docker interne (`http://hono:4000`). Hono n'est **pas** exposé publiquement — seul Next.js est accessible depuis l'extérieur.

## Flux principal : Scan

```
1. Utilisateur entre URL sur la landing page
2. Front POST → Next.js /api/scans → proxy → Hono POST /api/scans
3. Hono crée un enregistrement scan (status: "pending") en DB
4. Hono retourne { scanId, status: "pending" }
5. Front affiche un loader avec progression simulée
6. Hono exécute le scan engine en async (5-15 secondes)
7. Hono met à jour le scan en DB (status: "completed", score, results)
8. Front poll GET /api/scans/:id toutes les 2 secondes
9. Quand status === "completed", front affiche le résultat
```

### Pourquoi du polling et pas du WebSocket ?

- Plus simple à implémenter et debugger
- Pas de state de connexion à gérer
- Un scan dure 5-15 secondes, 3-7 polls max
- WebSocket serait de l'over-engineering pour ce use case

## Flux monitoring (Pro)

```
1. Cron job (tous les lundis 6h UTC)
2. Récupère tous les scans des users Pro
3. Re-lance le scan engine sur chaque URL
4. Compare le nouveau score avec le dernier
5. Si régression (check passe de pass → fail) :
   └── Envoie email d'alerte via Resend
6. Stocke le nouveau scan en DB (historique)
```

## Sécurité de l'architecture

- Hono et Postgres ne sont **pas** exposés publiquement
- Seul Next.js est derrière le reverse proxy Dokploy
- Auth.js gère les sessions (JWT ou database sessions)
- Les routes API Hono vérifient un token interne pour les appels depuis Next.js
- Les routes publiques (scan gratuit) ont un rate limiting basique (IP-based, en mémoire)

## Décisions techniques et trade-offs

| Décision | Raison | Trade-off accepté |
|----------|--------|-------------------|
| Polling au lieu de WebSocket | Simplicité, scan court | Quelques requêtes inutiles |
| jsonb pour les résultats | Flexibilité schema | Pas de contraintes DB sur les résultats |
| node-cron au lieu de BullMQ | Pas de Redis nécessaire | Pas de retry automatique, pas de queue |
| Auth magic link | Pas de mot de passe à gérer | Dépendance email deliverability |
| Proxy via Next.js | Hono non exposé | Légère latence ajoutée |
| Un seul Postgres partagé | Simplicité | Schema partagé entre 2 apps |