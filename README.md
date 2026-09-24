# Élan Sport Events — site vitrine

Site statique (Astro) pour une agence d’événementiel sportif. Aucun compte, aucun paiement, aucune base de données.

## Prérequis

- Node.js ≥ 22.12 (`.nvmrc`)

## Commandes

| Commande          | Action                                   |
| ----------------- | ---------------------------------------- |
| `npm install`     | Installe les dépendances                 |
| `npm run dev`     | Serveur de développement (localhost:4321) |
| `npm run build`   | Génère le site statique dans `dist/`     |
| `npm run preview` | Prévisualise le build                    |

## Structure

```
src/
  data/site.ts          Configuration centrale (nom, navigation, liens légaux)
  layouts/BaseLayout    Gabarit commun : balises SEO/Open Graph, en-tête, pied de page
  pages/                Une page = une route
    index.astro             /
    services.astro          /services/
    realisations.astro      /realisations/
    a-propos.astro          /a-propos/
    contact.astro           /contact/
    mentions-legales.astro  /mentions-legales/
    confidentialite.astro   /confidentialite/
    404.astro               page d’erreur (noindex)
    robots.txt.ts           robots.txt généré au build
public/                 Fichiers servis tels quels
```

Le domaine de production se règle via la variable d’environnement `SITE_URL` (utilisée pour les URL canoniques, Open Graph, le sitemap et robots.txt).

## Contenu et photos

- Textes : `src/data/content.ts` (services, réalisations, équipe, valeurs, historique) et `src/data/site.ts` (coordonnées, informations légales). Les champs `[À COMPLÉTER]` doivent être renseignés avant la mise en ligne.
- Photos : `src/assets/photos/`. Les visuels actuels sont **provisoires**. Pour les remplacer, déposez une photo haute définition (JPG, ≥ 1600 px de large, ≥ 2400 px pour `hero-accueil.jpg`) sous le **même nom de fichier** : Astro génère automatiquement les versions WebP compressées et responsives au build. Pensez à ajuster le texte alternatif (`imageAlt`) si la photo change de sujet.
- Image de partage (Open Graph) : `public/og-default.jpg` (1200 × 630 px).

## Formulaire de contact

```
functions/api/contact.ts   Fonction Cloudflare Pages (POST /api/contact)
server/contact.ts          Logique : validation, honeypot, limitation de fréquence, envoi Brevo
tests/contact.test.ts      Tests (npm test, runner natif de Node, sans dépendance)
src/components/ContactForm.astro  Formulaire (fonctionne aussi sans JavaScript)
```

Chaîne de traitement d'une requête : origine vérifiée → type `application/x-www-form-urlencoded` uniquement (aucun upload) → corps ≤ 10 Ko → honeypot → configuration présente (sinon refus) → validation serveur → limitation de fréquence (3 envois / 10 min / IP, IP hachée avec un sel secret) → envoi Brevo en texte brut. Rien n'est stocké ni journalisé côté site.

Variables d'environnement (à définir dans Cloudflare Pages → Settings → Variables and Secrets, **jamais dans le code**) :

| Nom | Type | Rôle |
| --- | --- | --- |
| `BREVO_API_KEY` | secret | Clé API Brevo (droit « Transactional emails » uniquement) |
| `RATE_LIMIT_SALT` | secret | Chaîne aléatoire (`openssl rand -hex 32`) pour hacher les IP |
| `CONTACT_TO_EMAIL` | variable (`wrangler.toml`) | Adresse qui reçoit les demandes |
| `CONTACT_FROM_EMAIL` | variable (`wrangler.toml`) | Expéditeur validé dans Brevo |
| `RATE_LIMIT_KV` | binding KV (`wrangler.toml`) | Compteurs de limitation de fréquence |

Test local de bout en bout : copier `.dev.vars.example` en `.dev.vars`, puis `npm run dev:functions` (http://localhost:8788).
