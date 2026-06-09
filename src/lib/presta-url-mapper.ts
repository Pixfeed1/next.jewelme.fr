/**
 * Convertit une URL renvoyée par Presta (megamenu, CMS links, etc.)
 * vers la route Next.js équivalente, préfixée avec la locale.
 *
 * Exemples (locale='fr') :
 *  /                            -> /fr
 *  /36-onlyroots-records        -> /fr/categorie/onlyroots-records-36
 *  /vente-en-gros?id=1          -> /fr/page/vente-en-gros
 *  /content/14-faq              -> /fr/page/faq
 *  /nous-contacter              -> /fr/nous-contacter
 *  /connexion                   -> /fr/connexion
 *  https://www.foo.com/...      -> tel quel (externe)
 */
export function mapPrestaUrl(link: string | undefined | null, locale: string = 'fr'): string {
  if (!link) return `/${locale}`;
  const url = String(link).trim();

  // External URLs : leave alone
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }

  // Root → /{locale}
  if (url === '/' || url === '') return `/${locale}`;

  // /content/X-slug → /{locale}/page/slug
  const cms = url.match(/^\/content\/(\d+)-(.+?)(?:\?|$)/);
  if (cms) return `/${locale}/page/${cms[2]}`;

  // /vente-en-gros?id=1 (CMS via friendly slug) → /{locale}/page/vente-en-gros?form=1
  // Le ?id=N pointe vers un formulaire PowerfulForm a afficher dans la page CMS
  const cmsFriendly = url.match(/^\/([a-z0-9\-]+)\?id=(\d+)$/);
  if (cmsFriendly) return `/${locale}/page/${cmsFriendly[1]}?form=${cmsFriendly[2]}`;

  // /N-slug → /{locale}/categorie/slug-N (SEO friendly)
  const cat = url.match(/^\/(\d+)-(.+?)(?:\?|$)/);
  if (cat) return `/${locale}/categorie/${cat[2]}-${cat[1]}`;

  // Fixed aliases EN -> FR (le menu Presta renvoie les link_rewrite EN, on les remappe sur nos routes)
  if (url === '/contact-us' || url.startsWith('/contact-us?') || url.startsWith('/contact-us/')) {
    return `/${locale}/nous-contacter`;
  }
  // Fixed paths recognised
  const known = ['/nous-contacter', '/connexion', '/panier'];
  for (const k of known) {
    if (url === k || url.startsWith(k + '?') || url.startsWith(k + '/')) {
      return `/${locale}${url}`;
    }
  }

  // Default : prefix with locale
  if (url.startsWith('/')) return `/${locale}${url}`;
  return `/${locale}/${url}`;
}
