import { NextRequest, NextResponse } from 'next/server';
import { authControllerUrl } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const r = await fetch(authControllerUrl('auth_password_reset_confirm'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: body.token,
        id_customer: body.id_customer,
        password: body.password,
      }),
      cache: 'no-store',
    });
    const data = await r.json();
    if (r.ok && data.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, error: data.error || 'invalid' },
      { status: r.status && r.status >= 400 ? r.status : 400 }
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: 'Proxy error', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
