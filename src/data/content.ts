// Contenu provisoire du site — à valider / ajuster.
// Pour remplacer une photo : déposer un fichier du même nom dans src/assets/photos/
// (JPG ou PNG haute définition). Astro la convertit automatiquement en WebP compressé.
import type { ImageMetadata } from 'astro';
import coursesTrails from '../assets/photos/courses-trails.jpg';
import tournois from '../assets/photos/tournois-multisports.jpg';
import journees from '../assets/photos/journees-entreprise.jpg';
import teamBuilding from '../assets/photos/team-building.jpg';
import realTrail from '../assets/photos/real-trail-cretes.jpg';
import realUrban from '../assets/photos/real-urban-run.jpg';
import realTournoi from '../assets/photos/real-tournoi-inter-entreprises.jpg';
import realHorizon from '../assets/photos/real-journee-horizon.jpg';
import realRaid from '../assets/photos/real-raid-codir.jpg';
import realOlympiades from '../assets/photos/real-olympiades.jpg';

export interface Service {
  id: string;
  title: string;
  summary: string;
  description: string;
  features: string[];
  audience: string;
  image: ImageMetadata;
  imageAlt: string;
}

export const SERVICES: Service[] = [
  {
    id: 'courses-trails',
    title: 'Courses & trails',
    summary: 'Du 5 km urbain au trail de montagne, nous organisons des courses sûres, bien balisées et mémorables.',
    description:
      'Nous prenons en charge l’ensemble de votre course, de la conception du parcours jusqu’à la remise des prix. Vous vous concentrez sur l’expérience des coureurs, nous gérons la logistique, la sécurité et les démarches administratives.',
    features: [
      'Tracé, repérage et balisage des parcours',
      'Demandes d’autorisation (préfecture, mairies, ONF)',
      'Chronométrage électronique et résultats en direct',
      'Ravitaillements, dispositif de secours et signaleurs',
      'Gestion des inscriptions et des dossards',
    ],
    audience: 'Collectivités, associations, clubs, marques',
    image: coursesTrails,
    imageAlt: 'Traileurs courant sur un sentier de crête au lever du soleil',
  },
  {
    id: 'tournois-multisports',
    title: 'Tournois multisports',
    summary: 'Football, volley, basket, padel… des tournois clés en main, du petit format à plusieurs centaines d’équipes.',
    description:
      'Nous concevons des tournois équilibrés et rythmés, adaptés au niveau des participants. Plannings, arbitrage, installations et animation : tout est pensé pour que chaque équipe joue beaucoup et reparte avec le sourire.',
    features: [
      'Choix des disciplines et des formats de compétition',
      'Location et installation des terrains et du matériel',
      'Arbitres diplômés et table de marque',
      'Plannings et classements en temps réel',
      'Animation micro, sonorisation et cérémonie de clôture',
    ],
    audience: 'Entreprises, comités d’entreprise, écoles, fédérations',
    image: tournois,
    imageAlt: 'Joueurs disputant un match de football à cinq sur un terrain synthétique',
  },
  {
    id: 'journees-entreprise',
    title: 'Journées sportives d’entreprise',
    summary: 'Une journée pour rassembler vos collaborateurs autour du sport, quel que soit leur niveau.',
    description:
      'Challenge inter-services, olympiades, journée santé ou séminaire actif : nous créons un programme inclusif qui mêle ateliers sportifs, défis collectifs et moments de convivialité, en cohérence avec vos objectifs RH et RSE.',
    features: [
      'Programme sur mesure, accessible à tous les niveaux',
      'Recherche du lieu et coordination avec vos équipes',
      'Coachs sportifs diplômés d’État',
      'Restauration, goodies et remise de trophées',
      'Option éco-responsable : matériel réutilisable, circuits courts',
    ],
    audience: 'PME, ETI, grands groupes, collectivités',
    image: journees,
    imageAlt: 'Collaborateurs en tenue de sport se passant le témoin lors d’un relais',
  },
  {
    id: 'team-building',
    title: 'Team building sportif',
    summary: 'Des défis en équipe qui renforcent la cohésion, la communication et l’esprit de collaboration.',
    description:
      'Raid multisport, course d’orientation, défi nautique ou challenge urbain : nos formats sont conçus pour faire coopérer vos équipes dans un cadre stimulant, avec un débriefing qui fait le lien avec votre quotidien professionnel.',
    features: [
      'Formats de 2 heures à 2 jours',
      'Activités outdoor : VTT, kayak, orientation, paddle',
      'Scénarisation et énigmes pour les équipes',
      'Encadrement par des moniteurs qualifiés',
      'Débriefing animé et reportage photo',
    ],
    audience: 'Comités de direction, équipes projet, managers',
    image: teamBuilding,
    imageAlt: 'Une équipe pagayant ensemble dans un kayak sur un lac',
  },
];

export const STATS = [
  { value: '12 ans', label: 'd’expérience' },
  { value: '350+', label: 'événements organisés' },
  { value: '80 000', label: 'participants accueillis' },
  { value: '98 %', label: 'de clients satisfaits' },
];

export interface Realisation {
  title: string;
  category: string;
  date: string;
  location: string;
  description: string;
  image: ImageMetadata;
  imageAlt: string;
}

export const REALISATIONS: Realisation[] = [
  {
    title: 'Trail des Crêtes',
    category: 'Courses & trails',
    date: 'Juin 2025',
    location: 'Monts du Lyonnais',
    description: '850 coureurs sur 3 parcours de 12 à 42 km, chronométrage électronique et 60 bénévoles coordonnés.',
    image: realTrail,
    imageAlt: 'Coureurs en file indienne sur une ligne de crête',
  },
  {
    title: 'Lyon Night Run',
    category: 'Courses & trails',
    date: 'Octobre 2024',
    location: 'Lyon',
    description: '3 000 participants pour une course nocturne de 10 km au cœur de la ville, animations lumineuses et DJ à l’arrivée.',
    image: realUrban,
    imageAlt: 'Coureurs équipés de lampes frontales dans une rue illuminée',
  },
  {
    title: 'Tournoi inter-entreprises',
    category: 'Tournois multisports',
    date: 'Mai 2025',
    location: 'Villeurbanne',
    description: '64 équipes de 20 entreprises réunies autour du football, du volley et du padel sur une journée.',
    image: realTournoi,
    imageAlt: 'Joueurs au filet pendant un match de volley-ball',
  },
  {
    title: 'Journée sportive Groupe Horizon',
    category: 'Journée d’entreprise',
    date: 'Septembre 2024',
    location: 'Annecy',
    description: '400 collaborateurs, 12 ateliers sportifs et une grande finale en relais au bord du lac.',
    image: realHorizon,
    imageAlt: 'Ateliers sportifs installés sur une grande pelouse au bord d’un lac',
  },
  {
    title: 'Raid du comité de direction',
    category: 'Team building',
    date: 'Avril 2025',
    location: 'Vercors',
    description: 'Deux jours de raid VTT, orientation et escalade pour les 18 membres du CODIR d’un groupe industriel.',
    image: realRaid,
    imageAlt: 'Cyclistes en VTT sur un chemin forestier',
  },
  {
    title: 'Olympiades de l’été',
    category: 'Journée d’entreprise',
    date: 'Juillet 2025',
    location: 'Grenoble',
    description: '250 participants répartis en 25 équipes pour une journée de défis sportifs et ludiques.',
    image: realOlympiades,
    imageAlt: 'Relayeurs se passant le témoin sur une piste d’athlétisme',
  },
];

export const VALUES = [
  {
    title: 'Sécurité avant tout',
    text: 'Chaque événement repose sur une analyse des risques, un dispositif de secours adapté et des encadrants qualifiés.',
  },
  {
    title: 'Le sport pour tous',
    text: 'Nous concevons des formats inclusifs, où débutants comme sportifs confirmés trouvent leur place.',
  },
  {
    title: 'L’énergie du collectif',
    text: 'Nos événements sont pensés pour créer du lien, de l’entraide et des souvenirs partagés.',
  },
  {
    title: 'Responsabilité',
    text: 'Matériel réutilisable, prestataires locaux, zéro plastique jetable : nous réduisons l’empreinte de chaque événement.',
  },
];

export const TEAM = [
  { name: 'Camille Martin', role: 'Fondatrice & directrice', bio: 'Ancienne triathlète, 15 ans d’expérience dans l’événementiel sportif.' },
  { name: 'Thomas Bernard', role: 'Responsable production', bio: 'Logistique, sécurité et coordination terrain de tous nos événements.' },
  { name: 'Inès Haddad', role: 'Cheffe de projet entreprises', bio: 'Conçoit les journées sportives et team buildings sur mesure.' },
  { name: 'Lucas Petit', role: 'Coordinateur courses & trails', bio: 'Traileur passionné, spécialiste des tracés et du chronométrage.' },
];

export const HISTORY = [
  { year: '2014', text: 'Création de l’agence à Lyon et organisation de notre première course, le 10 km des Berges.' },
  { year: '2017', text: 'Lancement de l’offre entreprises : premières journées sportives et team buildings.' },
  { year: '2021', text: 'Cap des 200 événements et création du Trail des Crêtes.' },
  { year: '2025', text: 'Une équipe de 8 permanents et plus de 80 000 participants accueillis depuis nos débuts.' },
];

// Liste unique partagée avec la validation serveur.
export { EVENT_TYPES } from '../../server/contact.ts';
