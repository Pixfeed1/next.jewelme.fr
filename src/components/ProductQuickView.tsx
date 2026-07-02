'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PrestaProduct, getProductImageUrl } from '@/lib/presta';
import { productUrl } from '@/lib/url-builder';
import { useLocale } from '@/lib/locale-context';
import { useT, type TranslationKey } from '@/lib/i18n';
import { useCart } from '@/lib/cart-context';
import ProductDetailPrice from './ProductDetailPrice';

interface Props {
  product: PrestaProduct;
  open: boolean;
  onClose: () => void;
}

export default function ProductQuickView({ product, open, onClose }: Props) {
  const { locale } = useLocale();
  const t = useT();
  const { addItem } = useCart();

  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const outOfStock = (product.quantity ?? 0) <= 0;
  const maxQty = product.quantity && product.quantity > 0 ? product.quantity : 99;

  // Reset quantité + focus + scroll-lock + Échap à chaque ouverture
  useEffect(() => {
    if (!open) return;
    setQty(1);
    setAdded(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // focus la croix (entrée dans le dialog)
    const focusTimer = setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const imageUrl = product.idDefaultImage ? getProductImageUrl(product.id, product.idDefaultImage) : '';
  const detailsHref = product.url ?? productUrl(product, locale);
  const conditionLabel = product.condition ? t(`cond_${product.condition}` as TranslationKey) : '';

  const handleAdd = async () => {
    if (pending || outOfStock) return;
    setPending(true);
    const ok = await addItem(product.id, qty);
    setPending(false);
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 1500); }
  };

  const rowLabel: React.CSSProperties = { color: '#888', fontSize: 13, minWidth: 74, display: 'inline-block' };
  const rowValue: React.CSSProperties = { color: 'var(--or-text)', fontSize: 13, fontWeight: 500 };

  return (
    <div className="product-quickview-backdrop" onClick={onClose}>
      <div
        className="product-quickview-card"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="product-quickview-close" onClick={onClose} aria-label={locale === 'en' ? 'Close' : 'Fermer'}>
          <i className="material-icons">close</i>
        </button>

        <div className="product-quickview-media">
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--or-bg-soft)' }} />
          )}
        </div>

        <div className="product-quickview-body">
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.3 }}>{product.name}</h2>

          {product.manufacturerName && (
            <p style={{ margin: '0 0 4px' }}>
              <span style={rowLabel}>{t('label_word')}</span>
              <span style={rowValue}>{product.manufacturerName}</span>
            </p>
          )}
          <p style={{ margin: '0 0 4px' }}>
            <span style={rowLabel}>{t('reference')}</span>
            <span style={rowValue}>{product.reference || '-'}</span>
          </p>
          {conditionLabel && (
            <p style={{ margin: '0 0 4px' }}>
              <span style={rowLabel}>{t('condition_label')}</span>
              <span style={rowValue}>{conditionLabel}</span>
            </p>
          )}

          {product.descriptionShort && (
            <p style={{ color: '#444', lineHeight: 1.6, margin: '14px 0 0', fontSize: 14 }}>
              {product.descriptionShort}
            </p>
          )}

          <div style={{ marginTop: 16 }}>
            <ProductDetailPrice id={product.id} defaultPriceWt={product.priceWt} locale={locale} />
          </div>

          {/* Sélecteur de quantité */}
          {!outOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={rowLabel}>{locale === 'en' ? 'Quantity' : 'Quantité'}</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}
                  aria-label={locale === 'en' ? 'Decrease' : 'Diminuer'}
                  style={{ width: 34, height: 34, border: 0, background: '#f5f5f5', cursor: qty <= 1 ? 'default' : 'pointer', fontSize: 18, lineHeight: 1, color: '#333' }}>−</button>
                <span style={{ minWidth: 40, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}
                  aria-label={locale === 'en' ? 'Increase' : 'Augmenter'}
                  style={{ width: 34, height: 34, border: 0, background: '#f5f5f5', cursor: qty >= maxQty ? 'default' : 'pointer', fontSize: 18, lineHeight: 1, color: '#333' }}>+</button>
              </div>
            </div>
          )}

          {/* Bouton Ajouter au panier (fonctionnel, quantité respectée) */}
          <button type="button" onClick={handleAdd} disabled={pending || outOfStock}
            style={{
              width: '100%', padding: '13px 20px', borderRadius: 4, border: 0,
              background: outOfStock ? '#d6d6d6' : (added ? '#3f6e51' : '#1a1a1a'),
              color: '#fff', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              cursor: outOfStock ? 'default' : (pending ? 'wait' : 'pointer'),
              transition: 'background 0.25s ease',
            }}>
            {outOfStock
              ? t('out_of_stock')
              : added
                ? (locale === 'en' ? '✓ Added' : '✓ Ajouté')
                : (pending ? '…' : t('add_to_cart'))}
          </button>

          <Link href={detailsHref} onClick={onClose}
            style={{ display: 'inline-block', marginTop: 14, fontSize: 13, color: '#3f6e51', fontWeight: 600, textDecoration: 'underline' }}>
            {locale === 'en' ? 'View details' : 'Voir les détails'} →
          </Link>
        </div>
      </div>
    </div>
  );
}
