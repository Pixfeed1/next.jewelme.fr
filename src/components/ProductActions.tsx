'use client';

import ProductPlayButton from './ProductPlayButton';
import { PrestaProduct, getProductImageUrl } from '@/lib/presta';
import { productUrl } from '@/lib/url-builder';
import { useLocale } from '@/lib/locale-context';

interface Props {
  product: PrestaProduct;
}

export default function ProductActions({ product }: Props) {
  const { locale } = useLocale();
  const coverUrl = product.idDefaultImage
    ? getProductImageUrl(product.id, product.idDefaultImage)
    : '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
      <ProductPlayButton
        productId={product.id}
        productName={product.name}
        productLink={productUrl(product, locale)}
        coverUrl={coverUrl}
        size={56}
        variant="inline"
      />
      <span style={{ fontSize: 13, color: 'var(--or-text-muted)' }}>
        Écouter un extrait
      </span>
    </div>
  );
}
