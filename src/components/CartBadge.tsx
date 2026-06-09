'use client';
import { useCart } from '@/lib/cart-context';

export default function CartBadge() {
  const { cart, openPanel } = useCart();
  const itemCount = cart?.item_count ?? 0;
  const cartTotal = cart?.totals?.total ?? 0;
  const currencySym = cart?.currency?.symbol ?? '€';
  const formatPrice = (n: number) => n.toFixed(2).replace('.', ',') + '\u00a0' + currencySym;

  return (
    <button type="button" onClick={openPanel} className="header-action-link" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <svg width="22" height="22" viewBox="0 0 576 512" fill="currentColor" aria-hidden="true">
          <path d="M576 216v16c0 13.255-10.745 24-24 24h-8l-26.113 182.788C514.509 462.435 494.257 480 470.37 480H105.63c-23.887 0-44.139-17.565-47.518-41.212L32 256h-8c-13.255 0-24-10.745-24-24v-16c0-13.255 10.745-24 24-24h67.341l129.029-193.543a24 24 0 0 1 39.94 26.627L185.882 192h204.236L271.69 15.084a24 24 0 0 1 39.94-26.627L440.659 192H552c13.255 0 24 10.745 24 24zM312 392V280c0-9.4-7.6-17-17-17h-14c-9.4 0-17 7.6-17 17v112c0 9.4 7.6 17 17 17h14c9.4 0 17-7.6 17-17zm-128 0V280c0-9.4-7.6-17-17-17h-14c-9.4 0-17 7.6-17 17v112c0 9.4 7.6 17 17 17h14c9.4 0 17-7.6 17-17zm256 0V280c0-9.4-7.6-17-17-17h-14c-9.4 0-17 7.6-17 17v112c0 9.4 7.6 17 17 17h14c9.4 0 17-7.6 17-17z"/>
        </svg>
        <span style={{ position: 'absolute', top: -6, right: -8, background: 'var(--or-green)', color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{itemCount}</span>
      </span>
      <span>{formatPrice(cartTotal)}</span>
    </button>
  );
}
