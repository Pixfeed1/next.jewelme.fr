const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';

export interface OrderSummary {
  id: number;
  reference: string;
  total_paid: number;
}

/**
 * Récupère la commande créée pour un panier donné (après paiement Paybox, la
 * commande est créée par l'IPN serveur-serveur de Presta).
 *
 * L'IPN peut ne pas encore avoir été traité au moment du retour client : on
 * effectue donc un court polling (par défaut 3 essais espacés).
 */
export async function fetchOrderByCart(
  cartId: number,
  tries = 3,
  delayMs = 1200
): Promise<OrderSummary | null> {
  if (!cartId) return null;
  // Webservice standard Presta : on s'assure que la base se termine par /api
  const apiBase = /\/api\/?$/.test(PRESTA_API_URL)
    ? PRESTA_API_URL.replace(/\/$/, '')
    : `${PRESTA_API_URL.replace(/\/$/, '')}/api`;
  const url = `${apiBase}/orders?filter[id_cart]=${cartId}&output_format=JSON&display=full&ws_key=${PRESTA_API_KEY}`;

  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const o = data.orders && data.orders[0];
        if (o) {
          return {
            id: parseInt(String(o.id), 10),
            reference: String(o.reference ?? ''),
            total_paid: parseFloat(String(o.total_paid ?? '0')),
          };
        }
      }
    } catch {
      // ignore, on retente
    }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}
