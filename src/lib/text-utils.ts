/**
 * Décode les entités HTML présentes dans le texte renvoyé par l'API Presta.
 *
 * PrestaShop renvoie souvent du texte HTML-encodé dans son JSON (ex. `&amp;`,
 * `&#039;`). Comme React échappe déjà à l'affichage (sans
 * dangerouslySetInnerHTML), on voit l'entité brute. On décode donc côté data
 * layer.
 *
 * La fonction est idempotente : `decodeHtmlEntities(decodeHtmlEntities(x))`
 * donne le même résultat que `decodeHtmlEntities(x)` pour du texte simple.
 */
export function decodeHtmlEntities(str: string | null | undefined): string {
  if (!str) return str ?? '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}
