import { fetchCrossSellIds } from '@/lib/headless-api';
import { fetchProductsByIds } from '@/lib/presta';
import { getServerIdLang } from '@/lib/server-locale';
import { getServerT } from '@/lib/i18n';
import ProductCard from './ProductCard';
interface Props {
  productId: number;
}
export default async function ProductCrossSell({ productId }: Props) {
  const ids = await fetchCrossSellIds(productId);
  if (ids.length === 0) return null;
  const idLang = await getServerIdLang();
  const products = await fetchProductsByIds(ids, idLang);
  if (products.length === 0) return null;
  const t = await getServerT();
  return (
    <section style={{ marginTop: 48, marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
        {t('cross_sell_title')}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
