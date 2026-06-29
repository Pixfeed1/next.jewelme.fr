import { NextRequest, NextResponse } from 'next/server';
import { authControllerUrl } from '@/lib/auth-server';

/**
 * Proxy interne vers le controller Presta `customer_prices`.
 * La ws_key est ajoutee cote serveur (jamais exposee au client), comme pour
 * /api/auth/*. Le client envoie { token (secure_key du cart), ids:number[] }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '');
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((n: unknown) => typeof n === 'number' && n > 0).join(',')
      : String(body.ids || '');
    if (!token || !ids) {
      return NextResponse.json({ success: false }, { status: 200 });
    }
    const r = await fetch(authControllerUrl('customer_prices'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ids }),
      cache: 'no-store',
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    // En cas d'echec on renvoie success:false : le front garde les prix publics.
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
