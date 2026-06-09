import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { fetchPowerfulForm } from '@/lib/powerful-form';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const h = await headers();
  const headerLocale = h.get('x-locale');
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  const locale = headerLocale || cookieLocale;
  const idLang = locale === 'en' ? 2 : 1;
  const { id } = await params;
  const formId = parseInt(id, 10);
  if (isNaN(formId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const form = await fetchPowerfulForm(formId, idLang);
  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(form);
}
