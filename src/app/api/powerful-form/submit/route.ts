import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const PRESTA_API_URL = process.env.PRESTA_API_URL || '';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';
const BASE = PRESTA_API_URL.replace(/\/api\/?$/, '');

// Anti-spam : honeypot + time-trap.
const MIN_FILL_MS = 3000;

function isSpam(honey: string, ts: number): boolean {
  if (honey && honey.trim() !== '') return true;
  if (!ts || ts <= 0) return true;
  if (Date.now() - ts < MIN_FILL_MS) return true;
  return false;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  const idLang = locale === 'en' ? 2 : 1;
  try {
    const body = await req.json();
    const honey = String(body._honey || '');
    const ts = parseInt(String(body._ts || '0'), 10) || 0;
    if (isSpam(honey, ts)) {
      // Faux succes silencieux : le bot n'insiste pas
      return NextResponse.json({ success: true });
    }
    delete body._honey;
    delete body._ts;
    const res = await fetch(`${BASE}/headless/powerful_form/submit?id_lang=${idLang}`, {
      method: 'POST',
      headers: {
        'X-Ws-Key': PRESTA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: 'Proxy error', detail: String(e) }, { status: 500 });
  }
}
