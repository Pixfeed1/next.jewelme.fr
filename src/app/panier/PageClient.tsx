'use client';
import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';
import { getProductImageUrl } from '@/lib/presta';
import { homeUrl, localeHref, productUrl } from '@/lib/url-builder';
import VoucherForm from '@/components/VoucherForm';

export default function CartPage() {
  const { locale } = useLocale();
  const t = useT();
  const { cart, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [maxReachedKey, setMaxReachedKey] = useState<string | null>(null);

  const flashMax = (key: string) => {
    setMaxReachedKey(key);
    setTimeout(() => setMaxReachedKey((k) => (k === key ? null : k)), 2500);
  };

  // Incrémente la quantité en la bornant au stock disponible (ne supprime jamais la ligne).
  const handleIncrease = (id_product: number, currentQty: number, id_attr: number, max?: number) => {
    const key = `${id_product}-${id_attr}`;
    if (typeof max === 'number' && currentQty >= max) {
      flashMax(key); // déjà au max : pas d'appel serveur, juste un feedback
      return;
    }
    const nextQty = typeof max === 'number' ? Math.min(currentQty + 1, max) : currentQty + 1;
    handleUpdate(id_product, nextQty, id_attr);
    if (typeof max === 'number' && nextQty >= max) flashMax(key);
  };
  const fmt = (n: number) => n.toFixed(2).replace('.', ',') + '\u00a0€';

  const handleUpdate = async (id_product: number, qty: number, id_attr: number) => {
    const key = `${id_product}-${id_attr}`;
    if (pendingId) return; // bloque les clics tant qu'une requete est en cours
    setPendingId(key);
    await updateItem(id_product, qty, id_attr);
    setPendingId(null);
  };

  const handleRemove = async (id_product: number, id_attr: number) => {
    const key = `${id_product}-${id_attr}`;
    if (pendingId) return;
    setPendingId(key);
    await removeItem(id_product, id_attr);
    setPendingId(null);
  };
  const displayHt = cart?.totals?.display_ht ?? false;
  const tax = (cart?.totals as { tax?: number } | undefined)?.tax ?? 0;
  const itemCount = cart?.item_count ?? 0;
  const shippingFree = cart && cart.totals.shipping === 0;

  return (
    <div style={{ maxWidth: 720, paddingLeft: 16, paddingRight: 16 }}>
      <p style={{ marginBottom: 20, fontSize: 12, color: '#888' }}>
        <Link href={homeUrl(locale)} style={{ color: '#888', textDecoration: 'none' }}>
          <i className="material-icons" style={{ fontSize: 14, verticalAlign: 'middle' }}>home</i> Accueil
        </Link>
      </p>

      <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        PANIER
      </h1>

      {!cart || cart.items.length === 0 ? (
        <div style={{ padding: 32, background: '#f5f0e8', textAlign: 'center', borderRadius: 2 }}>
          <p style={{ fontSize: 14, color: '#888', margin: '0 0 16px' }}>Votre panier est vide.</p>
          <Link href={homeUrl(locale)} style={{ display: 'inline-block', padding: '10px 22px', background: '#333', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Continuer mes achats
          </Link>
        </div>
      ) : (
        <>
          {/* Items list */}
          <div style={{ borderTop: '1px solid #e5e0d6' }}>
            {[...cart.items].sort((a, b) => a.id_product - b.id_product).map((item) => (
              <div key={`${item.id_product}-${item.id_product_attribute}`}
                className="cart-item-row" style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto auto 80px', gap: 16, padding: '14px 0', borderBottom: '1px solid #e5e0d6', alignItems: 'center' }}>
                {item.image_id ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={getProductImageUrl(item.id_product, item.image_id)} alt={item.name}
                    style={{ width: 70, height: 70, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 70, height: 70, background: '#eee' }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <Link href={item.url ?? productUrl({ id: item.id_product, linkRewrite: item.link_rewrite }, locale)} style={{ fontSize: 12, color: '#444', textDecoration: 'none', lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {item.name}
                  </Link>
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: '#333' }}>
                    {fmt(displayHt ? ((item as unknown as { price?: number }).price ?? item.price_wt) : item.price_wt)}{displayHt ? ' HT' : ''}
                  </div>
                </div>
                {(() => {
                  const key = `${item.id_product}-${item.id_product_attribute}`;
                  const max = typeof item.quantity_available === 'number' ? item.quantity_available : undefined;
                  const atMax = typeof max === 'number' && item.quantity >= max;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => {
                          if (item.quantity <= 1) {
                            if (window.confirm(t('remove_product_confirm'))) {
                              updateItem(item.id_product, 0, item.id_product_attribute);
                            }
                          } else {
                            updateItem(item.id_product, item.quantity - 1, item.id_product_attribute);
                          }
                        }}
                          style={{ width: 32, height: 32, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', padding: 0, fontSize: 16, color: '#666' }}>−</button>
                        <input value={item.quantity} readOnly
                          style={{ width: 40, height: 32, border: '1px solid #ddd', borderLeft: 0, borderRight: 0, textAlign: 'center', fontSize: 14, background: '#fff' }} />
                        <button
                          onClick={() => handleIncrease(item.id_product, item.quantity, item.id_product_attribute, max)}
                          disabled={atMax}
                          title={atMax ? 'Stock maximum atteint' : undefined}
                          style={{ width: 32, height: 32, border: '1px solid #ddd', background: '#fff', cursor: atMax ? 'default' : 'pointer', padding: 0, fontSize: 16, color: atMax ? '#bbb' : '#666' }}>+</button>
                      </div>
                      {maxReachedKey === key && (
                        <span style={{ fontSize: 10, color: '#bf1212', whiteSpace: 'nowrap' }}>Stock maximum atteint</span>
                      )}
                    </div>
                  );
                })()}
                <button onClick={() => removeItem(item.id_product, item.id_product_attribute)} aria-label="Supprimer"
                  style={{ background: 'none', border: 0, color: '#999', cursor: 'pointer', padding: 6 }}>
                  <i className="material-icons" style={{ fontSize: 20 }}>delete_outline</i>
                </button>
                <strong style={{ fontSize: 14, color: '#333', textAlign: 'right', fontWeight: 700 }}>
                  {fmt(displayHt ? ((item as unknown as { total?: number }).total ?? item.total_wt) : item.total_wt)}{displayHt ? ' HT' : ''}
                </strong>
              </div>
            ))}
          </div>

          {/* Continuer mes achats */}
          <div style={{ margin: '20px 0' }}>
            <Link href={homeUrl(locale)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#333', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <i className="material-icons" style={{ fontSize: 16 }}>home</i>
              {t('continue_shopping').toUpperCase()}
            </Link>
          </div>

          {/* Bottom recap box */}
          <div style={{ background: '#f5f0e8', padding: 20 }}>
            <div style={{ background: '#dbe9ed', color: '#2a6580', fontSize: 13, padding: '10px', textAlign: 'center', marginBottom: 16, borderRadius: 2 }}>
              Il y a {itemCount} {itemCount > 1 ? 'articles' : 'article'} dans votre panier.
            </div>

            <div style={{ marginBottom: 16 }}>
              <VoucherForm />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: '#666' }}>{t('subtotal')}{displayHt ? ' HT' : ''}</span>
              <span style={{ color: '#333' }}>{fmt(displayHt ? (cart.totals.subtotal ?? 0) : (cart.totals.subtotal_wt ?? 0))}</span>
            </div>
            {cart.totals.discounts && cart.totals.discounts > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#3f6e51' }}>
                <span>{t('discount')}</span><span>− {fmt(cart.totals.discounts)}</span>
              </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: '#666' }}>{t('shipping')}{displayHt ? ' HT' : ''}</span>
              <span style={{ color: '#333' }}>
                {shippingFree ? 'gratuit' : fmt(displayHt ? ((cart.totals as { shipping_ht?: number }).shipping_ht ?? cart.totals.shipping) : cart.totals.shipping)}
              </span>
            </div>

            {false && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: '#666' }}>TVA</span>
                <span style={{ color: '#333' }}>{fmt(tax)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 8, paddingTop: 12, borderTop: '1px solid #d8d0bf' }}>
              <span>{t('total_ttc')}</span>
              <span>{fmt(cart.totals.total)}</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#888', fontStyle: 'italic', marginTop: 4, marginBottom: 20 }}>
              {(!displayHt && tax > 0) ? `${t('tax_included')} : ${fmt(tax)}` : ''}
            </div>

            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <Link href={localeHref('/checkout', locale)}
                  className="btn-commander" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 32px', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 280, justifyContent: 'center' }}>
                  {locale === 'en' ? 'Checkout' : 'Commander'} <span style={{ fontSize: 16, lineHeight: 1 }}>▸</span>
                </Link>
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              {/* 1. Connexion (client existant) — outline principal */}
              <Link href={`${localeHref('/connexion', locale)}?from=${encodeURIComponent(localeHref('/checkout', locale))}`}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 28px', color: '#3f6e51', background: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', border: '2px solid #3f6e51', borderRadius: 4, minWidth: 280 }}>
                {locale === 'en' ? 'I already have an account' : 'J\'ai déjà un compte'}
              </Link>
              {/* 2. Création de compte — outline secondaire */}
              <Link href={`${localeHref('/inscription', locale)}?from=${encodeURIComponent(localeHref('/checkout', locale))}`}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 28px', color: 'var(--or-text)', background: '#f0f0f0', textDecoration: 'none', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid #ddd', borderRadius: 4, minWidth: 280 }}>
                {locale === 'en' ? 'Create an account' : 'Créer un compte'}
              </Link>
              {/* 3. Commander en tant qu'invité — action principale (green) */}
              <Link href={localeHref('/checkout', locale)}
                className="btn-commander" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 32px', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 280, justifyContent: 'center' }}>
                {locale === 'en' ? 'Checkout as guest' : 'Commander en tant qu\'invité'} <span style={{ fontSize: 16, lineHeight: 1 }}>▸</span>
              </Link>
            </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
