'use client';
import { useState } from 'react';
import Link from 'next/link';
import { localeHref } from '@/lib/url-builder';
import { useT } from '@/lib/i18n';

export default function MotDePasseOublieForm({ locale }: { locale: string }) {
  const t = useT();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/auth/password-reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
    // Reponse generique quoi qu'il arrive (anti-enumeration)
    setDone(true);
    setSubmitting(false);
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
      {done ? (
        <>
          <div style={{ padding: '12px 14px', background: '#eaf6ec', color: '#256a33', fontSize: 13, borderRadius: 4 }}>
            {t('auth_forgot_done')}
          </div>
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
            <Link href={localeHref('/connexion', locale)} style={{ color: '#1a1a1a', fontWeight: 700, textDecoration: 'underline' }}>
              {t('auth_back_to_login')}
            </Link>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
            </div>
            <button type="submit" disabled={submitting}
              style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', color: '#fff',
                border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.05em', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? t('auth_forgot_sending') : t('auth_forgot_submit')}
            </button>
          </form>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e0d6', textAlign: 'center', fontSize: 13 }}>
            <Link href={localeHref('/connexion', locale)} style={{ color: '#1a1a1a', fontWeight: 700, textDecoration: 'underline' }}>
              {t('auth_back_to_login')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
