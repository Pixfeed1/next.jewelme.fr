/**
 * URL helpers : format SEO-friendly /{locale}/categorie/{slug}-{id}
 * Toutes les fonctions prennent la locale en 1er param.
 */

export type Locale = 'fr' | 'en';

export function slugify(s: string): string {
  if (!s) return '';
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function categoryUrl(locale: string, id: number, slug?: string): string {
  const cleanSlug = slug ? slugify(slug) : '';
  if (!cleanSlug) return `/${locale}/categorie/${id}`;
  return `/${locale}/categorie/${cleanSlug}-${id}`;
}

export function productUrl(locale: string, id: number, slug?: string): string {
  const cleanSlug = slug ? slugify(slug) : '';
  if (!cleanSlug) return `/${locale}/produit/${id}`;
  return `/${locale}/produit/${cleanSlug}-${id}`;
}

export function brandUrl(locale: string, id: number, slug?: string): string {
  const cleanSlug = slug ? slugify(slug) : '';
  if (!cleanSlug) return `/${locale}/marque/${id}`;
  return `/${locale}/marque/${cleanSlug}-${id}`;
}

export function cmsPageUrl(locale: string, slug: string): string {
  return `/${locale}/page/${slug}`;
}

export function localeUrl(locale: string, path: string = ''): string {
  if (!path) return `/${locale}`;
  if (path.startsWith('/')) return `/${locale}${path}`;
  return `/${locale}/${path}`;
}

/** Extrait l'ID numérique depuis "slug-N" ou "N". */
export function parseIdFromSlug(param: string | undefined): number {
  if (!param) return 0;
  const match = String(param).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

/** Detect locale from a pathname (first segment if valid, else default). */
export function localeFromPath(pathname: string): Locale {
  const seg = pathname.split('/')[1];
  return (seg === 'en') ? 'en' : 'fr';
}
