import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { parseIdFromSlug } from '@/lib/url-builder';
import ManufacturerView, { manufacturerMetadata } from '@/views/ManufacturerView';

export const dynamic = 'force-dynamic';
const LOCALE = 'fr';

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ idSlug: string }> }): Promise<Metadata> {
  const { idSlug } = await params;
  const id = parseIdFromSlug(idSlug);
  return id ? manufacturerMetadata(id, LOCALE) : {};
}

export default async function LabelPage({ params, searchParams }: { params: Promise<{ idSlug: string }>; searchParams: Promise<SP> }) {
  const { idSlug } = await params;
  const sp = await searchParams;
  const id = parseIdFromSlug(idSlug);
  if (!id) notFound();
  return <ManufacturerView id={id} locale={LOCALE} searchParams={sp} />;
}
