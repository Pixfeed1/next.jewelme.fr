'use client';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useT } from '@/lib/i18n';
import { trackAddToCart } from '@/lib/gtag';

interface Props {
  idProduct: number;
  name?: string;
  price?: number;
  quantity?: number;
}

export default function ProductCardCartButton({ idProduct, name, price, quantity = 1 }: Props) {
  const outOfStock = quantity <= 0;
  const { addItem } = useCart();
  const t = useT();
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending || outOfStock) return;
    setPending(true);
    const ok = await addItem(idProduct, 1);
    setPending(false);
    if (ok) {
      if (name !== undefined && price !== undefined) {
        trackAddToCart({ id: idProduct, name, price }, 1);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
    }
  };

  return (
    <button
      type="button"
      className="product-card-cart-btn"
      onClick={handleClick}
      disabled={pending || outOfStock}
      aria-label={outOfStock ? t('out_of_stock') : t('add_to_cart')}
      title={outOfStock ? t('out_of_stock') : t('add_to_cart')}
      style={{
        width: 42, height: 42,
        color: outOfStock ? '#888' : '#fff',
        border: 'none',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        background: outOfStock ? '#eeeeee' : (success ? '#3f6e51' : '#a3a2a2'),
        cursor: outOfStock ? 'default' : (pending ? 'wait' : 'pointer'),
        transition: 'background 0.25s ease',
      }}
    >
      {success ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={outOfStock ? "#888" : "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 6h15l-2 9H8L6 6z" />
          <path d="M6 6l-1.5-2" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="18" cy="19" r="1" />
        </svg>
      )}
    </button>
  );
}
