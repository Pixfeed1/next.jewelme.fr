'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { localeHref, homeUrl } from '@/lib/url-builder';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';

export default function InscriptionForm({ locale }: { locale: string }) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const from = searchParams.get('from') || homeUrl(locale);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    if (password.length < 8) { setError(t('auth_password_min')); return; }
    if (password !== confirm) { setError(t('auth_password_mismatch')); return; }
    setSubmitting(true);
    const res = await register({ email, password, firstname: firstName, lastname: lastName, newsletter });
    if (res.success) {
      router.push(from);
      router.refresh();
    } else {
      setError(res.error === 'email_taken' ? t('auth_email_taken') : t('auth_generic_error'));
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1px solid #ddd',
    borderRadius: 4, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: '#333', marginBottom: 6,
  };

  return (
    <div style={{ background: '#fff', padding: 24, border: '1px solid #e5e0d6', borderRadius: 4 }}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 12px', background: '#fdeaea', color: '#bf1212', fontSize: 13, borderRadius: 4 }}>
            {error}
          </div>
        )}
        <div className="checkout-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label htmlFor="firstName" style={labelStyle}>{t('auth_firstname')}</label>
            <input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} autoComplete="given-name" />
          </div>
          <div>
            <label htmlFor="lastName" style={labelStyle}>{t('auth_lastname')}</label>
            <input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} autoComplete="family-name" />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password" style={labelStyle}>{t('auth_password')}</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
          <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{t('auth_password_min')}</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="confirm" style={labelStyle}>{t('auth_confirm_password')}</label>
          <input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} autoComplete="new-password" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#444', cursor: 'pointer' }}>
            <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
            <span>{t('auth_newsletter')}</span>
          </label>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#444', cursor: 'pointer' }}>
            <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
            <span>{t('auth_accept_terms')}</span>
          </label>
        </div>
        <button type="submit" disabled={submitting || !agree}
          style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', cursor: submitting || !agree ? 'default' : 'pointer',
            opacity: submitting || !agree ? 0.5 : 1 }}>
          {submitting ? t('auth_creating') : t('auth_create_account')}
        </button>
      </form>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e0d6', textAlign: 'center', fontSize: 13, color: '#666' }}>
        {t('auth_have_account')}{' '}
        <Link href={`${localeHref('/connexion', locale)}${from ? `?from=${encodeURIComponent(from)}` : ''}`} style={{ color: '#1a1a1a', fontWeight: 700, textDecoration: 'underline' }}>
          {t('auth_login_link')}
        </Link>
      </div>
    </div>
  );
}
