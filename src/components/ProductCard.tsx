'use client';
import Link from 'next/link';
import { PrestaProduct, getProductImageUrl } from '@/lib/presta';
import { productUrl } from '@/lib/url-builder';
import { useLocale } from '@/lib/locale-context';
import ProductPlayButton from './ProductPlayButton';
import ProductBadges from './ProductBadges';
import ProductCardCartButton from './ProductCardCartButton';

interface Props {
  product: PrestaProduct;
}

export default function ProductCard({ product }: Props) {
  const { locale } = useLocale();
  const imageUrl = product.idDefaultImage
    ? getProductImageUrl(product.id, product.idDefaultImage)
    : '';
  const productLink = productUrl(product, locale);

  return (
    <article className="product-card" style={{ background: '#fff', border: 'none', borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        flexShrink: 0,
        display: 'block',
        background: 'var(--or-bg-soft)',
        overflow: 'hidden',
      }}>
        <Link href={productLink} style={{ position: 'absolute', inset: 0, display: 'block' }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : null}
        </Link>
        <div className="product-card-hover-eye" aria-hidden="true">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7z" fill="#fff" stroke="#3f6e51" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="4.5" fill="#3f6e51"/>
            <circle cx="10.4" cy="11.6" r="1.8" fill="#fff" opacity="0.95"/>
            <circle cx="11.4" cy="12.4" r="1.8" fill="#3f6e51"/>
          </svg>
        </div>
        <ProductBadges product={product} />
      </div>

      <div style={{ padding: '8px 10px 6px', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--or-grey-lighter)', flex: 1 }}>
        <Link href={productLink} style={{ textDecoration: 'none', color: 'var(--or-text)' }}>
          <h3 style={{ fontSize: 11, margin: '6px 0', fontWeight: 500, lineHeight: 1.3, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '3.9em' }}>
            {product.name}
          </h3>
        </Link>
      </div>

      <div style={{
        borderTop: '1px solid var(--or-grey-lighter)',
        padding: '6px 8px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#f1f1f1',
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--or-text)', margin: 0, flex: 1 }}>
          {Number(product.priceWt).toFixed(2)} €
        </p>
        <ProductPlayButton
          productId={product.id}
          productName={product.name}
          productLink={productLink}
          coverUrl={imageUrl}
          size={42}
          variant="inline"
        />
        <ProductCardCartButton idProduct={product.id} name={product.name} price={product.price} quantity={product.quantity} />
      </div>
    </article>
  );
}
