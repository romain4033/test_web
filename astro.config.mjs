// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// URL de production (à remplacer par le domaine définitif).
// Utilisée pour les URL canoniques, Open Graph et le sitemap.
const SITE_URL = process.env.SITE_URL ?? 'https://www.exemple-agence.fr';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Sécurité : aucune feuille de style inline → CSP stricte sans 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Aucun asset converti en data: URI (garde la CSP simple : img-src 'self').
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    sitemap({
      // Pages exclues du sitemap (404, démonstration, confirmations du formulaire).
      filter: (page) => !['/404', '/styleguide', '/contact/merci', '/contact/erreur'].some((p) => page.includes(p)),
    }),
  ],
});
