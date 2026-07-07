import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || 'FHREYMY1XYM8UBZW2EIJ7WUQWT36TBQG';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  const idLang = locale === 'en' ? 2 : 1;
  const { reference } = await params;
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  try {
    const r = await fetch(`${PRESTA_API_URL.replace(/\/api\/?$/, '')}/headless/order?reference=${encodeURIComponent(reference)}&ws_key=${PRESTA_API_KEY}&id_lang=${idLang}`, { cache: 'no-store' });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: 'Proxy error', detail: e.message }, { status: 500 });
  }
}
