// Configuration centrale du site (contenu provisoire, à valider).
export const SITE = {
  name: 'Élan Sport Events',
  tagline: 'Agence d’événementiel sportif',
  defaultDescription:
    'Élan Sport Events conçoit et organise vos événements sportifs : courses & trails, tournois multisports, journées sportives d’entreprise et team building.',
  locale: 'fr_FR',
  lang: 'fr',
} as const;

export const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/services/', label: 'Nos services' },
  { href: '/realisations/', label: 'Réalisations' },
  { href: '/a-propos/', label: 'À propos' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const LEGAL_LINKS = [
  { href: '/mentions-legales/', label: 'Mentions légales' },
  { href: '/confidentialite/', label: 'Politique de confidentialité' },
] as const;

// Coordonnées provisoires (à remplacer).
export const CONTACT = {
  email: 'contact@exemple-agence.fr',
  phone: '04 00 00 00 00',
  hours: 'Du lundi au vendredi, 9 h – 18 h',
  phoneHref: '+33400000000',
  addressLine1: '12 rue du Stade',
  addressLine2: '69000 Lyon',
} as const;

// Informations légales provisoires (à compléter avant la mise en ligne).
export const LEGAL = {
  company: 'Élan Sport Events SAS',
  capital: '[À COMPLÉTER] €',
  siret: '[À COMPLÉTER]',
  rcs: 'RCS Lyon [À COMPLÉTER]',
  vat: 'FR [À COMPLÉTER]',
  director: '[Nom du directeur de la publication]',
  host: {
    name: 'Cloudflare, Inc.',
    address: '101 Townsend Street, San Francisco, CA 94107, États-Unis',
    website: 'https://www.cloudflare.com',
  },
} as const;
