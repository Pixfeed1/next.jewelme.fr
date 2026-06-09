import { fetchManufacturer, fetchProductsByIds } from '@/lib/presta';
import { getServerT } from '@/lib/i18n';
import { manufacturerUrl, homeUrl, idLangFromLocale } from '@/lib/url-builder';
import { fetchManufacturerProductIdsWithFilters, parseFiltersFromSearchParams } from '@/lib/category-products';
import { fetchFiltersByManufacturer } from '@/lib/filters';
import FilterSidebar from '@/components/FilterSidebar';
import FilterToolbarButton from '@/components/FilterToolbarButton';
import ProductCard from '@/components/ProductCard';
import ProductListRow from '@/components/ProductListRow';
import ProductTableRow from '@/components/ProductTableRow';
import ViewSwitcher, { ViewMode } from '@/components/ViewSwitcher';
import SortDropdown, { SortKey } from '@/components/SortDropdown';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

type SP = Record<string, string | string[] | undefined>;

export async function manufacturerMetadata(id: number, locale: string): Promise<Metadata> {
  if (!id) return {};
  const idLang = idLangFromLocale(locale);
  const m = await fetchManufacturer(id, idLang);
  if (!m) return {};
  const mfg = { id: m.id, name: m.name, linkRewrite: m.linkRewrite };
  return {
    title: m.metaTitle || `${m.name} — OnlyRoots`,
    description: m.metaDescription || m.shortDescription || `Découvrez tous les produits du label ${m.name}`,
    alternates: {
      canonical: manufacturerUrl(mfg, locale),
      languages: { fr: manufacturerUrl(mfg, 'fr'), en: manufacturerUrl(mfg, 'en'), 'x-default': manufacturerUrl(mfg, 'fr') },
    },
  };
}

const PER_PAGE = 30;

export default async function ManufacturerView({ id, locale, searchParams: sp }: { id: number; locale: string; searchParams: SP }) {
  const pageStr = typeof sp.page === 'string' ? sp.page : '1';
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const activeFilters = parseFiltersFromSearchParams(sp);
  const viewRaw = typeof sp.view === 'string' ? sp.view : 'grid';
  const view: ViewMode = (viewRaw === 'list' || viewRaw === 'table') ? viewRaw : 'grid';
  const orderbyRaw = typeof sp.orderby === 'string' ? sp.orderby : 'date_add';
  const orderdirRaw = typeof sp.orderdir === 'string' ? sp.orderdir : 'desc';
  const allowedOrderby = ['position', 'name', 'price', 'date_add'];
  const orderby = allowedOrderby.includes(orderbyRaw) ? orderbyRaw : 'date_add';
  const orderdir = orderdirRaw === 'asc' ? 'asc' : 'desc';
  const sortKey = `${orderby}-${orderdir}` as SortKey;

  if (!id) notFound();
  const t = await getServerT();
  const idLang = idLangFromLocale(locale);

  const [manufacturer, { ids: productIds, total }, filters] = await Promise.all([
    fetchManufacturer(id, idLang),
    fetchManufacturerProductIdsWithFilters(id, page, PER_PAGE, activeFilters, orderby, orderdir),
    fetchFiltersByManufacturer(id),
  ]);
  if (!manufacturer || !manufacturer.active) notFound();

  const products = productIds.length > 0 ? await fetchProductsByIds(productIds, idLang) : [];
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const mUrl = manufacturerUrl({ id, name: manufacturer.name, linkRewrite: manufacturer.linkRewrite }, locale);

  return (
    <div>
      <p style={{ marginBottom: 16, fontSize: 13 }}>
        <Link href={homeUrl(locale)} style={{ color: '#888', textDecoration: 'none' }}>{t('home')}</Link>
        <span style={{ color: '#ccc', margin: '0 8px' }}>›</span>
        <span style={{ color: '#888' }}>{manufacturer.name}</span>
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{manufacturer.name}</h1>
      {manufacturer.shortDescription && (
        <p style={{ color: '#555', marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>{manufacturer.shortDescription}</p>
      )}
      <p style={{ color: '#666', marginBottom: 32 }}>
        {total} {total > 1 ? t('products') : t('product_singular')} • {t('page_word')} {page} / {totalPages}
      </p>

      <div className="category-layout" style={{ display: 'grid', gridTemplateColumns: filters.groups.length > 0 ? 'minmax(220px, 250px) 1fr' : '1fr', gap: 32, alignItems: 'start' }}>
        {filters.groups.length > 0 && <FilterSidebar groups={filters.groups} />}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--or-grey-lighter)' }}>
            {filters.groups.length > 0 && <FilterToolbarButton />}
            <SortDropdown current={sortKey} />
            <ViewSwitcher current={view} />
          </div>
          {products.length === 0 ? (
            <div style={{ padding: 24, background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 8 }}>
              <p style={{ margin: 0 }}>{t('no_products_on_page')}</p>
            </div>
          ) : view === 'grid' ? (
            <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : view === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {products.map((p) => <ProductListRow key={p.id} product={p} />)}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 4, border: '1px solid var(--or-grey-lighter)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--or-bg-soft)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#666' }}>
                    <th style={{ padding: 8, textAlign: 'left' }}></th>
                    <th style={{ padding: 8, textAlign: 'left' }}>Nom</th>
                    <th style={{ padding: 8, textAlign: 'left' }}>Réf</th>
                    <th style={{ padding: 8, textAlign: 'left' }}>Prix</th>
                    <th style={{ padding: 8 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => <ProductTableRow key={p.id} product={p} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <nav style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 48, alignItems: 'center' }}>
          {page > 1 ? (
            <Link href={`${mUrl}?page=${page - 1}`} style={{ padding: '8px 16px', border: '1px solid var(--or-grey-lighter)', borderRadius: 4, textDecoration: 'none', color: 'var(--or-text)' }}>
              ← Précédent
            </Link>
          ) : null}
          <span style={{ color: '#666', fontSize: 14 }}>Page {page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={`${mUrl}?page=${page + 1}`} style={{ padding: '8px 16px', border: '1px solid var(--or-grey-lighter)', borderRadius: 4, textDecoration: 'none', color: 'var(--or-text)' }}>
              Suivant →
            </Link>
          ) : null}
        </nav>
      )}

      {manufacturer.description && (
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #eee', color: '#444', lineHeight: 1.7, fontSize: 14 }}
             dangerouslySetInnerHTML={{ __html: manufacturer.description }} />
      )}
    </div>
  );
}
