import { NextRequest, NextResponse } from 'next/server';
import { authControllerUrl } from '@/lib/auth-server';

/**
 * Proxy interne vers le controller Presta `customer_addresses`.
 * La ws_key est ajoutee cote serveur (jamais exposee au client), comme pour
 * /api/customer-prices. Le client envoie { token (secure_key du cart) }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '');
    if (!token) {
      return NextResponse.json({ success: false, addresses: [] }, { status: 200 });
    }
    const r = await fetch(authControllerUrl('customer_addresses'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, addresses: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
