import { NextRequest, NextResponse } from 'next/server';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const idLang = searchParams.get('id_lang') || '1';

  if (q.length < 2) {
    return NextResponse.json({ query: q, count: 0, results: [] });
  }

  const url = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=search_suggest&q=${encodeURIComponent(q)}&limit=${limit}&id_lang=${idLang}&ws_key=${API_KEY}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ query: q, count: 0, results: [], error: `HTTP ${res.status}` });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ query: q, count: 0, results: [], error: e.message });
  }
}
