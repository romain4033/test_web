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
  phoneHref: '+33400000000',
  addressLine1: '12 rue du Stade',
  addressLine2: '69000 Lyon',
} as const;
