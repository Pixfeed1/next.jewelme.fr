/**
 * Normalise une URL renvoyée par Presta (megamenu, liens CMS, etc.) vers la
 * route Next.js équivalente. Comme le front reproduit À L'IDENTIQUE les URLs
 * Presta, la plupart des liens (catégories `/{id}-{rewrite}`, CMS
 * `/content/{id}-{rewrite}`) sont déjà au bon format : on se contente de
 * préfixer la locale (`/en` en anglais, rien en français).
 *
 * Exemples (locale='fr') :
 *  /                            -> /
 *  /36-onlyroots-records        -> /36-onlyroots-records
 *  /content/14-faq              -> /content/14-faq
 *  /contact-us                  -> /nous-contacter
 *  https://www.foo.com/...      -> tel quel (externe)
 */
import { homeUrl } from './url-builder';

export function mapPrestaUrl(link: string | undefined | null, locale: string = 'fr'): string {
  const prefix = locale === 'en' ? '/en' : '';
  if (!link) return homeUrl(locale);
  const url = String(link).trim();

  // URLs externes : on ne touche pas
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }

  // Racine -> home
  if (url === '/' || url === '') return homeUrl(locale);

  // Alias contact (Presta renvoie /contact-us) -> notre route /nous-contacter
  if (url === '/contact-us' || url.startsWith('/contact-us?') || url.startsWith('/contact-us/')) {
    return `${prefix}/nous-contacter`;
  }

  // /content/{id}-{slug}  et  /{id}-{slug} (catégorie) : déjà au format Presta,
  // on préfixe juste la locale.
  if (/^\/content\/\d+-/.test(url) || /^\/\d+-/.test(url)) {
    return `${prefix}${url}`;
  }

  // Routes fonctionnelles connues
  const known = ['/nous-contacter', '/connexion', '/inscription', '/panier', '/checkout'];
  for (const k of known) {
    if (url === k || url.startsWith(k + '?') || url.startsWith(k + '/')) {
      return `${prefix}${url}`;
    }
  }

  // Défaut : préfixe la locale
  if (url.startsWith('/')) return `${prefix}${url}`;
  return `${prefix}/${url}`;
}
