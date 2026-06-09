import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { enrichCartWithStock } from '@/lib/cart-stock';

const PRESTA_API_URL = process.env.PRESTA_API_URL || '';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';
const BASE = PRESTA_API_URL.replace(/\/api\/?$/, '');

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  const idLang = locale === 'en' ? 2 : 1;
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  try {
    const res = await fetch(`${BASE}/headless/cart?token=${encodeURIComponent(token)}&ws_key=${PRESTA_API_KEY}&id_lang=${idLang}`, { cache: 'no-store' });
    const data = await res.json();
    const out = res.ok ? await enrichCartWithStock(data) : data;
    return NextResponse.json(out, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: 'Proxy error', detail: String(e) }, { status: 500 });
  }
}
