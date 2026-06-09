import { NextRequest, NextResponse } from 'next/server';

/**
 * Locale = path-based.
 *   /en, /en/...  -> EN
 *   tout le reste -> FR (racine, pas de préfixe)
 *
 * On ne fait AUCUNE redirection (les URLs doivent rester strictement
 * identiques à celles de Presta). On propage juste la locale au SSR via
 * le header `x-locale` et on synchronise le cookie `locale` pour le client.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next internals, api, static
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(jpg|jpeg|png|svg|ico|css|js|webp|avif|woff2?|ttf|otf|mp4|mp3|webm|pdf|xml|txt|json)$/i)
  ) {
    return NextResponse.next();
  }

  const locale = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fr';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
