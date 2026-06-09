'use client';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';

export default function VoucherForm() {
  const { cart, applyVoucher, removeVoucher } = useCart();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const applied = cart?.vouchers_applied ?? [];

  const handleApply = async () => {
    if (!code.trim()) return;
    setPending(true);
    setError('');
    const res = await applyVoucher(code.trim());
    setPending(false);
    if (res.ok) {
      setCode('');
      setOpen(false);
    } else {
      setError(res.error || 'Code invalide');
    }
  };

  return (
    <div>
      {applied.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {applied.map(v => (
            <div key={v.id_cart_rule} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#e8f0ea', borderRadius: 3, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#3f6e51' }}>
                <strong>{v.code}</strong> · {v.name}
              </span>
              <button onClick={() => removeVoucher(v.id_cart_rule)}
                style={{ background: 'none', border: 0, color: '#888', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}>
                retirer
              </button>
            </div>
          ))}
        </div>
      )}

      {!open ? (
        <a onClick={(e) => { e.preventDefault(); setOpen(true); }} href="#"
          style={{ color: '#3f6e51', fontSize: 13, textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Vous avez un code promo ?
        </a>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Entrez votre code"
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', fontSize: 13, borderRadius: 3 }}
              onKeyDown={e => e.key === 'Enter' && handleApply()} />
            <button onClick={handleApply} disabled={pending || !code.trim()}
              style={{ padding: '8px 16px', background: pending ? '#bbb' : '#a3a2a2', color: '#fff', border: 0, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: pending ? 'wait' : 'pointer', borderRadius: 3 }}>
              {pending ? '…' : 'Appliquer'}
            </button>
            <button onClick={() => { setOpen(false); setCode(''); setError(''); }}
              style={{ background: 'none', border: 0, color: '#888', cursor: 'pointer', fontSize: 11, padding: '0 6px' }}>×</button>
          </div>
          {error && <div style={{ marginTop: 6, fontSize: 12, color: '#bf1212' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
