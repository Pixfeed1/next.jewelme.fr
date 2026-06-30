'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';
import { useCustomerAddresses, getCartToken, type CustomerAddress } from '@/lib/customer-addresses';

interface Country { id: number; name: string; }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #ddd',
  borderRadius: 4, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.04em', color: '#555', marginBottom: 6,
};

const empty = (firstname = '', lastname = ''): CustomerAddress => ({
  id_address: 0, alias: 'Mon adresse', firstname, lastname,
  address1: '', address2: '', postcode: '', city: '', id_country: 8, phone: '', phone_mobile: '',
});

export default function AccountAddresses() {
  const { user } = useAuth();
  const t = useT();
  const { addresses, loading, reload } = useCustomerAddresses();

  const [countries, setCountries] = useState<Country[]>([]);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/checkout/init')
      .then((r) => r.json())
      .then((d) => setCountries(Array.isArray(d?.countries) ? d.countries : []))
      .catch(() => setCountries([]));
  }, []);

  const startAdd = () => { setError(''); setEditing(empty(user?.firstname, user?.lastname)); };
  const startEdit = (a: CustomerAddress) => { setError(''); setEditing({ ...a }); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/customer-address-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: getCartToken(), ...editing }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditing(null);
        reload();
      } else {
        setError(data.error || t('auth_generic_error'));
      }
    } catch {
      setError(t('auth_generic_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id_address: number) => {
    if (!window.confirm(t('account_confirm_delete'))) return;
    try {
      const res = await fetch('/api/customer-address-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: getCartToken(), id_address }),
      });
      const data = await res.json();
      if (res.ok && data.success) reload();
    } catch { /* ignore */ }
  };

  if (editing) {
    const u = (k: keyof CustomerAddress, v: string | number) => setEditing((a) => (a ? { ...a, [k]: v } : a));
    return (
      <form onSubmit={save} style={{ background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, padding: 24 }}>
        {error && <div style={{ marginBottom: 16, padding: '10px 12px', background: '#fdeaea', color: '#bf1212', fontSize: 13, borderRadius: 4 }}>{error}</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>{t('account_address_alias')}</label>
          <input style={inputStyle} value={editing.alias} onChange={(e) => u('alias', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div><label style={labelStyle}>{t('auth_firstname')}</label><input style={inputStyle} value={editing.firstname} onChange={(e) => u('firstname', e.target.value)} /></div>
          <div><label style={labelStyle}>{t('auth_lastname')}</label><input style={inputStyle} value={editing.lastname} onChange={(e) => u('lastname', e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t('address_field')}</label><input style={inputStyle} value={editing.address1} onChange={(e) => u('address1', e.target.value)} /></div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t('address_line_2')}</label><input style={inputStyle} value={editing.address2} onChange={(e) => u('address2', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, marginBottom: 16 }}>
          <div><label style={labelStyle}>{t('postcode')}</label><input style={inputStyle} value={editing.postcode} onChange={(e) => u('postcode', e.target.value)} /></div>
          <div><label style={labelStyle}>{t('city')}</label><input style={inputStyle} value={editing.city} onChange={(e) => u('city', e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>{t('country')}</label>
          <select style={inputStyle} value={editing.id_country} onChange={(e) => u('id_country', Number(e.target.value))}>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 20 }}><label style={labelStyle}>{t('phone_field')}</label><input style={inputStyle} value={editing.phone} onChange={(e) => u('phone', e.target.value)} /></div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={submitting}
            style={{ padding: '12px 24px', background: '#3f6e51', color: '#fff', border: 0, borderRadius: 4, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? t('account_saving') : t('account_save')}
          </button>
          <button type="button" onClick={() => setEditing(null)}
            style={{ padding: '12px 24px', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>
            {t('account_cancel')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      {loading ? (
        <p style={{ color: '#888', fontSize: 14 }}>…</p>
      ) : addresses.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>{t('account_no_address')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
          {addresses.map((a) => (
            <div key={a.id_address} style={{ background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, padding: '14px 16px', fontSize: 14, lineHeight: 1.5 }}>
              {a.alias && <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.alias}</div>}
              <div>{a.firstname} {a.lastname}</div>
              <div>{a.address1}</div>
              {a.address2 && <div>{a.address2}</div>}
              <div>{a.postcode} {a.city}</div>
              {(a.phone || a.phone_mobile) && <div style={{ color: '#888', marginTop: 4 }}>{a.phone || a.phone_mobile}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => startEdit(a)} style={{ background: 'none', border: 0, color: '#3f6e51', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}>{t('account_edit')}</button>
                <button type="button" onClick={() => remove(a.id_address)} style={{ background: 'none', border: 0, color: '#bf1212', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}>{t('account_delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={startAdd}
        style={{ padding: '12px 24px', background: '#1a1a1a', color: '#fff', border: 0, borderRadius: 4, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}>
        + {t('account_add_address')}
      </button>
    </div>
  );
}
