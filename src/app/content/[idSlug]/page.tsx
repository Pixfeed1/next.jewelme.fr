import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { parseIdFromSlug } from '@/lib/url-builder';
import CmsView, { cmsMetadata } from '@/views/CmsView';

export const dynamic = 'force-dynamic';
const LOCALE = 'fr';

export async function generateMetadata({ params }: { params: Promise<{ idSlug: string }> }): Promise<Metadata> {
  const { idSlug } = await params;
  const id = parseIdFromSlug(idSlug);
  return id ? cmsMetadata(id, LOCALE) : {};
}

export default async function ContentPage({ params, searchParams }: { params: Promise<{ idSlug: string }>; searchParams: Promise<{ form?: string }> }) {
  const { idSlug } = await params;
  const sp = await searchParams;
  const id = parseIdFromSlug(idSlug);
  if (!id) notFound();
  return <CmsView id={id} locale={LOCALE} searchParams={sp} />;
}
