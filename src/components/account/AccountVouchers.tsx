'use client';
import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { useLocale } from '@/lib/locale-context';
import { getCartToken } from '@/lib/customer-addresses';

interface Voucher {
  id_cart_rule?: number;
  code: string;
  name?: string;
  description?: string;
  value?: number;
  reduction_amount?: number;
  reduction_percent?: number;
  date_to?: string;
  [k: string]: unknown;
}

export default function AccountVouchers() {
  const t = useT();
  const { locale } = useLocale();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCartToken();
    if (!token) { setLoading(false); return; }
    let cancelled = false;
    fetch('/api/customer-vouchers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setVouchers(Array.isArray(d) ? d : (Array.isArray(d?.vouchers) ? d.vouchers : []));
      })
      .catch(() => { if (!cancelled) setVouchers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const valueLabel = (v: Voucher): string => {
    if (v.reduction_percent && Number(v.reduction_percent) > 0) return `-${Number(v.reduction_percent)}%`;
    const amount = Number(v.reduction_amount ?? v.value ?? 0);
    if (amount > 0) return `-${amount.toFixed(2).replace('.', ',')} €`;
    return '';
  };
  const fmtDate = (s?: string) => s && !s.startsWith('0000') ? new Date(s).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  if (loading) return <p style={{ color: '#888', fontSize: 14 }}>…</p>;
  if (vouchers.length === 0) return <p style={{ color: '#888', fontSize: 14 }}>{t('account_no_vouchers')}</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
      {vouchers.map((v, i) => {
        const until = fmtDate(v.date_to);
        return (
          <div key={v.id_cart_rule ?? `${v.code}-${i}`} style={{ background: '#fff', border: '1px dashed #3f6e51', borderRadius: 4, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <strong style={{ fontFamily: 'monospace', fontSize: 15, color: '#1a1a1a' }}>{v.code}</strong>
              {valueLabel(v) && <span style={{ fontWeight: 700, color: '#3f6e51' }}>{valueLabel(v)}</span>}
            </div>
            {(v.name || v.description) && <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{v.name || v.description}</div>}
            {until && <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{t('account_voucher_until')} {until}</div>}
          </div>
        );
      })}
    </div>
  );
}
