import { NextRequest, NextResponse } from 'next/server';

const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || 'FHREYMY1XYM8UBZW2EIJ7WUQWT36TBQG';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id_carrier = searchParams.get('id_carrier') || '';
  const zipCode = searchParams.get('zipCode') || '';
  const country = searchParams.get('country') || '';
  const city = searchParams.get('city') || '';
  const street = searchParams.get('street') || '';

  if (!id_carrier || !zipCode || !country) {
    return NextResponse.json(
      { error: 'Missing required parameters (id_carrier, zipCode, country)' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      fc: 'module',
      module: 'pixfeed_headless_api',
      controller: 'parcel_points',
      id_carrier,
      zipCode,
      country,
      ws_key: PRESTA_API_KEY,
    });
    if (city) params.set('city', city);
    if (street) params.set('street', street);

    const url = `${PRESTA_API_URL.replace(/\/api\/?$/, '')}/index.php?${params.toString()}`;
    const r = await fetch(url, { cache: 'no-store' });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Proxy error', detail: e.message },
      { status: 500 }
    );
  }
}
