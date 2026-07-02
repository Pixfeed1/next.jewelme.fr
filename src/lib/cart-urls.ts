/**
 * Enrichit les lignes d'un panier avec l'URL produit native Presta (resolve_urls).
 * Server-only : importe resolve-urls.ts, jamais depuis un composant 'use client'.
 */
import { resolveUrls } from './resolve-urls';

interface CartLine { id_product?: number; url?: string; [k: string]: unknown }
interface CartLike { items?: CartLine[]; [k: string]: unknown }

export async function enrichCartWithUrls<T extends CartLike>(cart: T, idLang: number): Promise<T> {
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) return cart;
  const ids = Array.from(new Set(cart.items.map((it) => Number(it.id_product)).filter((n) => n > 0)));
  if (ids.length === 0) return cart;
  const map = await resolveUrls(ids.map((id) => ({ type: 'product', id })), idLang);
  cart.items = cart.items.map((it) => {
    const resolved = map.get(`product:${Number(it.id_product)}`);
    // On n'ecrase pas une url deja fournie par le backend si la resolution echoue.
    return resolved ? { ...it, url: resolved } : it;
  });
  return cart;
}
