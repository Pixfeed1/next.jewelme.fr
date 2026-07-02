/**
 * Dispatch d'un slug catch-all vers le bon type de page (patterns Presta).
 * Retire d'abord le prefixe de langue (fr/en) en tete, puis route :
 *   - *.html                     -> PRODUIT
 *   - content/{id}-{rewrite}     -> CMS
 *   - label/{id}-{rewrite}       -> MANUFACTURER (label)
 *   - supplier/{id}-{rewrite}    -> SUPPLIER
 *   - {id}-{rewrite}             -> CATEGORIE
 *   - vide                       -> HOME
 *   - reste                      -> 404
 */
export type Dispatch =
  | { type: 'home' }
  | { type: 'product'; id: number }
  | { type: 'category'; id: number }
  | { type: 'cms'; id: number }
  | { type: 'manufacturer'; id: number }
  | { type: 'supplier'; id: number }
  | { type: 'notfound' };

export function dispatchSlug(slug: string[]): Dispatch {
  let seg = slug.slice();
  if (seg.length > 0 && (seg[0] === 'fr' || seg[0] === 'en')) {
    seg = seg.slice(1);
  }

  if (seg.length === 0) return { type: 'home' };
  const last = seg[seg.length - 1];

  if (last.endsWith('.html')) {
    const m = last.match(/^(\d+)-/);
    if (!m) return { type: 'notfound' };
    return { type: 'product', id: parseInt(m[1], 10) };
  }

  if (seg.length === 2 && seg[0] === 'content' && /^\d+-/.test(seg[1])) {
    return { type: 'cms', id: parseInt(seg[1].split('-')[0], 10) };
  }

  if (seg.length === 2 && seg[0] === 'label' && /^\d+-/.test(seg[1])) {
    return { type: 'manufacturer', id: parseInt(seg[1].split('-')[0], 10) };
  }

  if (seg.length === 2 && seg[0] === 'supplier' && /^\d+-/.test(seg[1])) {
    return { type: 'supplier', id: parseInt(seg[1].split('-')[0], 10) };
  }

  if (seg.length === 1 && /^\d+-/.test(last)) {
    return { type: 'category', id: parseInt(last.split('-')[0], 10) };
  }

  return { type: 'notfound' };
}
