# CLAUDE.md

## Projet

Hardened — Audit de sécurité automatique pour apps web générées par IA.

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
- Stripe — paiement, abonnements, customer portal
- Resend — envoi d'emails (magic link + alertes monitoring)
- Hono (Node.js) — API backend + scan engine
- PostgreSQL 16 + Drizzle ORM — base de données
- Recharts — graphiques d'historique des scores
- Tailwind CSS v4 + @tailwindcss/typography — styling + prose
- Monorepo avec npm workspaces

## Structure du monorepo

```
hardened/
├── package.json              # workspace root (npm workspaces)
├── tsconfig.json             # TypeScript base config
├── docker-compose.yml        # dev: web + api + postgres
├── .env                      # variables d'environnement (non committé)
├── packages/
│   └── db/                   # @hardened/db — schema Drizzle + types partagés
│       └── src/ (schema.ts, types.ts, client.ts, index.ts)
├── apps/
│   ├── api/                  # Hono — port 4000
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── index.ts
│   │       ├── middleware/ (auth.ts, rate-limit.ts)
│   │       ├── routes/ (scans.ts, reports.ts, account.ts)
│   │       ├── cron/ (monitoring.ts)
│   │       └── engine/
│   │           ├── index.ts (runScan orchestrateur)
│   │           ├── score.ts (calculateScore, calculateSummary)
│   │           ├── utils.ts (safeFetch, safeCheck)
│   │           └── checks/ (https.ts, headers.ts, exposed-paths.ts, cors.ts, cookies.ts, info-leakage.ts, dns.ts, tls.ts, mixed-content.ts, open-redirects.ts)
│   └── web/                  # Next.js — port 3000
│       ├── Dockerfile
│       └── src/
│           ├── app/
│           │   ├── layout.tsx, page.tsx (landing: hero + benefits + sample report + footer)
│           │   ├── scan/[id]/page.tsx (score circle SVG + checks groupés expandables + chart)
│           │   ├── dashboard/ (page.tsx server + dashboard-scans.tsx client cards + sparklines)
│           │   ├── auth/signin/page.tsx (formulaire email magic link + checkbox consentement)
│           │   ├── auth/verify/page.tsx (page "vérifiez votre email")
│           │   ├── privacy/page.tsx (politique de confidentialité SSR + TOC)
│           │   ├── terms/page.tsx (conditions d'utilisation SSR + TOC)
│           │   ├── legal/page.tsx (mentions légales SSR bilingue)
│           │   ├── cookies/page.tsx (politique cookies SSR)
│           │   ├── pricing/page.tsx (page tarifs Free / Pro)
│           │   ├── settings/page.tsx + portal-button.tsx + delete-account.tsx (compte + billing + suppression)
│           │   ├── api/auth/[...nextauth]/route.ts (Auth.js handlers)
│           │   ├── api/checkout/route.ts (crée Stripe Checkout session)
│           │   ├── api/portal/route.ts (crée Stripe Customer Portal session)
│           │   ├── api/webhooks/stripe/route.ts (webhook Stripe signé)
│           │   ├── api/account/route.ts (DELETE suppression compte + annulation Stripe)
│           │   ├── api/scans/ (proxy routes vers Hono)
│           │   ├── api/reports/[token]/route.ts (proxy public vers Hono)
│           │   └── report/[token]/ (page.tsx SSR + report-view.tsx client)
│           ├── components/ (scan-form.tsx, header.tsx, providers.tsx, score-sparkline.tsx, score-history-chart.tsx, deleted-toast.tsx, checkout-success-modal.tsx)
│           └── lib/ (api.ts, auth.ts, stripe.ts)
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
- Le package @hardened/db est partagé entre les deux apps
- Hono n'est pas exposé publiquement — seul Next.js est accessible depuis l'extérieur
- Les appels du front vers Hono passent par des Route Handlers Next.js (proxy avec X-Internal-Token)
- Le proxy enrichit les headers avec X-User-Id et X-User-Plan quand l'utilisateur est authentifié
- Le scan fonctionne SANS être connecté — l'auth est optionnelle
- Les routes /api/reports/* dans Hono sont publiques (pas de X-Internal-Token requis)

## État actuel

### Fait
- Monorepo initialisé (npm workspaces, tsconfig, .env)
- packages/db : schema Drizzle (users, scans, reports), types (CheckResult, ScanResult), client, re-export drizzle-orm helpers (eq, and, desc, inArray, etc.)
- apps/api : Hono avec health check, middleware auth interne, middleware rate-limit
- apps/api : routes scans (POST /api/scans, GET /api/scans/:id, GET /api/scans, GET /api/scans?url={url}&history=true) avec intégration DB
- apps/api : scan engine avec 10 checks implémentés (26 vérifications individuelles) :
  - https.ts — certificat valide, redirect HTTP→HTTPS (suit la chaîne), expiration certificat
  - headers.ts — 6 security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
  - exposed-paths.ts — 5 paths sensibles (.env, .git, /debug, /graphql, security.txt) avec validation du contenu
  - cors.ts — wildcard Origin, credentials avec wildcard
  - cookies.ts — flags Secure, HttpOnly, SameSite sur chaque cookie
  - info-leakage.ts — headers Server et X-Powered-By
  - dns.ts — records SPF et DMARC via dns.resolveTxt()
  - tls.ts — version TLS (1.2+ requis) + force du cipher suite via tls.connect()
  - mixed-content.ts — détection de ressources HTTP sur pages HTTPS (regex src/href/action, filtre w3.org/schema.org)
  - open-redirects.ts — test de 7 paramètres courants (redirect, next, url, return, returnTo, redirect_uri, continue)
- apps/web : Next.js App Router, proxy API vers Hono
- Landing page :
  - Hero : "Is your app hardened?" + sous-titre + pill badge "Free security audit"
  - Formulaire URL centré avec bouton "Scan now" + spinner loading
  - Section 3 bénéfices (Security Score, Detailed Fixes, Weekly Monitoring) avec icônes SVG
  - Section sample report : score circle SVG (62/100) + 8 checks exemple
  - Footer avec liens : Pricing, Privacy, Terms, Legal, Cookies
- Page /scan/[id] :
  - Score dans un cercle SVG coloré (vert ≥70, orange ≥40, rouge <40) avec stroke animé
  - URL + résumé (passed/failed/ms) + bouton Share avec icône
  - Checks groupés par catégorie (Transport, Headers, CORS, Cookies, Exposure, DNS) avec compteur pass/total
  - Chaque check : expandable (chevron), détail, fix en bloc code (Pro) ou CTA upgrade (Free)
  - Poll GET /api/scans/:id toutes les 2s, loader shield animé pendant pending/running
- Docker : docker-compose.yml + Dockerfiles, tout fonctionne avec `docker compose up`
- Schema Drizzle poussé en DB via `drizzle-kit push`
- Auth.js v5 configuré avec :
  - Provider Resend (magic link email)
  - DrizzleAdapter (tables users, accounts, sessions, verificationTokens dans le même Postgres)
  - Session strategy: database
  - Callback session injectant user.id
  - Pages custom: /auth/signin, /auth/verify
- Header avec logo "Hardened" + Pricing / Dashboard / Settings / Sign in / Sign out selon l'état de session
- SessionProvider via composant Providers wrappant le layout
- Dashboard /dashboard protégé (redirect vers /auth/signin si non connecté)
- Proxy api.ts enrichi : X-User-Id + X-User-Plan (lookup DB) quand authentifié
- Stripe intégré :
  - lib/stripe.ts avec init lazy (getStripe()) pour éviter crash au build
  - Page /pricing avec plans Free / Pro ($9/mois)
  - POST /api/checkout → crée Stripe Checkout session (mode subscription)
  - Page /settings avec plan actuel + bouton "Manage billing" → Stripe Customer Portal
  - POST /api/portal → crée Stripe Portal session
  - Webhook /api/webhooks/stripe avec vérification signature :
    - checkout.session.completed → user.plan = 'pro' + sauvegarde stripeCustomerId/subscriptionId
    - customer.subscription.deleted → user.plan = 'free'
    - invoice.payment_failed → log
- Masquage des fixes côté Hono :
  - sanitizeForFreePlan() dans routes/scans.ts
  - GET /api/scans/:id lit X-User-Plan : free → fix remplacé par '__PRO_ONLY__', pro → fix complet
  - POST /api/scans transmet X-User-Id comme userId en DB
- Page scan/[id] : affiche "Upgrade to Pro to see the fix →" (lien /pricing) quand fix === '__PRO_ONLY__', affiche le fix en <pre> quand disponible
- Rapports publics :
  - À la fin d'un scan (status completed), un report est créé automatiquement avec un publicToken (nanoid 32 chars)
  - GET /api/scans/:id retourne report_token dans la réponse
  - GET /api/reports/:token (Hono, public, sans auth) retourne le scan complet AVEC fixes (vitrine)
  - Page /report/[token] : SSR avec generateMetadata() pour les OG tags (titre, description, Twitter card)
  - report-view.tsx : composant client affichant score + checks + fixes complets
  - Bouton "Share report" sur /scan/[id] qui copie l'URL publique dans le presse-papier
- Monitoring automatique Pro :
  - cron/monitoring.ts : job node-cron tous les lundis 6h UTC
  - Récupère le dernier scan de chaque user Pro, relance runScan sur l'URL
  - Compare ancien vs nouveau : détecte les régressions (check passed → failed)
  - Envoie un email d'alerte via Resend en cas de régression (score, liste checks, lien rapport)
  - Scans monitoring stockés en DB avec isMonitoring = true + rapport public auto-créé
  - GET /api/debug/run-monitoring : endpoint temporaire pour déclencher manuellement (à supprimer avant prod)
  - Cron enregistré au démarrage de Hono dans index.ts
- Dashboard /dashboard :
  - Bouton "New scan" en haut à droite
  - Grille de cards (2 colonnes) : mini score circle SVG, URL, badges status/source, date, sparkline
  - Sparkline recharts pour les URLs scannées 2+ fois (Pro uniquement)
  - État vide avec icône shield + "Run your first scan" CTA
- Graphiques d'historique des scores (recharts) :
  - GET /api/scans?url={url}&history=true retourne la timeline des scores par date
  - Proxy Next.js transmet les query params vers Hono
  - score-sparkline.tsx : mini graphique 24x96px dans le dashboard (couleur selon dernier score)
  - score-history-chart.tsx : graphique complet avec axes, tooltip, lignes de référence à 70/40
  - Page /scan/[id] Pro : graphique complet de l'historique sous le score
  - Page /scan/[id] Free : bloc "Upgrade to Pro to track your score over time"
  - Détection du plan côté client via présence de '__PRO_ONLY__' dans les fixes

- Pages légales (prose-lg prose-invert, @tailwindcss/typography) :
  - /privacy : Privacy Policy — SSR, prose-lg, TOC 14 sections avec ancres, tables (legal basis, retention, sub-processors)
  - /terms : Terms of Service — SSR, prose-lg, TOC 14 sections avec ancres
  - /legal : Legal Notice / Mentions légales — bilingue FR/EN
  - /cookies : Cookie Policy — tableau des 5 cookies (Auth.js + Stripe), code inline vert
  - Typographie : h1 text-4xl/5xl, h2 mt-16 + border-b séparateur, h3 mt-10, paragraphes leading-relaxed text-gray-300, strong en blanc
  - TOC : rounded-2xl, leading-8, 2 colonnes, hover vert
  - Tous les placeholders légaux résolus (R&D Solutions Numériques, DigitalOcean, adresse, NEQ)
  - Dates "Last updated: February 12, 2026" dans les pages web, "2025-02-12" dans les docs markdown
  - URL https://hardened.app, domaine hardened.app partout
  - Éditeur : R&D Solutions Numériques, 4388 R. Saint-Denis #200, Montréal, QC H2J 2L1, NEQ 2280685357
  - Hébergeur : DigitalOcean, LLC, 101 Avenue of the Americas, New York, NY 10013
  - Renommage complet ShipSafe → Hardened effectué (code, docs, configs, package-lock.json, header logo)
  - Footer landing page mis à jour avec liens vers les 4 pages légales
  - Checkbox consentement obligatoire sur /auth/signin : "I agree to the Terms of Service and Privacy Policy"
  - Bouton "Send magic link" désactivé (disabled + opacity) tant que checkbox non cochée
  - Liens Terms/Privacy ouvrent dans un nouvel onglet (target="_blank")
- Suppression de compte (RGPD + Loi 25) :
  - Hono DELETE /api/account : transaction supprimant reports → scans → sessions → accounts → user
  - Rate limit intégré : 1 appel/heure/user (store in-memory séparé du rate-limit global)
  - Log [ACCOUNT_DELETED] avec user_id, email, timestamp pour traçabilité
  - Next.js DELETE /api/account : vérifie session, annule abonnement Stripe (immédiat), proxy vers Hono
  - Si annulation Stripe échoue → erreur 502, compte non supprimé (l'utilisateur doit résoudre d'abord)
  - Page /settings : section "Danger Zone" rouge avec bouton "Delete my account"
  - Modale de confirmation : texte d'avertissement, champ saisie "DELETE", bouton désactivé tant que pas tapé
  - Après suppression : signOut() → redirect /?deleted=true
  - Toast sur landing page : "Your account has been deleted" (auto-dismiss 6s, Suspense boundary)
  - Les données de paiement Stripe sont conservées côté Stripe (obligation fiscale 6 ans)
- Resend lazy init dans cron/monitoring.ts (getResend() au lieu de new Resend() au top-level) pour éviter crash si RESEND_API_KEY absente au démarrage
- Modale de confirmation Pro checkout :
  - checkout-success-modal.tsx : détecte ?checkout=success, affiche modale "Welcome to Pro!" avec liste des features débloquées
  - Intégrée dans dashboard/page.tsx avec Suspense (même pattern que DeletedToast)
  - Nettoie l'URL via replaceState après affichage
- Security headers configurés dans next.config.ts :
  - Strict-Transport-Security (HSTS, max-age=2ans, includeSubDomains, preload)
  - Content-Security-Policy (self + Stripe JS/API/frames + unsafe-inline pour styles)
  - X-Frame-Options (SAMEORIGIN)
  - X-Content-Type-Options (nosniff)
  - Referrer-Policy (strict-origin-when-cross-origin)
  - Permissions-Policy (camera, microphone, geolocation désactivés)
  - poweredByHeader: false (déjà en place)
- security.txt : public/.well-known/security.txt (contact, expires, canonical)
- Déploiement Dokploy :
  - DNS configuré chez OVH (hardened.app → VPS)
  - 3 services Docker créés et buildent (web, api, postgres)
  - SSL Let's Encrypt via Traefik (géré par Dokploy)
  - Swap 2GB ajouté sur le VPS (évite OOM pendant build Next.js)
  - Variables d'environnement à configurer dans Dokploy UI pour web et api
  - Migration DB via tunnel SSH (drizzle-kit push depuis local)

### Pas encore fait
- Page about
- Webhook Stripe production (configurer endpoint + STRIPE_WEBHOOK_SECRET dans Dokploy)
