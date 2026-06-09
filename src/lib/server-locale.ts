import { cookies, headers } from 'next/headers';

/**
 * Read locale (server-only) and return id_lang for Presta (1=FR, 2=EN).
 * Priority: x-locale header (set by middleware from URL) > cookie > default
 */
export async function getServerIdLang(): Promise<number> {
  try {
    const h = await headers();
    const headerLocale = h.get('x-locale');
    if (headerLocale === 'en') return 2;
    if (headerLocale === 'fr') return 1;
    const c = await cookies();
    const locale = c.get('locale')?.value;
    return locale === 'en' ? 2 : 1;
  } catch {
    return 1;
  }
}

/** Helper synchronous (when cookie store already resolved) */
export function idLangFromLocale(locale?: string | null): number {
  return locale === 'en' ? 2 : 1;
}
