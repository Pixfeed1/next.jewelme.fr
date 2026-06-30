import { NextRequest, NextResponse } from 'next/server';
import { postController } from '@/lib/auth-server';

// Liste des bons de reduction valides du client.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '');
    if (!token) return NextResponse.json({ success: false, vouchers: [] }, { status: 200 });
    const r = await postController('customer_vouchers', { token });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, vouchers: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
