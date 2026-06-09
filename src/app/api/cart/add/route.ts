import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const PRESTA_API_URL = process.env.PRESTA_API_URL || '';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';
const BASE = PRESTA_API_URL.replace(/\/api\/?$/, '');

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  const idLang = locale === 'en' ? 2 : 1;
  try {
    const body = await req.json();
    const res = await fetch(`${BASE}/headless/cart/add?id_lang=${idLang}`, {
      method: 'POST',
      headers: { 'X-Ws-Key': PRESTA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: 'Proxy error', detail: String(e) }, { status: 500 });
  }
}
