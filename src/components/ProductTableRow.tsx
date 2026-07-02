'use client';
import Link from 'next/link';
import { PrestaProduct, getProductImageUrl } from '@/lib/presta';
import { productUrl } from '@/lib/url-builder';
import { useLocale } from '@/lib/locale-context';
import ProductPlayButton from './ProductPlayButton';
import ProductCardCartButton from './ProductCardCartButton';
import ProductPrice from './ProductPrice';

interface Props { product: PrestaProduct; }

export default function ProductTableRow({ product }: Props) {
  const { locale } = useLocale();
  const imageUrl = product.idDefaultImage
    ? getProductImageUrl(product.id, product.idDefaultImage)
    : '';
  const productLink = product.url ?? productUrl(product, locale);
  return (
    <tr style={{ borderBottom: '1px solid var(--or-grey-lighter)' }}>
      <td style={{ padding: 8, width: 48 }}>
        <Link href={productLink} style={{ display: 'block', width: 40, height: 40, background: 'var(--or-bg-soft)' }}>
          {imageUrl ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
        </Link>
      </td>
      <td style={{ padding: 8 }}>
        <Link href={productLink} style={{ color: 'var(--or-text)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
          {product.name}
        </Link>
      </td>
      <td style={{ padding: 8, fontSize: 12, color: 'var(--or-text-muted)' }}>{product.reference}</td>
      <td style={{ padding: 8, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}><ProductPrice id={product.id} defaultPriceWt={product.priceWt} /></td>
      <td style={{ padding: 8, textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <ProductPlayButton productId={product.id} productName={product.name} productLink={productLink} coverUrl={imageUrl} size={32} variant="inline" />
          <ProductCardCartButton idProduct={product.id} name={product.name} price={product.price} />
        </div>
      </td>
    </tr>
  );
}
