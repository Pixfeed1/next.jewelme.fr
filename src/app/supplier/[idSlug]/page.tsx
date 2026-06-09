import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { parseIdFromSlug } from '@/lib/url-builder';
import SupplierView, { supplierMetadata } from '@/views/SupplierView';

export const dynamic = 'force-dynamic';
const LOCALE = 'fr';

export async function generateMetadata({ params }: { params: Promise<{ idSlug: string }> }): Promise<Metadata> {
  const { idSlug } = await params;
  const id = parseIdFromSlug(idSlug);
  return id ? supplierMetadata(id, LOCALE) : {};
}

export default async function SupplierPage({ params }: { params: Promise<{ idSlug: string }> }) {
  const { idSlug } = await params;
  const id = parseIdFromSlug(idSlug);
  if (!id) notFound();
  return <SupplierView id={id} locale={LOCALE} />;
}
