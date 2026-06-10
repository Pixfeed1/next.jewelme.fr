import Link from 'next/link';
import { translations, type TranslationKey } from '@/lib/i18n';
import { homeUrl, localeHref } from '@/lib/url-builder';
import { fetchOrderByCart } from '@/lib/order';
import ClearCartOnPaid from '@/components/ClearCartOnPaid';

type Status = 'done' | 'denied' | 'cancel';

const btnStyle = (bg: string): React.CSSProperties => ({
  display: 'inline-block', padding: '12px 32px', background: bg, color: '#fff',
  textDecoration: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em',
});

export default async function CheckoutConfirmationView({
  locale,
  cartId,
  status,
}: {
  locale: string;
  cartId: number;
  status: Status;
}) {
  const L = locale === 'en' ? 'en' : 'fr';
  const tr = (k: TranslationKey) => translations[L][k] ?? k;

  const order = status === 'done' && cartId ? await fetchOrderByCart(cartId) : null;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px' }}>
      {status === 'done' && (
        <>
          <ClearCartOnPaid />
          <div style={{ background: '#e8f0ea', padding: 32, borderRadius: 4, textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12, color: '#3f6e51' }}>✓</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', color: '#3f6e51' }}>{tr('order_confirmed_title')}</h1>
            <p style={{ margin: '0 0 8px', fontSize: 15, color: '#555' }}>{tr('order_confirmed_text')}</p>
            {order && order.reference && (
              <p style={{ margin: '12px 0 0', fontSize: 15, color: '#333' }}>
                {tr('order_ref')} <strong>{order.reference}</strong>
              </p>
            )}
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#666' }}>{tr('confirmation_email_sent')}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href={homeUrl(locale)} style={btnStyle('#3f6e51')}>{tr('back_to_shop')}</Link>
          </div>
        </>
      )}

      {status === 'denied' && (
        <>
          <div style={{ background: '#fdeaea', padding: 32, borderRadius: 4, textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12, color: '#bf1212' }}>✕</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', color: '#bf1212' }}>{tr('payment_denied_title')}</h1>
            <p style={{ margin: 0, fontSize: 15, color: '#555' }}>{tr('payment_denied_text')}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href={localeHref('/checkout', locale)} style={btnStyle('#3f6e51')}>{tr('try_again')}</Link>
          </div>
        </>
      )}

      {status === 'cancel' && (
        <>
          <div style={{ background: '#fff7e6', padding: 32, borderRadius: 4, textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12, color: '#c77700' }}>⚠</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', color: '#c77700' }}>{tr('payment_cancelled_title')}</h1>
            <p style={{ margin: 0, fontSize: 15, color: '#555' }}>{tr('payment_cancelled_text')}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link href={localeHref('/panier', locale)} style={btnStyle('#a3a2a2')}>{tr('back_to_cart')}</Link>
          </div>
        </>
      )}
    </div>
  );
}
