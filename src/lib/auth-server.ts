// Helpers serveur pour l'auth client (jamais importés côté client).

export const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com';
export const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';
export const PRESTA_BASE = PRESTA_API_URL.replace(/\/api\/?$/, '');

export const AUTH_COOKIE = 'pixfeed_auth';
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export const authCookieOptions = {
  httpOnly: true as const,
  secure: true as const,
  sameSite: 'lax' as const,
  maxAge: AUTH_MAX_AGE,
  path: '/',
};

export function authControllerUrl(controller: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({
    fc: 'module',
    module: 'pixfeed_headless_api',
    controller,
    ws_key: PRESTA_API_KEY,
    ...extra,
  });
  return `${PRESTA_BASE}/index.php?${params.toString()}`;
}

/**
 * POST JSON vers un controller du module (ws_key cote serveur).
 * Renvoie la Response brute (le routeur decide JSON vs binaire/PDF).
 */
export function postController(controller: string, payload: Record<string, unknown>): Promise<Response> {
  // Le module PrestaShop lit les params via Tools::getValue (form-urlencoded),
  // pas le JSON brut. On encode donc le payload en x-www-form-urlencoded.
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null) continue;
    form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  return fetch(authControllerUrl(controller), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    cache: 'no-store',
  });
}

/** Ne renvoie au client que le profil public (jamais le secure_key). */
export function stripUser(d: Record<string, unknown>) {
  return {
    id_customer: parseInt(String(d.id_customer ?? '0'), 10),
    email: String(d.email ?? ''),
    firstname: String(d.firstname ?? ''),
    lastname: String(d.lastname ?? ''),
    newsletter: d.newsletter === true || d.newsletter === 1 || d.newsletter === '1',
    date_add: d.date_add ? String(d.date_add) : undefined,
  };
}
