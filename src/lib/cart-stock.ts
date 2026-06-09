import { fetchStockAvailability } from './presta';

/**
 * Enrichit un payload panier Presta avec le stock disponible par ligne
 * (`quantity_available`), pour permettre au front de borner la quantité au
 * maximum en stock au lieu de laisser Presta refuser/supprimer la ligne.
 *
 * Défensif : en cas d'échec du fetch stock, le panier est renvoyé inchangé.
 */
export async function enrichCartWithStock<T extends { items?: Array<Record<string, unknown>> }>(
  data: T
): Promise<T> {
  try {
    const items = data?.items;
    if (!Array.isArray(items) || items.length === 0) return data;
    const stockMap = await fetchStockAvailability(
      items.map((it) => ({
        id_product: Number(it.id_product),
        id_product_attribute: Number(it.id_product_attribute ?? 0),
      }))
    );
    if (Object.keys(stockMap).length === 0) return data;
    for (const it of items) {
      const pid = Number(it.id_product);
      const attr = Number(it.id_product_attribute ?? 0);
      const avail = stockMap[`${pid}-${attr}`] ?? stockMap[`${pid}-0`];
      if (typeof avail === 'number') it.quantity_available = avail;
    }
  } catch {
    // no-op : on renvoie le panier tel quel
  }
  return data;
}
