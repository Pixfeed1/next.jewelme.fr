'use client';
import Link from 'next/link';
import { PrestaProduct, getProductImageUrl } from '@/lib/presta';
import { productUrl } from '@/lib/url-builder';
import { useLocale } from '@/lib/locale-context';
import ProductPlayButton from './ProductPlayButton';
import ProductBadges from './ProductBadges';
import ProductCardCartButton from './ProductCardCartButton';
import ProductPrice from './ProductPrice';

interface Props { product: PrestaProduct; }

export default function ProductListRow({ product }: Props) {
  const { locale } = useLocale();
  const imageUrl = product.idDefaultImage
    ? getProductImageUrl(product.id, product.idDefaultImage)
    : '';
  const productLink = product.url ?? productUrl(product, locale);
  return (
    <article style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 16, padding: 12, background: '#fff', border: '1px solid var(--or-grey-lighter)', borderRadius: 4, alignItems: 'center' }}>
      <Link href={productLink} style={{ position: 'relative', display: 'block', width: 120, height: 120, background: 'var(--or-bg-soft)' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
        <ProductBadges product={product} />
      </Link>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <Link href={productLink} style={{ color: 'var(--or-text)', textDecoration: 'none' }}>
          <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600, lineHeight: 1.3 }}>{product.name}</h3>
        </Link>
        {product.reference ? <p style={{ fontSize: 12, color: 'var(--or-text-muted)', margin: 0 }}>Réf : {product.reference}</p> : null}
        <p style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 0', color: 'var(--or-text)' }}>
          <ProductPrice id={product.id} defaultPriceWt={product.priceWt} />
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ProductPlayButton productId={product.id} productName={product.name} productLink={productLink} coverUrl={imageUrl} size={42} variant="inline" />
        <ProductCardCartButton idProduct={product.id} name={product.name} price={product.price} />
      </div>
    </article>
  );
}
