import { NextResponse } from 'next/server';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sampleId = searchParams.get('sample_id');
  if (!sampleId) {
    return NextResponse.json({ error: 'Missing sample_id' }, { status: 400 });
  }
  const url = `${PRESTA_BASE}/headless/waveform?sample_id=${encodeURIComponent(sampleId)}&ws_key=${API_KEY}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 * 60 * 24 }, // cache 24h côté Next
    });
    if (!res.ok) return NextResponse.json({ error: `Upstream HTTP ${res.status}` }, { status: 502 });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
