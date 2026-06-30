import { NextRequest, NextResponse } from 'next/server';
import { postController } from '@/lib/auth-server';

// Suppression (soft delete) d'une adresse du client.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '');
    const id_address = body.id_address;
    if (!token || !id_address) return NextResponse.json({ success: false }, { status: 200 });
    const r = await postController('customer_address_delete', { token, id_address });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
