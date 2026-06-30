'use client';
import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { useLocale } from '@/lib/locale-context';
import { getCartToken } from '@/lib/customer-addresses';
import { getProductImageUrl } from '@/lib/presta';

interface OrderRow {
  id_order: number;
  reference: string;
  date_add: string;
  total_paid: number;
  state?: string;
  order_state?: string;
  current_state_name?: string;
  status?: string;
  has_invoice?: boolean;
  has_credit_slip?: boolean;
  [k: string]: unknown;
}

interface OrderItem { id_product: number; name: string; reference?: string; quantity: number; total_wt: number; image_id: number | null; }
interface OrderDetail {
  id_order: number; reference: string; date_add: string; payment?: string;
  total_paid: number; total_products?: number; total_shipping?: number;
  currency?: { symbol: string };
  delivery_address?: Record<string, string>;
  carrier?: { name: string };
  items?: OrderItem[];
}

function stateLabel(o: OrderRow): string {
  return String(o.current_state_name || o.order_state || o.state || o.status || '');
}

async function downloadPdf(endpoint: string, id_order: number, filename: string) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: getCartToken(), id_order }),
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('pdf')) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch { /* ignore */ }
}

export default function AccountOrders() {
  const t = useT();
  const { locale } = useLocale();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, OrderDetail | 'loading'>>({});

  useEffect(() => {
    const token = getCartToken();
    if (!token) { setLoading(false); return; }
    let cancelled = false;
    fetch('/api/customer-orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list: OrderRow[] = Array.isArray(d) ? d : (Array.isArray(d?.orders) ? d.orders : []);
        setOrders(list);
      })
      .catch(() => { if (!cancelled) setOrders([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggleDetail = async (id_order: number) => {
    if (openId === id_order) { setOpenId(null); return; }
    setOpenId(id_order);
    if (!details[id_order]) {
      setDetails((d) => ({ ...d, [id_order]: 'loading' }));
      try {
        const res = await fetch('/api/customer-order-detail', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: getCartToken(), id_order }),
        });
        const data = await res.json();
        setDetails((d) => ({ ...d, [id_order]: data?.success === false ? { id_order, reference: '', date_add: '', total_paid: 0 } : (data.order || data) }));
      } catch {
        setDetails((d) => ({ ...d, [id_order]: { id_order, reference: '', date_add: '', total_paid: 0 } }));
      }
    }
  };

  const fmt = (n: number, sym = '€') => (Number(n) || 0).toFixed(2).replace('.', ',') + ' ' + sym;
  const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  if (loading) return <p style={{ color: '#888', fontSize: 14 }}>…</p>;
  if (orders.length === 0) return <p style={{ color: '#888', fontSize: 14 }}>{t('account_no_orders')}</p>;

  const linkBtn: React.CSSProperties = { background: 'none', border: '1px solid #ddd', borderRadius: 4, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#333' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.map((o) => {
        const detail = details[o.id_order];
        const isOpen = openId === o.id_order;
        return (
          <div key={o.id_order} style={{ background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{o.reference}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{fmtDate(o.date_add)}{stateLabel(o) ? ` · ${stateLabel(o)}` : ''}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#bf1212' }}>{fmt(o.total_paid)}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={linkBtn} onClick={() => toggleDetail(o.id_order)}>{t('account_order_detail')}</button>
                <button type="button" style={linkBtn} onClick={() => downloadPdf('/api/customer-invoice-pdf', o.id_order, `facture-${o.reference || o.id_order}.pdf`)}>{t('account_download_invoice')}</button>
                {o.has_credit_slip ? (
                  <button type="button" style={linkBtn} onClick={() => downloadPdf('/api/customer-credit-slip-pdf', o.id_order, `avoir-${o.reference || o.id_order}.pdf`)}>{t('account_download_credit_slip')}</button>
                ) : null}
              </div>
            </div>

            {isOpen && (
              <div style={{ borderTop: '1px solid #f0ece4', padding: '14px 16px', background: '#faf8f4' }}>
                {detail === 'loading' || !detail ? (
                  <p style={{ color: '#888', fontSize: 13, margin: 0 }}>…</p>
                ) : (
                  <>
                    {(detail.items ?? []).map((item, i) => (
                      <div key={`${item.id_product}-${i}`} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0ece4', alignItems: 'center' }}>
                        {item.image_id ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={getProductImageUrl(item.id_product, item.image_id)} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover' }} />
                        ) : <div style={{ width: 48, height: 48, background: '#eee' }} />}
                        <div style={{ fontSize: 13, color: '#444' }}>{item.name}<br /><span style={{ fontSize: 12, color: '#999' }}>x {item.quantity}</span></div>
                        <strong style={{ fontSize: 13 }}>{fmt(item.total_wt, detail.currency?.symbol)}</strong>
                      </div>
                    ))}
                    {detail.delivery_address && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 12, lineHeight: 1.5 }}>
                        <strong>{detail.delivery_address.firstname} {detail.delivery_address.lastname}</strong><br />
                        {detail.delivery_address.address1}{detail.delivery_address.address2 ? `, ${detail.delivery_address.address2}` : ''}<br />
                        {detail.delivery_address.postcode} {detail.delivery_address.city}
                        {detail.carrier?.name ? <><br />{detail.carrier.name}</> : null}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 12, paddingTop: 10, borderTop: '1px solid #e5e0d6' }}>
                      <span>{t('account_order_total')}</span><span style={{ color: '#bf1212' }}>{fmt(detail.total_paid, detail.currency?.symbol)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
