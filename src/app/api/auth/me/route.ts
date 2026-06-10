import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authControllerUrl, AUTH_COOKIE, stripUser } from '@/lib/auth-server';

export async function GET() {
  const c = await cookies();
  const key = c.get(AUTH_COOKIE)?.value;
  if (!key) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  try {
    const r = await fetch(authControllerUrl('auth_me', { secure_key: key }), { cache: 'no-store' });
    const data = await r.json();
    if (r.ok && data.success) {
      return NextResponse.json({ success: true, user: stripUser(data) });
    }
    // Session invalide : on nettoie le cookie
    const res = NextResponse.json({ success: false }, { status: 401 });
    res.cookies.delete(AUTH_COOKIE);
    return res;
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: 'Proxy error', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
