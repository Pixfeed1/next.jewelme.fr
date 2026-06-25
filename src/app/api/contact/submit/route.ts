import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const PRESTA_API_URL = process.env.PRESTA_API_URL || '';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || '';
const BASE = PRESTA_API_URL.replace(/\/api\/?$/, '');

// Anti-spam : honeypot + time-trap.
const MIN_FILL_MS = 3000; // soumission en moins de 3s = bot

function isSpam(honey: string, ts: number): boolean {
  // 1. Honeypot rempli => bot
  if (honey && honey.trim() !== '') return true;
  // 2. Pas de timestamp => POST direct sans charger la page => bot
  if (!ts || ts <= 0) return true;
  // 3. Soumission trop rapide => bot
  if (Date.now() - ts < MIN_FILL_MS) return true;
  return false;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value;
  const idLang = locale === 'en' ? 2 : 1;
  const url = `${BASE}/headless/contact_submit?id_lang=${idLang}`;
  const contentType = req.headers.get('content-type') || '';
  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const honey = String(formData.get('_honey') || '');
      const ts = parseInt(String(formData.get('_ts') || '0'), 10) || 0;
      if (isSpam(honey, ts)) {
        // Faux succes : le bot croit que c'est passe, n'insiste pas
        return NextResponse.json({ success: true });
      }
      // Retire les champs anti-spam avant transmission a Presta
      formData.delete('_honey');
      formData.delete('_ts');
      const res = await fetch(url, { method: 'POST', headers: { 'X-Ws-Key': PRESTA_API_KEY }, body: formData });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      const body = await req.json();
      const honey = String(body._honey || '');
      const ts = parseInt(String(body._ts || '0'), 10) || 0;
      if (isSpam(honey, ts)) {
        return NextResponse.json({ success: true });
      }
      delete body._honey;
      delete body._ts;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'X-Ws-Key': PRESTA_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Proxy error', detail: String(e) }, { status: 500 });
  }
}
