import { NextRequest, NextResponse } from 'next/server';
import { postController } from '@/lib/auth-server';

// Detail d'une commande (le backend verifie l'appartenance au client).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '');
    const id_order = body.id_order;
    if (!token || !id_order) return NextResponse.json({ success: false }, { status: 200 });
    const r = await postController('customer_order_detail', { token, id_order });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
