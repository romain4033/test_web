// Logique du formulaire de contact, indépendante de la plateforme (testable avec `node --test`).
// Utilisée par la fonction Cloudflare Pages `functions/api/contact.ts`.
//
// Mesures de sécurité :
//  - POST uniquement, en-tête Origin obligatoire et identique au site (anti-CSRF / anti-abus)
//  - Seul le type application/x-www-form-urlencoded est accepté (aucun upload de fichier possible)
//  - Taille du corps limitée
//  - Validation stricte côté serveur (liste blanche, longueurs, caractères de contrôle, injection d'en-têtes)
//  - Honeypot : un robot qui remplit le champ piège reçoit une fausse réponse de succès
//  - Limitation de fréquence par IP (IP hachée avec un sel secret, jamais stockée en clair, TTL court)
//  - E-mail envoyé en texte brut uniquement (aucun HTML interprété)
//  - Aucune donnée du formulaire n'est stockée ni journalisée côté site

export const EVENT_TYPES = [
  'Course ou trail',
  'Tournoi multisport',
  'Journée sportive d’entreprise',
  'Team building sportif',
  'Autre projet',
] as const;

export const LIMITS = {
  bodyBytes: 10_000,
  name: { min: 2, max: 100 },
  email: { max: 254 },
  phone: { max: 25 },
  message: { min: 10, max: 5000 },
  /** Nombre d'envois autorisés par IP sur la fenêtre. */
  rateMax: 3,
  /** Fenêtre de limitation, en secondes (≥ 60 : minimum imposé par Cloudflare KV). */
  rateWindowSeconds: 600,
} as const;

export const HONEYPOT_FIELD = 'website';

// ---------------------------------------------------------------------------
// Types (sous-ensemble des API Cloudflare, pour éviter une dépendance de typage)
// ---------------------------------------------------------------------------
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface ContactEnv {
  /** Clé API Brevo (secret). */
  BREVO_API_KEY?: string;
  /** Adresse qui reçoit les demandes. */
  CONTACT_TO_EMAIL?: string;
  /** Adresse d'expédition validée dans Brevo. */
  CONTACT_FROM_EMAIL?: string;
  /** Sel secret pour hacher les IP (chaîne aléatoire longue). */
  RATE_LIMIT_SALT?: string;
  /** Espace KV Cloudflare pour la limitation de fréquence. */
  RATE_LIMIT_KV?: KVLike;
}

export type FieldName = 'name' | 'email' | 'phone' | 'eventType' | 'message';

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  eventType: (typeof EVENT_TYPES)[number];
  message: string;
}

export type ValidationResult =
  | { ok: true; data: ContactData }
  | { ok: false; errors: Partial<Record<FieldName, string>> };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
// Caractères de contrôle interdits (on autorise \n et \t uniquement dans le message).
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029]/;
const LINE_BREAKS = /[\r\n]/;
// Volontairement simple et strict : pas d'espace, un @, un domaine avec au moins un point.
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const PHONE_RE = /^\+?[0-9 .()-]{6,25}$/;

function field(form: URLSearchParams, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value.normalize('NFC').trim() : '';
}

export function validateContact(form: URLSearchParams): ValidationResult {
  const errors: Partial<Record<FieldName, string>> = {};

  const name = field(form, 'name');
  const email = field(form, 'email');
  const phone = field(form, 'phone');
  const eventType = field(form, 'eventType');
  // Normalise les fins de ligne du message.
  const message = field(form, 'message').replace(/\r\n?/g, '\n');

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    errors.name = `Indiquez votre nom (${LIMITS.name.min} à ${LIMITS.name.max} caractères).`;
  } else if (CONTROL_CHARS.test(name) || LINE_BREAKS.test(name)) {
    errors.name = 'Le nom contient des caractères non autorisés.';
  }

  if (!email || email.length > LIMITS.email.max || !EMAIL_RE.test(email)) {
    errors.email = 'Indiquez une adresse e-mail valide.';
  }

  if (phone && (phone.length > LIMITS.phone.max || !PHONE_RE.test(phone))) {
    errors.phone = 'Le numéro de téléphone n’est pas valide.';
  }

  if (!(EVENT_TYPES as readonly string[]).includes(eventType)) {
    errors.eventType = 'Choisissez un type d’événement dans la liste.';
  }

  if (message.length < LIMITS.message.min || message.length > LIMITS.message.max) {
    errors.message = `Votre message doit contenir entre ${LIMITS.message.min} et ${LIMITS.message.max} caractères.`;
  } else if (CONTROL_CHARS.test(message.replace(/[\n\t]/g, ''))) {
    errors.message = 'Le message contient des caractères non autorisés.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: { name, email, phone, eventType: eventType as ContactData['eventType'], message },
  };
}

// ---------------------------------------------------------------------------
// Limitation de fréquence
// ---------------------------------------------------------------------------
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compteur par fenêtre fixe. Cloudflare KV est « à cohérence éventuelle » : la limite est
 * approximative, ce qui suffit contre le spam. Pour une protection réseau stricte,
 * une règle de rate limiting WAF Cloudflare vient en complément (voir README).
 */
export async function isRateLimited(kv: KVLike, ip: string, salt: string, now = Date.now()): Promise<boolean> {
  const windowId = Math.floor(now / 1000 / LIMITS.rateWindowSeconds);
  const key = `rl:${await sha256Hex(`${salt}:${ip}`)}:${windowId}`;
  const count = Number.parseInt((await kv.get(key)) ?? '0', 10) || 0;
  if (count >= LIMITS.rateMax) return true;
  await kv.put(key, String(count + 1), { expirationTtl: LIMITS.rateWindowSeconds + 60 });
  return false;
}

// ---------------------------------------------------------------------------
// Envoi de l'e-mail (Brevo, texte brut)
// ---------------------------------------------------------------------------
export async function sendEmail(
  data: ContactData,
  env: Required<Pick<ContactEnv, 'BREVO_API_KEY' | 'CONTACT_TO_EMAIL' | 'CONTACT_FROM_EMAIL'>>,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const text = [
    'Nouvelle demande depuis le formulaire de contact du site.',
    '',
    `Nom : ${data.name}`,
    `E-mail : ${data.email}`,
    `Téléphone : ${data.phone || 'non renseigné'}`,
    `Type d’événement : ${data.eventType}`,
    '',
    'Message :',
    data.message,
  ].join('\n');

  const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Site web', email: env.CONTACT_FROM_EMAIL },
      to: [{ email: env.CONTACT_TO_EMAIL }],
      // Nom et e-mail validés (aucun saut de ligne) : pas d'injection d'en-tête possible.
      replyTo: { email: data.email, name: data.name },
      subject: `[Site] ${data.eventType} — ${data.name}`,
      textContent: text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  return response.ok;
}

// ---------------------------------------------------------------------------
// Gestionnaire HTTP
// ---------------------------------------------------------------------------
type Outcome =
  | { status: 'success' }
  | { status: 'invalid'; errors: Partial<Record<FieldName, string>> }
  | { status: 'rate_limited' }
  | { status: 'forbidden' }
  | { status: 'unsupported' }
  | { status: 'too_large' }
  | { status: 'error' };

const MESSAGES: Record<Outcome['status'], string> = {
  success: 'Merci ! Votre message a bien été envoyé. Nous vous répondons sous 48 h ouvrées.',
  invalid: 'Certains champs sont à corriger.',
  rate_limited: 'Vous avez envoyé plusieurs messages en peu de temps. Merci de réessayer dans quelques minutes.',
  forbidden: 'Requête refusée.',
  unsupported: 'Format de requête non pris en charge.',
  too_large: 'Votre message est trop long.',
  error: 'Une erreur est survenue. Merci de réessayer plus tard ou de nous écrire directement par e-mail.',
};

const HTTP_STATUS: Record<Outcome['status'], number> = {
  success: 200,
  invalid: 422,
  rate_limited: 429,
  forbidden: 403,
  unsupported: 415,
  too_large: 413,
  error: 500,
};

const NO_STORE = { 'cache-control': 'no-store' };

function respond(request: Request, outcome: Outcome): Response {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  if (wantsJson) {
    const body: Record<string, unknown> = { status: outcome.status, message: MESSAGES[outcome.status] };
    if (outcome.status === 'invalid') body.errors = outcome.errors;
    return new Response(JSON.stringify(body), {
      status: HTTP_STATUS[outcome.status],
      headers: { 'content-type': 'application/json; charset=utf-8', ...NO_STORE },
    });
  }
  // Sans JavaScript : redirection vers une page statique de confirmation ou d'erreur.
  const target = outcome.status === 'success' ? '/contact/merci/' : '/contact/erreur/';
  return new Response(null, { status: 303, headers: { location: target, ...NO_STORE } });
}

async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > LIMITS.bodyBytes) return null;
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > LIMITS.bodyBytes) return null;
  return new TextDecoder().decode(buffer);
}

export async function handleContact(
  request: Request,
  env: ContactEnv,
  options: { fetchImpl?: typeof fetch; now?: number } = {},
): Promise<Response> {
  // 1. Origine : la requête doit venir d'une page du site lui-même.
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return respond(request, { status: 'forbidden' });

  // 2. Type de contenu : formulaire classique uniquement (pas de multipart → pas d'upload).
  const contentType = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/x-www-form-urlencoded') return respond(request, { status: 'unsupported' });

  // 3. Taille maximale du corps.
  const raw = await readBody(request);
  if (raw === null) return respond(request, { status: 'too_large' });
  const form = new URLSearchParams(raw);

  // 4. Honeypot : on simule un succès pour ne pas renseigner le robot.
  if (field(form, HONEYPOT_FIELD) !== '') return respond(request, { status: 'success' });

  // 5. Configuration : en l'absence de secrets, on refuse (fail closed).
  const { BREVO_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL, RATE_LIMIT_SALT, RATE_LIMIT_KV } = env;
  if (!BREVO_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL || !RATE_LIMIT_SALT || !RATE_LIMIT_KV) {
    console.error('contact: configuration incomplète (variables d’environnement ou binding KV manquants)');
    return respond(request, { status: 'error' });
  }

  // 6. Validation serveur.
  const result = validateContact(form);
  if (!result.ok) return respond(request, { status: 'invalid', errors: result.errors });

  // 7. Limitation de fréquence (après validation : les erreurs de saisie ne consomment pas le quota).
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  try {
    if (await isRateLimited(RATE_LIMIT_KV, ip, RATE_LIMIT_SALT, options.now)) {
      return respond(request, { status: 'rate_limited' });
    }
  } catch {
    console.error('contact: erreur de limitation de fréquence');
    return respond(request, { status: 'error' });
  }

  // 8. Envoi. Aucune donnée personnelle n'est journalisée.
  try {
    const sent = await sendEmail(result.data, { BREVO_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL }, options.fetchImpl);
    if (!sent) {
      console.error('contact: le prestataire d’e-mail a refusé l’envoi');
      return respond(request, { status: 'error' });
    }
  } catch {
    console.error('contact: échec de l’appel au prestataire d’e-mail');
    return respond(request, { status: 'error' });
  }

  return respond(request, { status: 'success' });
}
