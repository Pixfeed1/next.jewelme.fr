import { NextRequest, NextResponse } from 'next/server';

const PRESTA_BASE = (process.env.PRESTA_API_URL || '').replace(/\/api\/?$/, '');
const API_KEY = process.env.PRESTA_API_KEY || '';

export async function POST(req: NextRequest) {
  let body: { email?: string } = {};
  try { body = await req.json(); } catch {}
  const email = String(body?.email ?? '').trim();
  if (!email) return NextResponse.json({ ok: false, error: 'Email manquant' }, { status: 400 });

  const url = `${PRESTA_BASE}/headless/newsletter/subscribe?ws_key=${API_KEY}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: data.ok ? 200 : 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'Erreur réseau' }, { status: 500 });
  }
}
