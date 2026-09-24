// Fonction Cloudflare Pages : POST /api/contact
// Toute la logique (validation, anti-spam, envoi) est dans server/contact.ts.
import { handleContact, type ContactEnv } from '../../server/contact.ts';
import { withSecurityHeaders } from '../../server/security-headers.ts';

interface Context {
  request: Request;
  env: ContactEnv;
}

export const onRequestPost = async ({ request, env }: Context): Promise<Response> =>
  withSecurityHeaders(await handleContact(request, env));

// Toute autre méthode HTTP est refusée.
export const onRequest = (): Response =>
  withSecurityHeaders(
    new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST', 'cache-control': 'no-store' } }),
  );
