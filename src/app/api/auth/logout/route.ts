import { NextResponse } from 'next/server';
import { authControllerUrl, AUTH_COOKIE } from '@/lib/auth-server';

export async function POST() {
  // Best effort : on prévient Presta (non bloquant)
  try {
    await fetch(authControllerUrl('auth_logout'), { method: 'POST', cache: 'no-store' });
  } catch {}
  const res = NextResponse.json({ success: true });
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
