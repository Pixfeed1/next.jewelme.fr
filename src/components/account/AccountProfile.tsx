'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';
import { getCartToken } from '@/lib/customer-addresses';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #ddd',
  borderRadius: 4, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.04em', color: '#555', marginBottom: 6,
};

export default function AccountProfile() {
  const { user, refreshUser } = useAuth();
  const t = useT();

  const [firstname, setFirstname] = useState(user?.firstname ?? '');
  const [lastname, setLastname] = useState(user?.lastname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [newsletter, setNewsletter] = useState(!!user?.newsletter);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const emailChanged = !!user && email.trim().toLowerCase() !== user.email.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSaved(false);

    if (newPassword) {
      if (newPassword.length < 8) { setError(t('auth_password_min')); return; }
      if (newPassword !== confirm) { setError(t('auth_password_mismatch')); return; }
    }
    if ((emailChanged || newPassword) && !currentPassword) {
      setError(t('account_pwd_required_change'));
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        token: getCartToken(),
        firstname, lastname, email, newsletter,
      };
      if (newPassword) payload.new_password = newPassword;
      if (emailChanged || newPassword) payload.current_password = currentPassword;

      const res = await fetch('/api/customer-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaved(true);
        setCurrentPassword(''); setNewPassword(''); setConfirm('');
        await refreshUser();
      } else {
        setError(data.error || t('auth_generic_error'));
      }
    } catch {
      setError(t('auth_generic_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, padding: 24 }}>
      {error && (
        <div style={{ marginBottom: 16, padding: '10px 12px', background: '#fdeaea', color: '#bf1212', fontSize: 13, borderRadius: 4 }}>{error}</div>
      )}
      {saved && (
        <div style={{ marginBottom: 16, padding: '10px 12px', background: '#eaf6ec', color: '#256a33', fontSize: 13, borderRadius: 4 }}>{t('account_saved')}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>{t('auth_firstname')}</label>
          <input style={inputStyle} value={firstname} onChange={(e) => setFirstname(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>{t('auth_lastname')}</label>
          <input style={inputStyle} value={lastname} onChange={(e) => setLastname(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Email</label>
        <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 24 }}>
        <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
        {t('auth_newsletter')}
      </label>

      <div style={{ borderTop: '1px solid #e5e0d6', paddingTop: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>{t('account_current_password')}</label>
          <input type="password" style={inputStyle} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>{t('auth_new_password')}</label>
            <input type="password" style={inputStyle} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" placeholder={t('account_new_password_hint')} />
          </div>
          <div>
            <label style={labelStyle}>{t('auth_confirm_password')}</label>
            <input type="password" style={inputStyle} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={submitting}
        style={{ marginTop: 24, padding: '12px 24px', background: '#1a1a1a', color: '#fff', border: 0, borderRadius: 4, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
        {submitting ? t('account_saving') : t('account_save')}
      </button>
    </form>
  );
}
