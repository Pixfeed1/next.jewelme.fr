import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
const PRESTA_BASE = (process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com/api').replace(/\/api\/?$/, '');
const PRESTA_URL = `${PRESTA_BASE}/index.php?fc=module&module=pixfeed_headless_api&controller=mailalert`;
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim();
    const idProduct = parseInt(String(body?.id_product || 0), 10);
    if (!email || idProduct <= 0) {
      return NextResponse.json({ ok: false, error: 'Email ou produit manquant.' }, { status: 400 });
    }
    const cookieStore = await cookies();
    const locale = cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr';
    const idLang = locale === 'en' ? 2 : 1;
    const res = await fetch(PRESTA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, id_product: idProduct, id_lang: idLang }),
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: data.ok ? 200 : 400 });
  } catch (err) {
    console.error('[mailalert] error:', err);
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
