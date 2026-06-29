'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { localeHref } from '@/lib/url-builder';
import { useT } from '@/lib/i18n';

export default function ReinitialiserForm({ locale }: { locale: string }) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const idCustomer = searchParams.get('id') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1px solid #ddd',
    borderRadius: 4, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: '#333', marginBottom: 6,
  };

  // Lien incomplet (token/id absents) : on previent l'utilisateur tout de suite.
  if (!token || !idCustomer) {
    return (
      <div style={{ background: '#fff', padding: 24, border: '1px solid #e5e0d6', borderRadius: 4 }}>
        <div style={{ padding: '12px 14px', background: '#fdeaea', color: '#bf1212', fontSize: 13, borderRadius: 4 }}>
          {t('auth_reset_invalid_link')}
        </div>
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
          <Link href={localeHref('/mot-de-passe-oublie', locale)} style={{ color: '#1a1a1a', fontWeight: 700, textDecoration: 'underline' }}>
            {t('auth_forgot_title')}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    if (password.length < 8) {
      setError(t('auth_password_min'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth_password_mismatch'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/password-reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id_customer: idCustomer, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(localeHref('/connexion', locale));
          router.refresh();
        }, 2000);
        return;
      }
      setError(t('auth_reset_error'));
      setSubmitting(false);
    } catch {
      setError(t('auth_reset_error'));
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ background: '#fff', padding: 24, border: '1px solid #e5e0d6', borderRadius: 4 }}>
        <div style={{ padding: '12px 14px', background: '#eaf6ec', color: '#256a33', fontSize: 13, borderRadius: 4 }}>
          {t('auth_reset_success')}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: 24, border: '1px solid #e5e0d6', borderRadius: 4 }}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 12px', background: '#fdeaea', color: '#bf1212', fontSize: 13, borderRadius: 4 }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password" style={labelStyle}>{t('auth_new_password')}</label>
          <input id="password" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="confirm" style={labelStyle}>{t('auth_confirm_password')}</label>
          <input id="confirm" type="password" required value={confirm}
            onChange={(e) => setConfirm(e.target.value)} style={inputStyle} autoComplete="new-password" />
        </div>
        <button type="submit" disabled={submitting}
          style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? t('auth_resetting') : t('auth_reset_submit')}
        </button>
      </form>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e0d6', textAlign: 'center', fontSize: 13 }}>
        <Link href={localeHref('/connexion', locale)} style={{ color: '#1a1a1a', fontWeight: 700, textDecoration: 'underline' }}>
          {t('auth_back_to_login')}
        </Link>
      </div>
    </div>
  );
}
