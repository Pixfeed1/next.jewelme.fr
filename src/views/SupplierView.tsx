import { fetchSupplier, fetchProductsBySupplier } from '@/lib/presta';
import { getServerT } from '@/lib/i18n';
import { supplierUrl, homeUrl, idLangFromLocale } from '@/lib/url-builder';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export async function supplierMetadata(id: number, locale: string): Promise<Metadata> {
  if (!id) return {};
  const idLang = idLangFromLocale(locale);
  const s = await fetchSupplier(id, idLang);
  if (!s) return {};
  const sup = { id: s.id, name: s.name, linkRewrite: s.linkRewrite };
  return {
    title: s.metaTitle || s.name,
    description: s.metaDescription || '',
    alternates: {
      canonical: supplierUrl(sup, locale),
      languages: { fr: supplierUrl(sup, 'fr'), en: supplierUrl(sup, 'en'), 'x-default': supplierUrl(sup, 'fr') },
    },
  };
}

export default async function SupplierView({ id, locale }: { id: number; locale: string }) {
  if (!id) notFound();
  const idLang = idLangFromLocale(locale);
  const t = await getServerT();
  const [supplier, products] = await Promise.all([
    fetchSupplier(id, idLang),
    fetchProductsBySupplier(id, idLang),
  ]);
  if (!supplier || !supplier.active) notFound();

  return (
    <div>
      <p style={{ marginBottom: 16, fontSize: 13 }}>
        <Link href={homeUrl(locale)} style={{ color: '#888', textDecoration: 'none' }}>{t('home')}</Link>
        <span style={{ color: '#ccc', margin: '0 8px' }}>›</span>
        <span style={{ color: '#888' }}>{supplier.name}</span>
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{supplier.name}</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        {products.length} {products.length > 1 ? t('products') : t('product_singular')}
      </p>

      {products.length === 0 ? (
        <div style={{ padding: 24, background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 8 }}>
          <p style={{ margin: 0 }}>{t('no_products_on_page')}</p>
        </div>
      ) : (
        <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {supplier.description && (
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #eee', color: '#444', lineHeight: 1.7, fontSize: 14 }}
             dangerouslySetInnerHTML={{ __html: supplier.description }} />
      )}
    </div>
  );
}
