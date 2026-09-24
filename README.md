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
