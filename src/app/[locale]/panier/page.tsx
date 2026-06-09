'use client';
import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useT } from '@/lib/i18n';
import { getProductImageUrl } from '@/lib/presta';
import VoucherForm from '@/components/VoucherForm';

export default function CartPage() {
  const { locale } = useLocale();
  const t = useT();
  const { cart, updateItem, removeItem } = useCart();
  const [pendingId, setPendingId] = useState<string | null>(null);
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
  const tax = cart ? (cart.totals.total - (cart.totals.subtotal ?? 0)) : 0;
  const itemCount = cart?.item_count ?? 0;
  const shippingFree = cart && cart.totals.shipping === 0;

  return (
    <div style={{ maxWidth: 720, paddingLeft: 16, paddingRight: 16 }}>
      <p style={{ marginBottom: 20, fontSize: 12, color: '#888' }}>
        <Link href={`/${locale}`} style={{ color: '#888', textDecoration: 'none' }}>
          <i className="material-icons" style={{ fontSize: 14, verticalAlign: 'middle' }}>home</i> Accueil
        </Link>
      </p>

      <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        PANIER
      </h1>

      {!cart || cart.items.length === 0 ? (
        <div style={{ padding: 32, background: '#f5f0e8', textAlign: 'center', borderRadius: 2 }}>
          <p style={{ fontSize: 14, color: '#888', margin: '0 0 16px' }}>Votre panier est vide.</p>
          <Link href={`/${locale}`} style={{ display: 'inline-block', padding: '10px 22px', background: '#333', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                  <Link href={`/${locale}/produit/${item.id_product}`} style={{ fontSize: 12, color: '#444', textDecoration: 'none', lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {item.name}
                  </Link>
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: '#333' }}>
                    {fmt(item.price_wt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => {
                    if (item.quantity <= 1) {
                      if (window.confirm('Retirer ce produit du panier ?')) {
                        updateItem(item.id_product, 0, item.id_product_attribute);
                      }
                    } else {
                      updateItem(item.id_product, item.quantity - 1, item.id_product_attribute);
                    }
                  }}
                    style={{ width: 32, height: 32, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', padding: 0, fontSize: 16, color: '#666' }}>−</button>
                  <input value={item.quantity} readOnly
                    style={{ width: 40, height: 32, border: '1px solid #ddd', borderLeft: 0, borderRight: 0, textAlign: 'center', fontSize: 14, background: '#fff' }} />
                  <button onClick={() => updateItem(item.id_product, item.quantity + 1, item.id_product_attribute)}
                    style={{ width: 32, height: 32, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', padding: 0, fontSize: 16, color: '#666' }}>+</button>
                </div>
                <button onClick={() => removeItem(item.id_product, item.id_product_attribute)} aria-label="Supprimer"
                  style={{ background: 'none', border: 0, color: '#999', cursor: 'pointer', padding: 6 }}>
                  <i className="material-icons" style={{ fontSize: 20 }}>delete_outline</i>
                </button>
                <strong style={{ fontSize: 14, color: '#333', textAlign: 'right', fontWeight: 700 }}>
                  {fmt(item.total_wt)}
                </strong>
              </div>
            ))}
          </div>

          {/* Continuer mes achats */}
          <div style={{ margin: '20px 0' }}>
            <Link href={`/${locale}`}
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
              <span style={{ color: '#666' }}>{t('subtotal')}</span>
              <span style={{ color: '#333' }}>{fmt(cart.totals.subtotal_wt ?? cart.totals.subtotal ?? 0)}</span>
            </div>
            {cart.totals.discounts && cart.totals.discounts > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#3f6e51' }}>
                <span>{t('discount')}</span><span>− {fmt(cart.totals.discounts)}</span>
              </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span style={{ color: '#666' }}>{t('shipping')}</span>
              <span style={{ color: '#333' }}>
                {shippingFree ? 'gratuit' : fmt(cart.totals.shipping)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 8, paddingTop: 12, borderTop: '1px solid #d8d0bf' }}>
              <span>{t('total_ttc')}</span>
              <span>{fmt(cart.totals.total)}</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#888', fontStyle: 'italic', marginTop: 4, marginBottom: 20 }}>
              {t('tax_included')} : {fmt(tax)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <Link href={`/${locale}/checkout`}
                className="btn-commander" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 32px', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 280, justifyContent: 'center' }}>
                {t('order').toUpperCase()} <span style={{ fontSize: 16, lineHeight: 1 }}>▸</span>
              </Link>
              <Link href={`/${locale}/connexion?redirect=${encodeURIComponent('/' + locale + '/checkout')}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 28px', color: 'var(--or-text)', background: '#f0f0f0', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #ddd', borderRadius: 4, minWidth: 280, justifyContent: 'center' }}>
                {locale === 'en' ? 'I already have an account' : 'J\'ai déjà un compte'}
              </Link>
              <p style={{ fontSize: 12, color: '#888', textAlign: 'center', margin: '4px 0 0' }}>
                {locale === 'en' ? 'Or continue as guest with the button above' : 'Ou continuez en invité avec le bouton ci-dessus'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
