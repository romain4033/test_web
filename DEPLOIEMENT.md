# Mise en ligne sur Cloudflare Pages

Durée estimée : 30 à 45 minutes. Aucune ligne de code à modifier, sauf l'identifiant KV (étape 3).

> **Règle d'or : aucun secret dans le dépôt.** Les clés API se saisissent uniquement dans le tableau de bord Cloudflare (chiffrées, jamais affichées ensuite).

---

## 0. Avant de commencer

- [ ] Remplir les champs `[À COMPLÉTER]` dans `src/data/site.ts` (SIRET, capital, directeur de publication…) et les crédits photos dans `src/pages/mentions-legales.astro`.
- [ ] Remplacer les visuels provisoires de `src/assets/photos/` (voir README).
- [ ] Avoir un compte [Cloudflare](https://dash.cloudflare.com/sign-up) et un compte [Brevo](https://www.brevo.com) (offres gratuites suffisantes).
- [ ] Le code est sur GitHub (branche `main`).

## 1. Brevo (envoi des e-mails du formulaire)

1. **Senders, Domains & Dedicated IPs → Domains** : ajouter votre domaine et créer les enregistrements DNS **SPF, DKIM et DMARC** proposés. Ils garantissent que les e-mails du site n'arrivent pas en spam et que personne ne peut usurper votre domaine.
2. **Senders** : créer l'expéditeur, par ex. `site@votre-domaine.fr`.
3. **SMTP & API → API Keys** : générer une clé nommée `site-web-cloudflare`. Copiez-la une seule fois, directement à l'étape 4 (ne l'enregistrez nulle part ailleurs).
   - ⚠ Ne pas activer la restriction par adresse IP : les Functions Cloudflare n'ont pas d'IP fixe.

## 2. Créer le projet Cloudflare Pages

1. **Workers & Pages → Create → Pages → Connect to Git**, choisir le dépôt.
2. Paramètres de build :

   | Réglage | Valeur |
   | --- | --- |
   | Production branch | `main` |
   | Framework preset | Astro |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

3. **Environment variables (build)** : `SITE_URL` = `https://www.votre-domaine.fr` (URL canoniques, Open Graph, sitemap, robots.txt).
4. Si le nom du projet diffère de `elan-sport-events`, reporter le nom choisi dans `name` de `wrangler.toml`.

La version de Node est lue dans `.nvmrc` (22). Le dossier `functions/` est détecté automatiquement.

## 3. Limitation de fréquence (espace KV)

1. **Storage & Databases → KV → Create namespace** : nom `RATE_LIMIT_KV`.
2. Copier son **ID** (ce n'est pas un secret) et le coller dans `wrangler.toml` à la place de `REMPLACER_PAR_L_ID_DU_NAMESPACE_KV`, puis committer.
3. Dans `wrangler.toml`, renseigner `CONTACT_TO_EMAIL` (destinataire des demandes) et `CONTACT_FROM_EMAIL` (expéditeur validé à l'étape 1).

## 4. Secrets

Projet Pages → **Settings → Variables and Secrets → Add** (environnement *Production*, puis refaire pour *Preview* si besoin), type **Secret** :

| Nom | Valeur |
| --- | --- |
| `BREVO_API_KEY` | la clé Brevo de l'étape 1 |
| `RATE_LIMIT_SALT` | une chaîne aléatoire, générée par `openssl rand -hex 32` (ou un gestionnaire de mots de passe, 64 caractères) |

Sans ces secrets, le formulaire **refuse** les envois : c'est voulu (« fail closed »).

Relancer ensuite un déploiement (**Deployments → Retry deployment**) pour qu'ils soient pris en compte.

## 5. Domaine personnalisé et HTTPS

1. Projet Pages → **Custom domains → Set up a custom domain** : `www.votre-domaine.fr` (et le domaine nu `votre-domaine.fr`). Le certificat TLS est émis et renouvelé automatiquement.
2. Rediriger le domaine nu vers `www` : **Rules → Redirect Rules → Create** (modèle *Redirect from root to WWW*), code 301.
3. Dans la zone DNS du domaine, **SSL/TLS** :
   - **Overview** : mode **Full (strict)** ;
   - **Edge Certificates** : **Always Use HTTPS = On** (redirection HTTP → HTTPS), **Minimum TLS Version = 1.2**, **TLS 1.3 = On**, **Automatic HTTPS Rewrites = On**.
   - Ne pas activer le HSTS du tableau de bord : il est déjà envoyé par `public/_headers`.
   - Les adresses `*.pages.dev` sont en HTTPS forcé d'office.

## 6. Options Cloudflare à désactiver (compatibilité avec la CSP stricte)

Ces fonctions injectent du code dans les pages ; la CSP les bloquerait ou elles affaibliraient la protection.

| Réglage | Où | Valeur |
| --- | --- | --- |
| Rocket Loader | Speed → Optimization → Content Optimization | **Off** |
| Web Analytics (injection automatique) | Projet Pages → Metrics | **Désactivé** (sinon, autoriser `static.cloudflareinsights.com` dans la CSP) |
| Email Address Obfuscation | Scrape Shield | **Off** (réécrit les liens `mailto:` et ajoute un script) |
| Zaraz | Zaraz | **Non utilisé** |

## 7. Protection supplémentaire du formulaire (recommandé)

Seconde couche, au niveau du réseau Cloudflare, en plus de la limitation KV :
**Security → WAF → Rate limiting rules → Create rule**
- Si : `URI Path` *equals* `/api/contact` et `Request Method` *equals* `POST`
- Seuil : 5 requêtes par 10 secondes, par IP → action **Block** pendant 10 secondes (valeurs de l'offre gratuite).

Facultatif : **Security → Bots → Bot Fight Mode = On**.

## 8. Vérifications après mise en ligne

- [ ] `http://votre-domaine.fr` redirige vers `https://www.votre-domaine.fr` (301).
- [ ] [securityheaders.com](https://securityheaders.com/?q=https%3A%2F%2Fwww.votre-domaine.fr&followRedirects=on) → note **A+** attendue.
- [ ] [Mozilla HTTP Observatory](https://developer.mozilla.org/fr/observatory) → note **A+** attendue.
- [ ] [SSL Labs](https://www.ssllabs.com/ssltest/) → note **A** ou **A+**.
- [ ] [PageSpeed Insights](https://pagespeed.web.dev/) → 90+ dans les quatre catégories.
- [ ] Envoyer une demande réelle via le formulaire, vérifier la réception et le « Répondre » (doit viser l'adresse du visiteur).
- [ ] Envoyer 4 demandes d'affilée : la 4ᵉ doit être refusée.
- [ ] `https://www.votre-domaine.fr/sitemap-index.xml` et `/robots.txt` affichent le bon domaine ; déclarer le sitemap dans [Google Search Console](https://search.google.com/search-console).
- [ ] Une URL `*.pages.dev` renvoie bien l'en-tête `X-Robots-Tag: noindex`.

## 9. Plus tard (facultatif)

- **HSTS preload** : après quelques semaines sans problème, inscrire le domaine sur [hstspreload.org](https://hstspreload.org). ⚠ Engagement difficile à annuler : tous les sous-domaines devront être en HTTPS.
- **Dependabot** propose chaque semaine des mises à jour de dépendances : les fusionner quand la CI est verte.
- **DNSSEC** : DNS → Settings → Enable DNSSEC.

## Netlify (alternative)

`public/_headers` est compatible tel quel. Il faudrait en revanche porter la fonction `functions/api/contact.ts` au format Netlify Functions et remplacer le stockage KV par Netlify Blobs : la logique de `server/contact.ts` est réutilisable sans modification.
