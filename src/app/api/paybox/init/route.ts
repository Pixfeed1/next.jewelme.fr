import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';
const BASE = PRESTA_API_URL.replace(/\/api\/?$/, '');

/**
 * Initie un paiement Paybox côté serveur (la ws_key n'est jamais exposée au
 * client). Appelle le contrôleur Presta `paybox_init` et renvoie `{ url, fields }`
 * que le client soumet ensuite en POST vers la page de paiement Paybox.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_cart, id_customer, id_address_delivery, id_address_invoice, id_carrier } = body || {};
    if (!id_cart) {
      return NextResponse.json({ success: false, error: 'Missing id_cart' }, { status: 400 });
    }
    const cookieStore = await cookies();
    const secureKey = cookieStore.get('pixfeed_auth')?.value;
    const params = new URLSearchParams({
      fc: 'module',
      module: 'pixfeed_headless_api',
      controller: 'paybox_init',
      id_cart: String(id_cart),
      id_customer: String(id_customer ?? ''),
      id_address_delivery: String(id_address_delivery ?? ''),
      id_address_invoice: String(id_address_invoice ?? id_address_delivery ?? ''),
      id_carrier: String(id_carrier ?? ''),
      ws_key: PRESTA_API_KEY,
      ...(secureKey ? { secure_key: secureKey } : {}),
    });
    const r = await fetch(`${BASE}/index.php?${params.toString()}`, { cache: 'no-store' });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: 'Proxy error', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
