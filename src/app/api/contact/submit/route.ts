import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const PRESTA_API_URL = process.env.PRESTA_API_URL || '';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';
const BASE = PRESTA_API_URL.replace(/\/api\/?$/, '');

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  const idLang = locale === 'en' ? 2 : 1;
  const url = `${BASE}/headless/contact_submit?id_lang=${idLang}`;
  const contentType = req.headers.get('content-type') || '';
  let res: Response;
  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      res = await fetch(url, { method: 'POST', headers: { 'X-Ws-Key': PRESTA_API_KEY }, body: formData });
    } else {
      const body = await req.json();
      res = await fetch(url, {
        method: 'POST',
        headers: { 'X-Ws-Key': PRESTA_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: 'Proxy error', detail: String(e) }, { status: 500 });
  }
}
