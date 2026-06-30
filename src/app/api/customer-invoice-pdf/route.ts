import { NextRequest, NextResponse } from 'next/server';
import { postController } from '@/lib/auth-server';

// Facture PDF d'une commande (le backend verifie l'appartenance) -> application/pdf.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '');
    const id_order = body.id_order;
    if (!token || !id_order) {
      return NextResponse.json({ success: false, error: 'missing params' }, { status: 400 });
    }
    const r = await postController('customer_invoice_pdf', { token, id_order });
    const contentType = r.headers.get('content-type') || '';
    if (!r.ok || !contentType.includes('pdf')) {
      // Erreur backend (JSON) : on la relaie telle quelle
      const txt = await r.text();
      return new NextResponse(txt, { status: r.ok ? 502 : r.status, headers: { 'Content-Type': contentType || 'application/json' } });
    }
    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${id_order}.pdf"`,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
