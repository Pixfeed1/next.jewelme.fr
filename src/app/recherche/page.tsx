import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { fetchProductsByIds } from '@/lib/presta';
import { getServerT } from '@/lib/i18n';
import { idLangFromLocale, homeUrl } from '@/lib/url-builder';
import { parseFiltersFromSearchParams } from '@/lib/category-products';
import { fetchSearchProductIds, fetchSearchFilters } from '@/lib/search';
import FilterSidebar from '@/components/FilterSidebar';
import FilterToolbarButton from '@/components/FilterToolbarButton';
import ProductCard from '@/components/ProductCard';
import ProductListRow from '@/components/ProductListRow';
import ProductTableRow from '@/components/ProductTableRow';
import ViewSwitcher, { ViewMode } from '@/components/ViewSwitcher';
import SortDropdown, { SortKey } from '@/components/SortDropdown';

type SP = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: 'Recherche',
  robots: { index: false, follow: true },
};

const PER_PAGE = 30;

export default async function RecherchePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const query = (typeof sp.s === 'string' ? sp.s : (typeof sp.q === 'string' ? sp.q : '')).trim();
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr';
  const idLang = idLangFromLocale(locale);
  const t = await getServerT();

  // Si pas de query, message d'accueil
  if (query.length < 2) {
    return (
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>{locale === 'en' ? 'Search' : 'Recherche'}</h1>
        <p style={{ color: '#666' }}>{locale === 'en' ? 'Please enter at least 2 characters.' : 'Veuillez saisir au moins 2 caracteres dans la barre de recherche.'}</p>
      </div>
    );
  }

  const pageStr = typeof sp.page === 'string' ? sp.page : '1';
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const activeFilters = parseFiltersFromSearchParams(sp);
  const viewRaw = typeof sp.view === 'string' ? sp.view : 'grid';
  const view: ViewMode = (viewRaw === 'list' || viewRaw === 'table') ? viewRaw : 'grid';
  const orderbyRaw = typeof sp.orderby === 'string' ? sp.orderby : 'relevance';
  const orderdirRaw = typeof sp.orderdir === 'string' ? sp.orderdir : 'asc';
  const allowedOrderby = ['relevance', 'name', 'price', 'date_add'];
  const orderby = allowedOrderby.includes(orderbyRaw) ? orderbyRaw : 'relevance';
  const orderdir = orderdirRaw === 'desc' ? 'desc' : 'asc';
  const sortKey = `${orderby}-${orderdir}` as SortKey;

  const [{ ids: productIds, total }, filters] = await Promise.all([
    fetchSearchProductIds(query, page, PER_PAGE, activeFilters, orderby, orderdir),
    fetchSearchFilters(query, activeFilters),
  ]);

  const products = productIds.length > 0 ? await fetchProductsByIds(productIds, idLang) : [];
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Construire l'URL de pagination (preserver tous les sp)
  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k === 'page') continue;
      if (typeof v === 'string') params.set(k, v);
      else if (Array.isArray(v)) params.set(k, v.join(','));
    }
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return qs ? `/recherche?${qs}` : '/recherche';
  };

  // Si aucun resultat
  if (total === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 32, textAlign: 'center' }}>
        <p style={{ marginBottom: 16, fontSize: 13 }}>
          <Link href={homeUrl(locale)} style={{ color: '#888', textDecoration: 'none' }}>{t('home')}</Link>
          <span style={{ color: '#ccc', margin: '0 8px' }}>›</span>
          <span style={{ color: '#888' }}>{locale === 'en' ? 'Search' : 'Recherche'}</span>
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
          {locale === 'en' ? `No results for « ${query} »` : `Aucun resultat pour \u00ab ${query} \u00bb`}
        </h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          {locale === 'en'
            ? 'Try other keywords, or browse our categories.'
            : 'Essayez avec d\u2019autres mots-cles, ou parcourez nos categories.'}
        </p>
        <Link href={homeUrl(locale)} style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--or-dark)', color: '#fff', textDecoration: 'none', borderRadius: 4 }}>
          {locale === 'en' ? 'Back to home' : 'Retour a l\u2019accueil'}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p style={{ marginBottom: 16, fontSize: 13 }}>
        <Link href={homeUrl(locale)} style={{ color: '#888', textDecoration: 'none' }}>{t('home')}</Link>
        <span style={{ color: '#ccc', margin: '0 8px' }}>›</span>
        <span style={{ color: '#888' }}>{locale === 'en' ? 'Search' : 'Recherche'}</span>
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        {locale === 'en' ? `Search results for \u00ab ${query} \u00bb` : `Resultats pour \u00ab ${query} \u00bb`}
      </h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        {total} {total > 1 ? t('products') : t('product_singular')} \u2022 {t('page_word')} {page} / {totalPages}
      </p>

      <div className="category-layout" style={{ display: 'grid', gridTemplateColumns: filters.groups.length > 0 ? 'minmax(220px, 250px) 1fr' : '1fr', gap: 32, alignItems: 'start' }}>
        {filters.groups.length > 0 && <FilterSidebar groups={filters.groups} />}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--or-grey-lighter)' }}>
            {filters.groups.length > 0 && <FilterToolbarButton />}
            <SortDropdown current={sortKey} mode="search" />
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
                    <th style={{ padding: 8, textAlign: 'left' }}>Ref</th>
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
            <Link href={buildPageUrl(page - 1)} style={{ padding: '8px 16px', border: '1px solid var(--or-grey-lighter)', borderRadius: 4, textDecoration: 'none', color: 'var(--or-text)' }}>
              \u2190 Precedent
            </Link>
          ) : null}
          <span style={{ color: '#666', fontSize: 14 }}>Page {page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={buildPageUrl(page + 1)} style={{ padding: '8px 16px', border: '1px solid var(--or-grey-lighter)', borderRadius: 4, textDecoration: 'none', color: 'var(--or-text)' }}>
              Suivant \u2192
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  );
}
