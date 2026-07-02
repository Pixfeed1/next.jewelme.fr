import { NextRequest, NextResponse } from 'next/server';
import { resolveUrls } from '@/lib/resolve-urls';

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
    // URLs produits natives Presta (resolve_urls) — filet de secours cote client si absent.
    if (Array.isArray(data?.results) && data.results.length > 0) {
      const ids = Array.from(new Set(data.results.map((r: { id?: number }) => Number(r.id)).filter((n: number) => n > 0)));
      const map = await resolveUrls(ids.map((id) => ({ type: 'product', id: id as number })), parseInt(idLang, 10) || 1);
      data.results = data.results.map((r: { id?: number; url?: string }) => {
        const resolved = map.get(`product:${Number(r.id)}`);
        return resolved ? { ...r, url: resolved } : r;
      });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ query: q, count: 0, results: [], error: e.message });
  }
}
