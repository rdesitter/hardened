# Scan Engine

## Vue d'ensemble

Le scan engine est le cœur de Hardened. Il reçoit une URL, exécute une série de checks de sécurité, calcule un score, et retourne un rapport structuré.

Tous les checks sont exécutés en parallèle (Promise.all) pour minimiser le temps total du scan (objectif : < 15 secondes).

## Architecture du scan engine

```typescript
// scan-engine.ts

interface CheckResult {
  id: string;
  category: 'critical' | 'warning' | 'info';
  group: string;
  passed: boolean;
  label: string;
  detail: string;
  fix: string | null;
}

interface ScanResult {
  checks: CheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    critical_failed: number;
    warning_failed: number;
  };
  scan_duration_ms: number;
  scanned_at: string;
}

async function runScan(url: string): Promise<ScanResult> {
  const start = Date.now();

  const checks = await Promise.all([
    checkHttps(url),
    checkSecurityHeaders(url),
    checkCors(url),
    checkCookies(url),
    checkExposedPaths(url),
    checkInformationLeakage(url),
    checkDns(url),
    checkTls(url),
    checkMixedContent(url),
    checkOpenRedirects(url),
  ]);

  const flatChecks = checks.flat(); // certains checks retournent plusieurs résultats

  return {
    checks: flatChecks,
    summary: calculateSummary(flatChecks),
    scan_duration_ms: Date.now() - start,
    scanned_at: new Date().toISOString(),
  };
}
```

---

## Checks détaillés

### 1. HTTPS (groupe: transport)

**Ce qu'on vérifie :**
- Le site est accessible en HTTPS
- Le certificat est valide
- Le certificat n'est pas expiré (+ alerte si < 30 jours)
- Redirect HTTP → HTTPS en place

**Comment :**
- `fetch(url)` en HTTPS, vérifier que ça ne throw pas
- `fetch(http://...)` et vérifier qu'il y a un redirect 301/302 vers HTTPS
- Module Node.js `tls` pour inspecter le certificat (date d'expiration)

**Checks produits :**

| ID | Catégorie | Label |
|----|-----------|-------|
| `https-valid` | critical | HTTPS Certificate Valid |
| `https-redirect` | critical | HTTP to HTTPS Redirect |
| `https-expiry` | warning | Certificate Expiry (si < 30 jours) |

**Fix exemple (https-redirect) :**
```
Your site is accessible via HTTP without redirecting to HTTPS.

Next.js (next.config.js):
  Handled automatically on Vercel. For self-hosted:

Nginx:
  server {
    listen 80;
    return 301 https://$host$request_uri;
  }

Caddy:
  Automatic HTTPS by default.
```

---

### 2. Security Headers (groupe: headers)

**Ce qu'on vérifie :**
Un `fetch` sur l'URL et analyse des headers de réponse.

| ID | Header | Catégorie | Quoi |
|----|--------|-----------|------|
| `hsts` | Strict-Transport-Security | critical | Force HTTPS côté navigateur |
| `csp` | Content-Security-Policy | critical | Prévient XSS |
| `x-frame` | X-Frame-Options | warning | Prévient clickjacking |
| `x-content-type` | X-Content-Type-Options | warning | Prévient MIME sniffing |
| `referrer-policy` | Referrer-Policy | info | Contrôle les infos envoyées au referer |
| `permissions-policy` | Permissions-Policy | info | Restreint les APIs navigateur |

**Comment :**
- `fetch(url)` → `response.headers`
- Pour chaque header : vérifier sa présence et sa valeur

**Fix exemple (csp) :**
```
No Content-Security-Policy header found. Your app is vulnerable to XSS attacks.

Next.js (middleware.ts):
  import { NextResponse } from 'next/server';
  export function middleware(request) {
    const response = NextResponse.next();
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    );
    return response;
  }

Express/Hono:
  Use the 'helmet' package:
  import helmet from 'helmet';
  app.use(helmet());
```

---

### 3. CORS (groupe: cors)

**Ce qu'on vérifie :**
- Header `Access-Control-Allow-Origin`
- Si la valeur est `*` → warning (trop permissif)
- Tester avec une requête OPTIONS preflight

| ID | Catégorie | Label |
|----|-----------|-------|
| `cors-wildcard` | warning | CORS Wildcard Origin |
| `cors-credentials-wildcard` | critical | CORS Credentials with Wildcard |

**Comment :**
- `fetch(url, { method: 'OPTIONS', headers: { 'Origin': 'https://evil.com' } })`
- Analyser les headers `Access-Control-Allow-Origin` et `Access-Control-Allow-Credentials`

**Note :** `cors-credentials-wildcard` est critique car ça permet à n'importe quel site d'envoyer des requêtes authentifiées.

---

### 4. Cookies (groupe: cookies)

**Ce qu'on vérifie :**
Les flags de sécurité sur les cookies retournés.

| ID | Catégorie | Label |
|----|-----------|-------|
| `cookies-secure` | critical | Cookie Secure Flag |
| `cookies-httponly` | critical | Cookie HttpOnly Flag |
| `cookies-samesite` | warning | Cookie SameSite Flag |

**Comment :**
- `fetch(url)` → `response.headers.getSetCookie()`
- Parser chaque cookie et vérifier les flags

**Note :** Si aucun cookie n'est retourné, ces checks sont marqués comme `passed` avec detail "No cookies detected".

---

### 5. Exposed Paths (groupe: exposure)

**Ce qu'on vérifie :**
Tentative d'accès à des paths sensibles qui ne devraient pas être publics.

Paths à tester :
```
/.env
/.git
/.git/config
/api/docs
/graphql
/debug
/phpinfo.php
/server-status
/wp-admin
/wp-login.php
/.well-known/security.txt (celui-ci est POSITIF s'il existe)
/robots.txt (vérifier s'il expose des paths sensibles)
```

| ID | Catégorie | Label |
|----|-----------|-------|
| `exposed-env` | critical | .env File Exposed |
| `exposed-git` | critical | .git Directory Exposed |
| `exposed-debug` | warning | Debug Endpoint Exposed |
| `exposed-graphql` | warning | GraphQL Endpoint Exposed (sans auth) |
| `security-txt` | info | security.txt Present (positif) |

**Comment :**
- `fetch(url + path)` pour chaque path
- Si status 200 → le path est accessible → fail
- Si status 404/403 → ok
- Pour `.env` et `.git`, vérifier aussi le contenu de la réponse (pas juste le status)

**Note :** Exécuter ces requêtes en parallèle avec un timeout court (3 secondes par path).

---

### 6. Information Leakage (groupe: exposure)

**Ce qu'on vérifie :**
Headers de réponse qui exposent des infos sur le serveur.

| ID | Catégorie | Label |
|----|-----------|-------|
| `leak-server` | warning | Server Version Exposed |
| `leak-powered-by` | warning | X-Powered-By Exposed |

**Comment :**
- Vérifier les headers `Server` et `X-Powered-By`
- Si présents avec des infos de version → fail

**Fix exemple (leak-powered-by) :**
```
Your server exposes X-Powered-By: Express. This reveals your tech stack.

Express:
  app.disable('x-powered-by');

Hono:
  Not exposed by default.

Next.js (next.config.js):
  module.exports = {
    poweredByHeader: false,
  };
```

---

### 7. DNS (groupe: dns)

**Ce qu'on vérifie :**
Configuration DNS liée à la sécurité email (anti-spoofing).

| ID | Catégorie | Label |
|----|-----------|-------|
| `dns-spf` | warning | SPF Record |
| `dns-dmarc` | warning | DMARC Record |

**Comment :**
- Module Node.js `dns` (dns.promises)
- `dns.resolveTxt(domain)` → chercher l'enregistrement SPF (`v=spf1...`)
- `dns.resolveTxt('_dmarc.' + domain)` → chercher DMARC

**Note :** Ces checks sont en `warning` et pas `critical` car ils concernent l'email, pas l'app directement. Mais pertinents car beaucoup de SaaS envoient des emails (transactionnels, marketing).

---

### 8. TLS (groupe: transport)

**Ce qu'on vérifie :**
Qualité de la configuration TLS.

| ID | Catégorie | Label |
|----|-----------|-------|
| `tls-version` | critical | TLS Version |
| `tls-cipher` | warning | Cipher Suite Strength |

**Comment :**
- Module Node.js `tls` → `tls.connect()` sur le port 443
- Vérifier `socket.getProtocol()` — TLS 1.2+ requis
- Vérifier `socket.getCipher()` — détecter les cipher suites faibles

---

### 9. Mixed Content (groupe: transport)

**Ce qu'on vérifie :**
Ressources HTTP chargées sur une page HTTPS.

| ID | Catégorie | Label |
|----|-----------|-------|
| `mixed-content` | warning | Mixed Content |

**Comment :**
- `fetch(url)` → récupérer le HTML
- Parser le HTML (regex simple, pas besoin de DOM parser complet)
- Chercher les src/href en `http://` dans les tags `<script>`, `<link>`, `<img>`, `<iframe>`

---

### 10. Open Redirects (groupe: exposure)

**Ce qu'on vérifie :**
Paramètres de redirection exploitables.

| ID | Catégorie | Label |
|----|-----------|-------|
| `open-redirect` | warning | Open Redirect |

**Comment :**
- Tester des URLs comme `url + ?redirect=https://evil.com` et `url + ?next=https://evil.com` et `url + ?url=https://evil.com`
- Si le serveur répond 301/302 vers `evil.com` → fail
- Tester avec `fetch({ redirect: 'manual' })` pour capturer la redirection sans la suivre

**Note :** C'est le check le plus sujet aux faux positifs. Garder en `warning`, pas `critical`.

---

## Calcul du score

```typescript
function calculateScore(checks: CheckResult[]): number {
  const penalties: Record<string, number> = {
    critical: 15,
    warning: 8,
    info: 3,
  };

  const totalPenalty = checks
    .filter(c => !c.passed)
    .reduce((sum, c) => sum + penalties[c.category], 0);

  return Math.max(0, 100 - totalPenalty);
}
```

**Exemples de scores :**
- 0 critical fail, 0 warning fail → 100/100
- 2 critical fail, 1 warning fail → 100 - 30 - 8 = 62/100
- 4 critical fail, 3 warning fail → 100 - 60 - 24 = 16/100

---

## Gestion des erreurs par check

Chaque check est wrappé dans un try/catch. Si un check échoue techniquement (timeout, DNS error, etc.), il ne doit pas faire planter le scan entier.

```typescript
async function safeCheck(fn: () => Promise<CheckResult[]>): Promise<CheckResult[]> {
  try {
    return await fn();
  } catch (error) {
    return [{
      id: 'check-error',
      category: 'info',
      group: 'system',
      passed: true,  // pas de pénalité pour un check qui échoue techniquement
      label: 'Check Error',
      detail: `Could not complete this check: ${error.message}`,
      fix: null,
    }];
  }
}
```

## Timeout global

Le scan entier a un timeout de **30 secondes**. Si tous les checks ne sont pas terminés après 30 secondes, le scan retourne les résultats partiels avec les checks manquants marqués comme "timed out".