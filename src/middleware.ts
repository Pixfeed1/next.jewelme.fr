import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['fr', 'en'] as const;
const DEFAULT_LOCALE = 'fr';

export function middleware(request: NextRequest) {
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

  // Already prefixed with locale ?
  const localeMatch = LOCALES.find(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (localeMatch) {
    // Propager la locale au SSR via header x-locale (cookie set en parallele pour client-side)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', localeMatch);
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.cookies.set('locale', localeMatch, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // Detect locale (cookie > Accept-Language > default)
  const cookieLocale = request.cookies.get('locale')?.value;
  let locale: string = DEFAULT_LOCALE;
  if (cookieLocale && LOCALES.includes(cookieLocale as any)) {
    locale = cookieLocale;
  } else {
    const accept = request.headers.get('accept-language') || '';
    if (accept.toLowerCase().startsWith('en')) locale = 'en';
  }

  // Redirect : / → /fr, /categorie/X → /fr/categorie/X
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
