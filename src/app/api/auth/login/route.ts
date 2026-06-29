import { NextRequest, NextResponse } from 'next/server';
import { authControllerUrl, AUTH_COOKIE, authCookieOptions, stripUser } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const r = await fetch(authControllerUrl('auth_login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password, cart_token: body.cart_token }),
      cache: 'no-store',
    });
    const data = await r.json();
    if (r.ok && data.success && data.secure_key) {
      const res = NextResponse.json({ success: true, user: stripUser(data) });
      res.cookies.set(AUTH_COOKIE, String(data.secure_key), authCookieOptions);
      return res;
    }
    return NextResponse.json(
      { success: false, error: data.error || 'Invalid credentials' },
      { status: r.status && r.status >= 400 ? r.status : 401 }
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: 'Proxy error', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
