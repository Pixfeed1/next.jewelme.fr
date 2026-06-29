import { fetchCrossSell } from '@/lib/headless-api';
import { fetchProductsByIds } from '@/lib/presta';
import { getServerIdLang } from '@/lib/server-locale';
import { getServerT } from '@/lib/i18n';
import ProductCard from './ProductCard';

interface Props {
  productId: number;
}

export default async function ProductCrossSell({ productId }: Props) {
  const { alsoBought, sameCategory } = await fetchCrossSell(productId);
  if (alsoBought.length === 0 && sameCategory.length === 0) return null;

  const idLang = await getServerIdLang();
  const [boughtProducts, categoryProducts] = await Promise.all([
    alsoBought.length > 0 ? fetchProductsByIds(alsoBought, idLang) : Promise.resolve([]),
    sameCategory.length > 0 ? fetchProductsByIds(sameCategory, idLang) : Promise.resolve([]),
  ]);

  const t = await getServerT();

  const sectionStyle = { marginTop: 48, marginBottom: 32 } as const;
  const titleStyle = {
    fontSize: 18,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 16px',
  };
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 100%), 1fr))',
    gap: 12,
  };

  return (
    <>
      {boughtProducts.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={titleStyle}>{t('also_bought_title')}</h2>
          <div style={gridStyle}>
            {boughtProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {categoryProducts.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={titleStyle}>{t('same_category_title')}</h2>
          <div style={gridStyle}>
            {categoryProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
