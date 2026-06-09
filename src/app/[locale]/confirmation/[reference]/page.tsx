import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductImageUrl } from '@/lib/presta';
import TrackPurchase from '@/components/TrackPurchase';

const PRESTA_API_URL = process.env.PRESTA_API_URL || 'https://www.onlyroots-reggae.com';
const PRESTA_API_KEY = process.env.PRESTA_API_KEY || 'FHREYMY1XYM8UBZW2EIJ7WUQWT36TBQG';

interface Item { id_product: number; name: string; reference: string; quantity: number; price_wt: number; total_wt: number; image_id: number | null; }
interface OrderData {
  id_order: number; reference: string; date_add: string; payment: string;
  total_paid: number; total_products: number; total_shipping: number; total_tax: number;
  currency: { iso: string; symbol: string };
  customer: { email: string; firstname: string; lastname: string };
  delivery_address: any; invoice_address: any;
  carrier: { id: number; name: string };
  items: Item[];
}

async function fetchOrder(reference: string): Promise<OrderData | null> {
  try {
    const r = await fetch(`${PRESTA_API_URL.replace('/api','')}/headless/order?reference=${encodeURIComponent(reference)}&ws_key=${PRESTA_API_KEY}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export default async function ConfirmationPage({ params }: { params: Promise<{ locale: string;  reference: string }> }) {
  const { locale, reference } = await params;
  const order = await fetchOrder(reference);
  if (!order || !order.reference) notFound();

  const fmt = (n: number) => n.toFixed(2).replace('.', ',') + '\u00a0' + (order!.currency.symbol || '€');
  const date = new Date(order!.date_add).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
      <TrackPurchase reference={order!.reference} total={order!.total_paid} items={order!.items} />
      <div style={{ background: '#e8f0ea', padding: 32, borderRadius: 4, textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px', color: '#3f6e51' }}>Merci pour votre commande !</h1>
        <p style={{ margin: 0, fontSize: 15, color: '#555' }}>
          Commande <strong>{order!.reference}</strong> · {date}
        </p>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: '#666' }}>
          Un email de confirmation a été envoyé à <strong>{order!.customer.email}</strong>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, padding: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>Livraison</h3>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
            <strong>{order!.delivery_address.firstname} {order!.delivery_address.lastname}</strong><br />
            {order!.delivery_address.company && <>{order!.delivery_address.company}<br /></>}
            {order!.delivery_address.address1}<br />
            {order!.delivery_address.address2 && <>{order!.delivery_address.address2}<br /></>}
            {order!.delivery_address.postcode} {order!.delivery_address.city}<br />
            {order!.delivery_address.country}<br />
            <span style={{ color: '#666' }}>{order!.delivery_address.phone}</span>
          </p>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#666' }}>Transporteur : <strong>{order!.carrier.name}</strong></p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, padding: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>Paiement</h3>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
            <strong>{order!.payment}</strong><br />
            <span style={{ color: '#666' }}>Vous recevrez les instructions par email pour finaliser le règlement.</span>
          </p>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, padding: 20, marginBottom: 32 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>Articles commandés</h3>
        {order!.items.map(item => (
          <div key={item.id_product} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0ece4', alignItems: 'center' }}>
            {item.image_id ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={getProductImageUrl(item.id_product, item.image_id)} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover' }} />
            ) : <div style={{ width: 60, height: 60, background: '#eee' }} />}
            <div style={{ fontSize: 13, color: '#444' }}>
              {item.name}<br /><span style={{ fontSize: 12, color: '#888' }}>{item.reference && `Réf. ${item.reference} · `}Quantité : {item.quantity}</span>
            </div>
            <strong style={{ fontSize: 14 }}>{fmt(item.total_wt)}</strong>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0' }}>
          <span style={{ color: '#666' }}>Sous-total</span><span>{fmt(order!.total_products)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
          <span style={{ color: '#666' }}>Livraison</span><span>{fmt(order!.total_shipping)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginTop: 8, paddingTop: 12, borderTop: '1px solid #e5e0d6' }}>
          <span>Total payé</span><span style={{ color: '#bf1212' }}>{fmt(order!.total_paid)}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href={`/${locale}`} style={{ display: 'inline-block', padding: '12px 32px', background: '#3f6e51', color: '#fff', textDecoration: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
