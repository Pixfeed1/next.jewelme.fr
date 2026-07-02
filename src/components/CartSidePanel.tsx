'use client';
import { useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { useLocale } from '@/lib/locale-context';
import { useT } from '@/lib/i18n';
import { getProductImageUrl } from '@/lib/presta';
import { localeHref, productUrl } from '@/lib/url-builder';

export default function CartSidePanel() {
  const { locale } = useLocale();
  const t = useT();
  const { cart, panelOpen, closePanel, removeItem } = useCart();

  useEffect(() => {
    document.body.style.overflow = panelOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen, closePanel]);

  const fmt = (n: number) => n.toFixed(2).replace('.', ',') + '\u00a0' + (cart?.currency?.symbol ?? '€');
  const displayHt = cart?.totals?.display_ht ?? false;
  const tax = cart ? (cart.totals.total - (cart.totals.subtotal ?? 0)) : 0;
  const itemCount = cart?.item_count ?? 0;

  return (
    <>
      <div
        onClick={closePanel}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
          zIndex: 1000,
          opacity: panelOpen ? 1 : 0,
          visibility: panelOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.4s ease, visibility 0.4s ease',
        }}
      />

      <aside
        className="cart-side-panel"
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 360, maxWidth: '92vw', height: '100dvh',
          background: '#f5f0e8',
          zIndex: 1001,
          transform: panelOpen ? 'translate3d(0,0,0)' : 'translate3d(100%,0,0)',
          transition: 'transform 0.5s ease',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        }}
        aria-hidden={!panelOpen}
      >
        {/* Close */}
        <button type="button" onClick={closePanel} aria-label="Fermer"
          style={{ position: 'absolute', top: 11, left: 0, background: 'none', border: 0, padding: 8, cursor: 'pointer', zIndex: 2 }}>
          <i className="material-icons" style={{ fontWeight: 700, fontSize: 22 }}>close</i>
        </button>

        {/* Title */}
        <h3 style={{ padding: '15px 5px', textAlign: 'center', fontSize: 18, margin: 0, fontWeight: 700, letterSpacing: '0.05em', borderBottom: '1px solid #e5e0d6', textTransform: 'uppercase' }}>
          PANIER
        </h3>

        {/* Items list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!cart || cart.items.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', fontSize: 14, marginTop: 32 }}>
              {t('empty_cart')}
            </p>
          ) : (
            <>
              {[...cart.items].sort((a, b) => a.id_product - b.id_product).map((item) => (
                <div key={`${item.id_product}-${item.id_product_attribute}`}
                  style={{ display: 'grid', gridTemplateColumns: '80px 1fr 32px', gap: 12, padding: '14px 16px', borderBottom: '1px solid #e5e0d6', alignItems: 'flex-start' }}>
                  {item.image_id ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getProductImageUrl(item.id_product, item.image_id)}
                      alt={item.name}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2 }}
                    />
                  ) : (
                    <div style={{ width: 80, height: 80, background: '#eee', borderRadius: 2 }} />
                  )}

                  <div style={{ minWidth: 0 }}>
                    <a href={item.url ?? productUrl({ id: item.id_product, linkRewrite: item.link_rewrite }, locale)} onClick={closePanel}
                      style={{ fontSize: 13, color: '#666', textDecoration: 'none', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.name}
                    </a>
                    <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: '#bf1212' }}>
                      {fmt(item.total_wt / item.quantity)} <span style={{ color: '#666', fontSize: 13, fontWeight: 400 }}>x {item.quantity}</span>
                    </div>
                  </div>

                  <button onClick={() => removeItem(item.id_product, item.id_product_attribute)} aria-label="Supprimer"
                    style={{ background: 'none', border: 0, color: '#999', cursor: 'pointer', padding: 4, alignSelf: 'flex-start' }}>
                    <i className="material-icons" style={{ fontSize: 20 }}>delete_outline</i>
                  </button>
                </div>
              ))}

              {/* Info bar */}
              <div style={{ background: '#dbe9ed', color: '#2a6580', fontSize: 13, padding: '10px', margin: '12px 16px', borderRadius: 2, textAlign: 'center' }}>
                {itemCount > 1 ? t('cart_count_plural').replace('{{n}}', String(itemCount)) : t('cart_count_singular')}
              </div>
            </>
          )}
        </div>

        {/* Footer (totals + COMMANDER) */}
        {cart && cart.items.length > 0 && (
          <div style={{ padding: '16px', borderTop: '1px solid #e5e0d6', background: '#f5f0e8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: '#666' }}>{t('subtotal')}</span>
              <span style={{ color: '#333' }}>{fmt(displayHt ? (cart.totals.subtotal ?? 0) : (cart.totals.subtotal_wt ?? 0))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: '#666' }}>Livraison</span>
              <span style={{ color: '#333' }}>{fmt(cart.totals.shipping)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, padding: '8px 0 4px', borderTop: '1px solid #e5e0d6', marginTop: 4 }}>
              <span>{displayHt ? 'Total HT' : t('total_ttc')}</span>
              <span>{fmt(cart.totals.total)}</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#888', fontStyle: 'italic', marginBottom: 14 }}>
              {displayHt ? `TVA : ${fmt(tax)}` : `TVA incluse plus frais d'envoi : ${fmt(tax)}`}
            </div>

            <a href={localeHref('/panier', locale)} onClick={closePanel}
              className="btn-commander" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 28px', color: '#fff', borderRadius: 4, textDecoration: 'none', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 auto', justifyContent: 'center' }}>
              {t('order')} <span style={{ fontSize: 16, lineHeight: 1 }}>▸</span>
            </a>
            
          </div>
        )}
      </aside>
    </>
  );
}
