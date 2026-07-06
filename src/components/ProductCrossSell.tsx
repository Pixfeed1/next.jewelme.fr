import { fetchCrossSell } from '@/lib/headless-api';
import { fetchProductsByIds } from '@/lib/presta';
import { getServerIdLang } from '@/lib/server-locale';
import { getServerT } from '@/lib/i18n';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import type { SliderConfig } from '@/lib/headless-api';

const crossSellSlider: SliderConfig = {
  enabled: true,
  autoplay: true,
  columns_desktop: 6,
  limit: 12,
  mobile: { enabled: true, limit: 12 },
};

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

  return (
    <>
      {boughtProducts.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={titleStyle}>{t('also_bought_title')}</h2>
          <ProductCarousel products={boughtProducts} config={crossSellSlider} />
        </section>
      )}

      {categoryProducts.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={titleStyle}>{t('same_category_title')}</h2>
          <ProductCarousel products={categoryProducts} config={crossSellSlider} />
        </section>
      )}
    </>
  );
}
