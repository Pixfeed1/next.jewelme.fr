import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || 'FHREYMY1XYM8UBZW2EIJ7WUQWT36TBQG';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  const idLang = locale === 'en' ? 2 : 1;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  const id_country = searchParams.get('id_country') || '';
  const postcode = searchParams.get('postcode') || '';

  if (!token || !id_country) {
    return NextResponse.json({ error: 'Missing token or id_country' }, { status: 400 });
  }

  try {
    const url = `${PRESTA_API_URL.replace(/\/api\/?$/, '')}/headless/checkout/carriers?token=${encodeURIComponent(token)}&id_country=${id_country}&postcode=${encodeURIComponent(postcode)}&ws_key=${PRESTA_API_KEY}&id_lang=${idLang}`;
    const r = await fetch(url, { cache: 'no-store' });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: 'Proxy error', detail: e.message }, { status: 500 });
  }
}
