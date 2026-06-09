import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || 'FHREYMY1XYM8UBZW2EIJ7WUQWT36TBQG';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  const idLang = locale === 'en' ? 2 : 1;
  try {
    const body = await req.json();
    const r = await fetch(`${PRESTA_API_URL.replace('/api','')}/headless/cart/voucher?id_lang=${idLang}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Ws-Key': PRESTA_API_KEY },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: 'Proxy error', detail: e.message }, { status: 500 });
  }
}
