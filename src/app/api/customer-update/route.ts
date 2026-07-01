import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { postController, AUTH_COOKIE } from '@/lib/auth-server';

// Mise a jour du profil (firstname/lastname/email/newsletter/new_password).
// Le changement d'email ou de mot de passe exige current_password (verif backend).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || '');
    const customerToken = (await cookies()).get(AUTH_COOKIE)?.value || '';
    if (!token && !customerToken) return NextResponse.json({ success: false }, { status: 200 });
    const r = await postController('customer_update', { ...body, customer_token: customerToken });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
