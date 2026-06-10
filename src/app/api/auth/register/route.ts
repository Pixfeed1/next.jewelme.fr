import { NextRequest, NextResponse } from 'next/server';
import { authControllerUrl, AUTH_COOKIE, authCookieOptions, stripUser } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const r = await fetch(authControllerUrl('auth_register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        firstname: body.firstname,
        lastname: body.lastname,
        newsletter: body.newsletter ? 1 : 0,
      }),
      cache: 'no-store',
    });
    const data = await r.json();
    if (r.ok && data.success && data.secure_key) {
      const res = NextResponse.json({ success: true, user: stripUser(data) }, { status: 201 });
      res.cookies.set(AUTH_COOKIE, String(data.secure_key), authCookieOptions);
      return res;
    }
    return NextResponse.json(
      { success: false, error: data.error || 'Registration failed' },
      { status: r.status && r.status >= 400 ? r.status : 400 }
    );
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: 'Proxy error', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
