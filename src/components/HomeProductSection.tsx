import Link from 'next/link';
import { cookies } from 'next/headers';
import type { PrestaProduct } from '@/lib/presta';
import { fetchCategory } from '@/lib/presta';
import type { SliderConfig } from '@/lib/headless-api';
import { categoryUrl, idLangFromLocale } from '@/lib/url-builder';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';

interface Props {
  title: string;
  products: PrestaProduct[];
  sliderConfig?: SliderConfig;
  categoryId?: number;
}

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="14" fill="currentColor" aria-hidden="true" style={{ marginLeft: 6 }}>
    <path d="M22 12l-4-4v3H3v2h15v3z"/>
  </svg>
);

export default async function HomeProductSection({ title, products, sliderConfig, categoryId }: Props) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr');
  if (products.length === 0) return null;
  const useCarousel = sliderConfig?.enabled === true;
  // Résout le link_rewrite de la catégorie pour construire l'URL SEO `/{id}-{rewrite}`
  const category = categoryId ? await fetchCategory(categoryId, idLangFromLocale(locale)).catch(() => null) : null;
  const viewAllHref = categoryId
    ? categoryUrl({ id: categoryId, linkRewrite: category?.linkRewrite || '' }, locale)
    : null;

  return (
    <section style={{ marginBottom: 48 }}>
      <div className="home-section-head" style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', paddingBottom: 0, marginBottom: 10, gap: 20 }}>
        <h2 className="home-section-title" style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          {title}
        </h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="view-all-link" style={{ color: 'var(--or-text)', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            Voir plus<ArrowIcon />
          </Link>
        ) : null}
      </div>
      {useCarousel ? (
        <ProductCarousel products={products} config={sliderConfig!} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
