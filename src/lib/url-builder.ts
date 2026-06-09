/**
 * URL builder — reproduit À L'IDENTIQUE les patterns d'URL de PrestaShop
 * pour préserver le SEO existant lors du remplacement du shop Presta.
 *
 * Locale FR = racine (pas de préfixe), locale EN = préfixe `/en`.
 *
 * Patterns reproduits :
 *  Produit       /{cat-rewrite}/{id}-{rewrite}{-manufacturer-slug}.html
 *  Catégorie     /{id}-{rewrite}
 *  Label/Marque  /label/{id}-{rewrite}
 *  CMS           /content/{id}-{rewrite}
 *  Supplier      /supplier/{id}-{rewrite}
 *  Home          /         (FR)   |   /en/   (EN)
 */

export type Locale = 'fr' | 'en';

/**
 * Slugifie un nom de manufacturer comme Presta le fait pour ses link_rewrite.
 * "STUDIO ONE / COXSONE" -> "studio-one-coxsone"
 * "ONLYROOTS"            -> "onlyroots"
 */
export function slugifyManufacturer(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-') // " / " -> "-"
    .replace(/\s+/g, '-') // espaces -> "-"
    .replace(/-+/g, '-') // tirets multiples -> un seul
    .replace(/^-|-$/g, ''); // trim tirets
}

const prefix = (locale: string): string => (locale === 'en' ? '/en' : '');

// ─── Produit ────────────────────────────────────────────────────────────────
export interface ProductUrlInput {
  id: number;
  linkRewrite: string;
  /** link_rewrite de la catégorie par défaut (segment SEO devant l'id produit) */
  categorySlug?: string | null;
  /** nom du manufacturer (suffixe SEO -slug avant .html) */
  manufacturerName?: string | null;
}

export function productUrl(p: ProductUrlInput, locale: string = 'fr'): string {
  const mfg = p.manufacturerName ? `-${slugifyManufacturer(p.manufacturerName)}` : '';
  const cat = p.categorySlug ? `/${p.categorySlug}` : '';
  return `${prefix(locale)}${cat}/${p.id}-${p.linkRewrite}${mfg}.html`;
}

// ─── Catégorie ───────────────────────────────────────────────────────────────
export interface CategoryUrlInput {
  id: number;
  linkRewrite: string;
}

export function categoryUrl(c: CategoryUrlInput, locale: string = 'fr'): string {
  return `${prefix(locale)}/${c.id}-${c.linkRewrite}`;
}

// ─── Manufacturer / Label ────────────────────────────────────────────────────
export interface ManufacturerUrlInput {
  id: number;
  name?: string | null;
  /** link_rewrite Presta si disponible (sinon on slugifie le nom) */
  linkRewrite?: string | null;
}

export function manufacturerUrl(m: ManufacturerUrlInput, locale: string = 'fr'): string {
  const slug = m.linkRewrite || slugifyManufacturer(m.name ?? '');
  return `${prefix(locale)}/label/${m.id}-${slug}`;
}

// ─── CMS ─────────────────────────────────────────────────────────────────────
export interface CmsUrlInput {
  id: number;
  /** link_rewrite de la page CMS */
  slug: string;
}

export function cmsUrl(c: CmsUrlInput, locale: string = 'fr'): string {
  return `${prefix(locale)}/content/${c.id}-${c.slug}`;
}

// ─── Supplier ────────────────────────────────────────────────────────────────
export interface SupplierUrlInput {
  id: number;
  linkRewrite?: string | null;
  name?: string | null;
}

export function supplierUrl(s: SupplierUrlInput, locale: string = 'fr'): string {
  const rw = s.linkRewrite ?? slugifyManufacturer(s.name ?? '');
  return `${prefix(locale)}/supplier/${s.id}-${rw}`;
}

// ─── Home ────────────────────────────────────────────────────────────────────
export function homeUrl(locale: string = 'fr'): string {
  return `${prefix(locale)}/`;
}

/**
 * Helper générique pour les liens utilitaires (panier, connexion, …) :
 * préfixe le path avec `/en` en anglais, racine en français.
 */
export function localeHref(path: string, locale: string = 'fr'): string {
  if (!path || path === '/') return homeUrl(locale);
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${prefix(locale)}${p}`;
}

/**
 * Parse l'id numérique en TÊTE d'un segment "{id}-{rewrite}".
 * (les URLs Presta mettent l'id au début, contrairement à l'ancien schéma)
 */
export function parseIdFromSlug(s: string | undefined | null): number | null {
  if (!s) return null;
  const m = String(s).match(/^(\d+)-/);
  return m ? parseInt(m[1], 10) : null;
}

/** Détecte la locale depuis un pathname (préfixe /en sinon fr). */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fr';
}

/** id_lang Presta depuis la locale (1 = FR, 2 = EN). */
export function idLangFromLocale(locale: string): number {
  return locale === 'en' ? 2 : 1;
}
