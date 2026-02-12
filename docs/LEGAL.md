# Documentation légale — Hardened

## Contexte juridique

### Qui est le responsable du traitement ?
- Raphael, travailleur autonome au Québec (Canada)
- Pas de société incorporée → les obligations légales s'appliquent à la personne physique
- Opère sous le régime du travailleur autonome québécois

### Quelles lois s'appliquent ?
1. **Loi 25 du Québec** (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels) — plus stricte que la LPRPDE fédérale, s'applique car l'entreprise est au Québec
2. **RGPD** (Règlement Général sur la Protection des Données, UE) — s'applique dès qu'un utilisateur européen utilise le service
3. **LPRPDE** (Loi sur la protection des renseignements personnels et les documents électroniques) — loi fédérale canadienne, complétée par la Loi 25 au Québec
4. **CAN-SPAM / LCAP** (Loi canadienne anti-pourriel) — pour les emails transactionnels et marketing

### Particularité Hardened
Hardened scanne des URLs publiquement accessibles. Il n'accède à aucune donnée personnelle des utilisateurs des applications scannées. Les scans se limitent à :
- Requêtes HTTP publiques (comme le ferait un navigateur)
- Vérification de headers de réponse
- Résolution DNS publique
- Handshake TLS public

C'est important à clarifier dans les CGU et la politique de confidentialité.

---

## Données collectées par Hardened

### Données utilisateur (compte)
| Donnée | Base légale | Finalité | Durée de conservation |
|--------|-------------|----------|----------------------|
| Email | Consentement (inscription) | Authentification, communication | Durée du compte + 30 jours |
| Nom (optionnel) | Consentement | Personnalisation | Durée du compte + 30 jours |
| Stripe Customer ID | Exécution du contrat | Gestion de l'abonnement | Durée du compte + obligations fiscales (6 ans) |

### Données de scan
| Donnée | Base légale | Finalité | Durée de conservation |
|--------|-------------|----------|----------------------|
| URL scannée | Exécution du contrat / intérêt légitime | Fournir le service | Durée du compte ou 90 jours pour scans anonymes |
| Résultats de scan | Exécution du contrat | Fournir le rapport | Durée du compte ou 90 jours pour scans anonymes |
| Adresse IP | Intérêt légitime | Rate limiting, sécurité | 30 jours max |

### Cookies et trackers
| Cookie/Tracker | Type | Finalité | Durée |
|----------------|------|----------|-------|
| Session Auth.js | Strictement nécessaire | Authentification | Session ou 30 jours |
| Stripe | Strictement nécessaire | Paiement sécurisé | Défini par Stripe |
| Analytics (futur) | Non essentiel | Analyse d'usage | À définir — nécessitera consentement |

**Au MVP : aucun cookie non essentiel.** Pas de Google Analytics, pas de tracking tiers. Ça simplifie énormément la conformité. Si tu ajoutes des analytics plus tard, il faudra un bandeau de consentement.

---

## Documents à produire

### 1. Privacy Policy / Politique de confidentialité

Doit couvrir (RGPD + Loi 25) :
- Identité du responsable du traitement
- Données collectées et finalités
- Base légale pour chaque traitement
- Durée de conservation
- Droits des utilisateurs (accès, rectification, suppression, portabilité, opposition)
- Transferts internationaux (les données sont hébergées où ?)
- Sous-traitants (Stripe, Resend, hébergeur VPS)
- Contact du responsable de la protection des renseignements personnels (obligatoire Loi 25)
- Procédure en cas d'incident de confidentialité (obligatoire Loi 25)

### 2. Terms of Service / Conditions Générales d'Utilisation

Doit couvrir :
- Description du service
- Conditions d'accès (âge minimum, inscription)
- Plans et tarification
- Limitations de responsabilité
- Nature des scans (accès public uniquement, pas d'intrusion)
- Usage acceptable (pas de scan offensif, pas de surcharge intentionnelle)
- Propriété intellectuelle
- Résiliation et remboursement
- Loi applicable et juridiction (Québec, Canada)
- Modification des conditions

### 3. Cookie Policy / Politique de cookies

Simplifiée au MVP car uniquement cookies essentiels :
- Liste des cookies utilisés
- Leur finalité
- Pas de bandeau de consentement nécessaire pour les cookies strictement nécessaires (RGPD art. 5.3 directive ePrivacy)

### 4. Mentions légales (Legal Notice)

Obligatoire pour tout site :
- Identité de l'éditeur (nom, statut, localisation)
- Contact
- Hébergeur (nom, localisation)
- Directeur de la publication (toi)

---

## Sous-traitants (Data Processors)

Liste à inclure dans la Privacy Policy :

| Sous-traitant | Finalité | Localisation des données | Garanties |
|---------------|----------|--------------------------|-----------|
| Stripe | Paiement | USA/UE | Certifié SOC 2, BCR, SCCs |
| Resend | Emails transactionnels | USA | DPA disponible |
| Hébergeur VPS (à préciser) | Hébergement | À préciser | À préciser |

**Note RGPD :** Les transferts vers les USA nécessitent des garanties appropriées (Standard Contractual Clauses). Stripe et Resend les fournissent. Pour l'hébergeur, privilégier un hébergeur avec des serveurs au Canada ou en UE si possible.

---

## Droits des utilisateurs

### RGPD (utilisateurs UE)
- Droit d'accès
- Droit de rectification
- Droit à l'effacement ("droit à l'oubli")
- Droit à la portabilité
- Droit d'opposition
- Droit de retirer le consentement
- Droit de déposer une plainte auprès d'une autorité de contrôle

### Loi 25 (utilisateurs Québec/Canada)
- Droit d'accès
- Droit de rectification
- Droit au retrait du consentement
- Droit à la désindexation (déréférencement)
- Droit à la portabilité (en vigueur depuis sept. 2024)
- Obligation de notification en cas d'incident de confidentialité

### Implémentation technique
- Endpoint ou email pour demandes d'accès/suppression
- Suppression d'un compte = suppression de toutes les données associées (scans, rapports, données Stripe via API)
- Délai de réponse : 30 jours (RGPD), 30 jours (Loi 25)

---

## Ce qu'il NE FAUT PAS oublier

1. **Responsable de la protection des renseignements personnels** — Loi 25 exige de désigner une personne responsable. Pour un travailleur autonome, c'est toi. Tu dois publier tes coordonnées.

2. **Évaluation des facteurs relatifs à la vie privée (EFVP)** — Loi 25 l'exige pour tout projet impliquant des renseignements personnels. Pour un MVP simple comme Hardened, une évaluation sommaire suffit (documenter les données collectées, les risques, les mesures de protection). Ce document n'a pas besoin d'être public.

3. **Registre des incidents** — Obligatoire Loi 25. Un simple fichier/document pour consigner tout incident de confidentialité (même s'il n'y en a jamais, le registre doit exister).

4. **Consentement explicite** — Loi 25 et RGPD exigent un consentement clair, pas de cases pré-cochées. La checkbox "J'accepte les CGU et la Politique de confidentialité" à l'inscription doit être décochée par défaut.

5. **Langage clair** — Loi 25 exige que les politiques soient rédigées en termes simples et clairs. Pas de jargon juridique incompréhensible.