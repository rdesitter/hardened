# Pricing & Logique métier

## Plans

### Free (gratuit)

**Accès :**
- Scan complet d'une URL
- Score sur 100 affiché
- Tous les checks visibles avec statut pass/fail
- Résumé des problèmes détectés (label + detail)
- Rapport avec URL partageable

**Restrictions :**
- Les champs `fix` (corrections copier-coller) sont masqués → affiché comme "Upgrade to Pro to see the fix"
- Pas de monitoring automatique
- Pas d'alertes
- Pas d'historique des scores
- Rate limit : 5 scans/heure (par IP si anonyme, par user si connecté)

**Objectif :** Acquisition. Donner assez de valeur pour que l'utilisateur voit le problème et ait envie de le résoudre. Le score bas + les checks rouges sans fix créent la tension.

### Pro (9$/mois)

**Accès — tout le Free plus :**
- Fixes détaillés copier-coller pour chaque check échoué
- Monitoring hebdomadaire automatique (re-scan tous les lundis)
- Alertes email quand un check passe de pass → fail (régression)
- Historique des scores (graphique d'évolution)
- Rate limit élevé : 50 scans/heure
- Scans illimités (dans la limite du rate limit)

**Objectif :** Rétention. La valeur récurrente vient du monitoring et des alertes. L'utilisateur n'a rien à faire — ShipSafe surveille pour lui et le prévient si quelque chose casse.

## Implémentation Stripe

### Checkout

- Utiliser Stripe Checkout (hosted) pour minimiser le code
- Mode : `subscription`
- Un seul produit avec un seul prix : $9/mois
- Success URL : `/dashboard?checkout=success`
- Cancel URL : `/pricing`

### Customer Portal

- Activer le Stripe Customer Portal pour que les utilisateurs gèrent eux-mêmes :
  - Annulation
  - Changement de méthode de paiement
  - Factures
- Accessible depuis la page `/settings`

### Webhooks à gérer

| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | Créer/mettre à jour user : `plan = 'pro'`, sauvegarder `stripe_customer_id` et `stripe_subscription_id` |
| `customer.subscription.updated` | Mettre à jour le plan si changement de statut |
| `customer.subscription.deleted` | `plan = 'free'`, supprimer `stripe_subscription_id` |
| `invoice.payment_failed` | Envoyer email "problème de paiement" via Resend |

### Vérification du plan

Côté Hono, le plan de l'utilisateur est transmis via le header `X-User-Plan` injecté par le proxy Next.js. Hono fait confiance à ce header car il vient du réseau interne.

```typescript
// Middleware Hono simplifié
const getUserPlan = (c: Context): 'free' | 'pro' => {
  return (c.req.header('X-User-Plan') as 'free' | 'pro') || 'free';
};
```

## Logique de masquage des fixes

Quand Hono retourne un scan pour un utilisateur Free, les fixes sont supprimés :

```typescript
function sanitizeForFreePlan(results: ScanResult): ScanResult {
  return {
    ...results,
    checks: results.checks.map(check => ({
      ...check,
      fix: check.passed ? null : '__PRO_ONLY__',  // signal pour le front
    })),
  };
}
```

Le front détecte `__PRO_ONLY__` et affiche un CTA "Upgrade to Pro" à la place du fix.

**Exception :** Les rapports publics (`/report/:token`) incluent toujours les fixes. C'est volontaire — un rapport partagé sert de vitrine et de preuve de valeur.

## Évolution future du pricing

### Plan Team (futur, pas MVP)

- $29/mois
- Jusqu'à 10 URLs monitorées
- Dashboard multi-projets
- Rapports PDF exportables
- À implémenter quand il y a une demande claire

### One-shot audit (futur, pas MVP)

- $5 par rapport complet (avec fixes)
- Alternative pour ceux qui ne veulent pas d'abonnement
- Stripe Checkout en mode `payment` (pas `subscription`)
- À considérer si le churn free → pro est trop faible

## Métriques à suivre

| Métrique | Comment |
|----------|---------|
| Scans gratuits / jour | Compteur en DB |
| Taux de conversion free → signup | Auth.js events |
| Taux de conversion signup → pro | Stripe events |
| Churn mensuel | Stripe subscription events |
| MRR | Stripe Dashboard |
| Score moyen des scans | Query sur scans.score |
| Checks les plus échoués | Query sur scans.results jsonb |