'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { localeHref, homeUrl } from '@/lib/url-builder';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';

export default function ConnexionForm({ locale }: { locale: string }) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const from = searchParams.get('from') || homeUrl(locale);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    const res = await login(email, password);
    if (res.success) {
      router.push(from);
      router.refresh();
    } else {
      setError(t('auth_invalid_credentials'));
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
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label htmlFor="password" style={labelStyle}>{t('auth_password')}</label>
          <input id="password" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" />
        </div>
        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#aaa' }} title={t('account_coming_soon')}>
            {t('auth_forgot_password')}
          </span>
        </div>
        <button type="submit" disabled={submitting}
          style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? t('auth_signing_in') : t('auth_sign_in')}
        </button>
      </form>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e0d6', textAlign: 'center', fontSize: 13, color: '#666' }}>
        {t('auth_no_account')}{' '}
        <Link href={`${localeHref('/inscription', locale)}${from ? `?from=${encodeURIComponent(from)}` : ''}`} style={{ color: '#1a1a1a', fontWeight: 700, textDecoration: 'underline' }}>
          {t('auth_register_link')}
        </Link>
      </div>
    </div>
  );
}
