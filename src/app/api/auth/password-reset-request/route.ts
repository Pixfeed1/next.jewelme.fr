import { NextRequest, NextResponse } from 'next/server';
import { authControllerUrl } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  // Reponse generique anti-enumeration : on renvoie toujours success:true,
  // meme si le backend echoue (best effort).
  try {
    const body = await req.json();
    await fetch(authControllerUrl('auth_password_reset_request'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email }),
      cache: 'no-store',
    });
  } catch {}
  return NextResponse.json({ success: true });
}
