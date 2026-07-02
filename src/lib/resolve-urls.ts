/**
 * Resolution d'URLs canoniques PrestaShop via le controleur resolve_urls
 * du module headless. Fichier isole (pas d'import next/headers).
 * @author PixFeed - Marc Gueffie
 */
const PRESTA_BASE = (process.env.PRESTA_API_URL || 'https://test4.jewelme.fr/api').replace(/\/api\/?$/, '');

export interface UrlItem { type: string; id: number; }

export async function resolveUrls(items: UrlItem[], idLang: number): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const clean = items.filter((it) => it && it.id > 0 && it.type);
  if (clean.length === 0) return out;
  const itemsParam = clean.map((it) => `${it.type}:${it.id}`).join(',');
  const url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=resolve_urls&items=${encodeURIComponent(itemsParam)}&id_lang=${idLang}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return out;
    const data = await res.json();
    if (!data || !Array.isArray(data.urls)) return out;
    for (const entry of data.urls) {
      if (entry && entry.url && entry.type && entry.id) {
        out.set(`${entry.type}:${entry.id}`, entry.url);
      }
    }
    return out;
  } catch (err) {
    console.error('[resolveUrls] error:', err);
    return out;
  }
}
