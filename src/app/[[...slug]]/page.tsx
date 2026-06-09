import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { dispatchSlug } from '@/lib/catch-all';
import HomeView from '@/views/HomeView';
import ProductView, { productMetadata } from '@/views/ProductView';
import CategoryView, { categoryMetadata } from '@/views/CategoryView';

export const dynamic = 'force-dynamic';

const LOCALE = 'fr';

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug = [] } = await params;
  const d = dispatchSlug(slug);
  if (d.type === 'product') return productMetadata(d.id, LOCALE);
  if (d.type === 'category') return categoryMetadata(d.id, LOCALE);
  return {};
}

export default async function CatchAll({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<SP>;
}) {
  const { slug = [] } = await params;
  const sp = await searchParams;
  const d = dispatchSlug(slug);

  switch (d.type) {
    case 'home':
      return <HomeView locale={LOCALE} />;
    case 'product':
      return <ProductView id={d.id} locale={LOCALE} />;
    case 'category':
      return <CategoryView id={d.id} locale={LOCALE} searchParams={sp} />;
    default:
      notFound();
  }
}
