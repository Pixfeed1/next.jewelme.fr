import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { postController, AUTH_COOKIE } from '@/lib/auth-server';

// Creation / mise a jour d'une adresse (id_address=0 ou absent => creation).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '');
    const customerToken = (await cookies()).get(AUTH_COOKIE)?.value || '';
    if (!token && !customerToken) return NextResponse.json({ success: false }, { status: 200 });
    const r = await postController('customer_address_save', { ...body, customer_token: customerToken });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
