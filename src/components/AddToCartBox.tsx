'use client';
import { useState } from 'react';
import type { PrestaProduct } from '@/lib/presta';
import { useCart } from '@/lib/cart-context';
import { trackAddToCart } from '@/lib/gtag';

interface Props {
  product: PrestaProduct;
}

export default function AddToCartBox({ product }: Props) {
  const outOfStock = (product.quantity ?? 0) <= 0;
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const { addItem } = useCart();

  const handleAdd = async () => {
    if (outOfStock) return;
    setPending(true);
    setFeedback(null);
    const ok = await addItem(product.id, qty);
    setPending(false);
    if (ok) {
      trackAddToCart({ id: product.id, name: product.name, price: product.price }, qty);
      setFeedback({ type: 'success', msg: `${qty} × ajouté au panier` });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', msg: "Impossible d'ajouter au panier" });
    }
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 24, flexWrap: 'wrap', maxWidth: 400 }}>
      <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--or-grey-lighter)', borderRadius: 4, overflow: 'hidden', height: 44 }}>
        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuer"
          style={{ width: 36, border: 0, background: '#fff', color: 'var(--or-text)', fontSize: 18, cursor: 'pointer', padding: 0 }}>−</button>
        <input type="number" min={1} value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
          style={{ width: 48, textAlign: 'center', border: 0, borderLeft: '1px solid var(--or-grey-lighter)', borderRight: '1px solid var(--or-grey-lighter)', fontSize: 14, fontFamily: 'inherit', appearance: 'textfield', MozAppearance: 'textfield' }}
        />
        <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Augmenter"
          style={{ width: 36, border: 0, background: '#fff', color: 'var(--or-text)', fontSize: 18, cursor: 'pointer', padding: 0 }}>+</button>
      </div>
      <button type="button" onClick={handleAdd} disabled={pending || outOfStock} className="btn-add-cart"
        style={{ appearance: 'none', minWidth: 200, height: 44, border: 0, padding: '0 24px', background: outOfStock ? '#888' : '#a3a2a2', color: '#fff', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', cursor: pending ? 'wait' : 'pointer', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s ease, box-shadow 0.2s ease', opacity: pending ? 0.7 : 1 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 6h15l-2 9H8L6 6z" />
          <path d="M6 6l-1.5-2" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="18" cy="19" r="1" />
        </svg>
        {outOfStock ? 'Indisponible' : (pending ? 'Ajout…' : 'Ajouter au panier')}
      </button>
      {feedback && (
        <div style={{ flexBasis: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 4, fontSize: 13, background: feedback.type === 'success' ? '#e8f5e9' : '#fde7e7', color: feedback.type === 'success' ? '#1b4d2e' : '#a71212', border: `1px solid ${feedback.type === 'success' ? '#3f6e51' : '#d0121a'}` }}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
