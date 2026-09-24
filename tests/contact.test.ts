// Tests du formulaire de contact : `npm test` (runner natif de Node, sans dépendance).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleContact, validateContact, LIMITS, type ContactEnv, type KVLike } from '../server/contact.ts';

const ORIGIN = 'https://www.exemple-agence.fr';

function memoryKV(): KVLike & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    },
  };
}

function makeEnv(overrides: Partial<ContactEnv> = {}): ContactEnv {
  return {
    BREVO_API_KEY: 'test-key',
    CONTACT_TO_EMAIL: 'agence@exemple-agence.fr',
    CONTACT_FROM_EMAIL: 'site@exemple-agence.fr',
    RATE_LIMIT_SALT: 'sel-de-test',
    RATE_LIMIT_KV: memoryKV(),
    ...overrides,
  };
}

const valid = {
  name: 'Jeanne Dupont',
  email: 'jeanne@example.com',
  phone: '06 12 34 56 78',
  eventType: 'Course ou trail',
  message: 'Bonjour, nous souhaitons organiser un trail de 20 km en juin.',
  website: '',
};

function makeRequest(
  fields: Record<string, string> = valid,
  { json = true, origin = ORIGIN, contentType = 'application/x-www-form-urlencoded', ip = '203.0.113.7' } = {},
): Request {
  const headers: Record<string, string> = { 'content-type': contentType, 'cf-connecting-ip': ip };
  if (origin) headers.origin = origin;
  if (json) headers.accept = 'application/json';
  return new Request(`${ORIGIN}/api/contact`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(fields).toString(),
  });
}

function mockFetch(ok = true) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response('{}', { status: ok ? 201 : 400 });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

// --- Validation -------------------------------------------------------------
test('accepte un formulaire valide et normalise les champs', () => {
  const r = validateContact(new URLSearchParams({ ...valid, name: '  Jeanne Dupont  ' }));
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.name, 'Jeanne Dupont');
});

test('le téléphone est facultatif', () => {
  assert.equal(validateContact(new URLSearchParams({ ...valid, phone: '' })).ok, true);
});

test('rejette les champs invalides avec un message par champ', () => {
  const r = validateContact(
    new URLSearchParams({ name: 'J', email: 'pas-un-email', phone: 'abc', eventType: 'Piratage', message: 'court' }),
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'eventType', 'message', 'name', 'phone']);
});

test('bloque l’injection d’en-têtes e-mail (sauts de ligne)', () => {
  const r1 = validateContact(new URLSearchParams({ ...valid, name: 'Jeanne\r\nBcc: victime@example.com' }));
  const r2 = validateContact(new URLSearchParams({ ...valid, email: 'a@b.fr\nBcc: c@d.fr' }));
  assert.equal(r1.ok, false);
  assert.equal(r2.ok, false);
});

test('rejette les caractères de contrôle et les messages trop longs', () => {
  assert.equal(validateContact(new URLSearchParams({ ...valid, message: 'Bonjour\u0000 le monde entier' })).ok, false);
  assert.equal(validateContact(new URLSearchParams({ ...valid, message: 'a'.repeat(LIMITS.message.max + 1) })).ok, false);
});

// --- Gestionnaire HTTP ------------------------------------------------------
test('envoie l’e-mail en texte brut et renvoie un succès', async () => {
  const { fn, calls } = mockFetch();
  const res = await handleContact(makeRequest(), makeEnv(), { fetchImpl: fn });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'success');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/smtp/email');
  const payload = JSON.parse(String(calls[0].init.body));
  assert.equal(payload.htmlContent, undefined);
  assert.match(payload.textContent, /Jeanne Dupont/);
  assert.equal(payload.replyTo.email, 'jeanne@example.com');
});

test('sans JavaScript : redirection 303 vers la page de confirmation ou d’erreur', async () => {
  const ok = await handleContact(makeRequest(valid, { json: false }), makeEnv(), { fetchImpl: mockFetch().fn });
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('location'), '/contact/merci/');
  const ko = await handleContact(makeRequest({ ...valid, email: 'x' }, { json: false }), makeEnv(), {
    fetchImpl: mockFetch().fn,
  });
  assert.equal(ko.headers.get('location'), '/contact/erreur/');
});

test('honeypot rempli : faux succès, aucun e-mail envoyé', async () => {
  const { fn, calls } = mockFetch();
  const res = await handleContact(makeRequest({ ...valid, website: 'http://spam.example' }), makeEnv(), { fetchImpl: fn });
  assert.equal((await res.json()).status, 'success');
  assert.equal(calls.length, 0);
});

test('refuse une origine absente ou étrangère (403)', async () => {
  const env = makeEnv();
  assert.equal((await handleContact(makeRequest(valid, { origin: '' }), env)).status, 403);
  assert.equal((await handleContact(makeRequest(valid, { origin: 'https://evil.example' }), env)).status, 403);
});

test('refuse multipart/form-data (pas d’upload) et JSON (415)', async () => {
  const env = makeEnv();
  assert.equal((await handleContact(makeRequest(valid, { contentType: 'multipart/form-data; boundary=x' }), env)).status, 415);
  assert.equal((await handleContact(makeRequest(valid, { contentType: 'application/json' }), env)).status, 415);
});

test('refuse un corps trop volumineux (413)', async () => {
  const res = await handleContact(makeRequest({ ...valid, message: 'a'.repeat(LIMITS.bodyBytes) }), makeEnv());
  assert.equal(res.status, 413);
});

test('limite la fréquence par IP et ne stocke pas l’IP en clair', async () => {
  const kv = memoryKV();
  const env = makeEnv({ RATE_LIMIT_KV: kv });
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);
  for (let i = 0; i < LIMITS.rateMax; i++) {
    const res = await handleContact(makeRequest(), env, { fetchImpl: mockFetch().fn, now });
    assert.equal(res.status, 200);
  }
  const blocked = await handleContact(makeRequest(), env, { fetchImpl: mockFetch().fn, now });
  assert.equal(blocked.status, 429);
  // Une autre IP n'est pas affectée.
  const other = await handleContact(makeRequest(valid, { ip: '198.51.100.1' }), env, { fetchImpl: mockFetch().fn, now });
  assert.equal(other.status, 200);
  // Fenêtre suivante : de nouveau autorisé.
  const later = await handleContact(makeRequest(), env, {
    fetchImpl: mockFetch().fn,
    now: now + LIMITS.rateWindowSeconds * 1000,
  });
  assert.equal(later.status, 200);
  for (const key of kv.store.keys()) assert.ok(!key.includes('203.0.113.7'));
});

test('configuration manquante : refus (fail closed), aucun envoi', async () => {
  const { fn, calls } = mockFetch();
  const res = await handleContact(makeRequest(), makeEnv({ BREVO_API_KEY: undefined }), { fetchImpl: fn });
  assert.equal(res.status, 500);
  assert.equal(calls.length, 0);
});

test('erreur du prestataire e-mail : message générique (500)', async () => {
  const res = await handleContact(makeRequest(), makeEnv(), { fetchImpl: mockFetch(false).fn });
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.status, 'error');
  assert.equal(body.errors, undefined);
});
