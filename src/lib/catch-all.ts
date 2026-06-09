/**
 * Dispatch d'un slug catch-all vers le bon type de page, en reproduisant
 * les patterns d'URL Presta :
 *   - URL finissant par .html            -> PRODUIT  (1 ou 2 segments)
 *   - 1 segment `{id}-{rewrite}`          -> CATÉGORIE
 *   - slug vide                           -> HOME
 *   - tout le reste                       -> 404
 */
export type Dispatch =
  | { type: 'home' }
  | { type: 'product'; id: number }
  | { type: 'category'; id: number }
  | { type: 'notfound' };

export function dispatchSlug(slug: string[]): Dispatch {
  if (slug.length === 0) return { type: 'home' };

  const last = slug[slug.length - 1];

  // PRODUIT : finit par .html
  if (last.endsWith('.html')) {
    const m = last.match(/^(\d+)-/);
    if (!m) return { type: 'notfound' };
    return { type: 'product', id: parseInt(m[1], 10) };
  }

  // CATÉGORIE : 1 seul segment `{id}-{rewrite}` (pas de hiérarchie multi-segments)
  if (slug.length === 1 && /^\d+-/.test(last)) {
    return { type: 'category', id: parseInt(last.split('-')[0], 10) };
  }

  return { type: 'notfound' };
}
