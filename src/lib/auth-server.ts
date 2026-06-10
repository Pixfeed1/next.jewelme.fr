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
