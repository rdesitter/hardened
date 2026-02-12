# Hardened

## Vision

Hardened est un outil d'audit de sécurité automatique pour les applications web générées par IA (vibecoding). L'utilisateur entre une URL, le système analyse la sécurité de l'application et produit un rapport avec un score sur 100.

## Problème

Les vibecoders (utilisateurs de Cursor, Bolt, Replit, etc.) déploient des applications rapidement sans maîtriser les bonnes pratiques de sécurité. Leur code généré par IA contient souvent : des headers de sécurité manquants, des configurations CORS trop permissives, des endpoints sensibles exposés, des certificats mal configurés, des cookies sans flags de sécurité.

## Cible

Développeurs indie, vibecoders, makers qui lancent des SaaS, des apps, des side-projects avec du code généré par IA.

## Proposition de valeur

- Scan gratuit complet — pas de floutage, l'utilisateur voit tout
- Score de sécurité sur 100 — gamification, partage social
- Fixes copier-coller pour chaque problème détecté (Pro)
- Monitoring continu hebdomadaire avec alertes (Pro)

## Pricing

| Plan | Prix | Inclus |
|------|------|--------|
| Free | 0$ | Scan complet, score, checks pass/fail, résumé des problèmes |
| Pro | 9$/mois | Fixes détaillés copier-coller, monitoring hebdo automatique, alertes email, historique des scores, rapport avec URL partageable |

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Front | Next.js (App Router) |
| Auth | Auth.js (NextAuth v5) |
| API Backend | Hono (Node.js) |
| Base de données | PostgreSQL + Drizzle ORM |
| Paiement | Stripe (Checkout + Subscriptions) |
| Emails | Resend |
| Déploiement | Docker (3 containers) via Dokploy |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Architecture technique et flux
- [DATA_MODEL.md](./DATA_MODEL.md) — Schéma de base de données
- [API_ROUTES.md](./API_ROUTES.md) — Endpoints API
- [SCAN_ENGINE.md](./SCAN_ENGINE.md) — Détail des checks de sécurité
- [FILE_STRUCTURE.md](./FILE_STRUCTURE.md) — Arborescence du projet
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Configuration Docker et Dokploy
- [PRICING.md](./PRICING.md) — Logique métier du pricing