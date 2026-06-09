import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  const idLang = locale === 'en' ? 2 : 1;
  const { productId } = await params;
  const id = parseInt(productId, 10);
  if (!id || id <= 0) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  const url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=product_samples&id_product=${id}&ws_key=${API_KEY}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream HTTP ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
