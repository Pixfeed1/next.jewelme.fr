'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ConnexionForm({ locale }: { locale: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // POC : pas encore connecté à Presta — placeholder
    setTimeout(() => {
      alert(locale === 'en'
        ? 'Account login will be connected to your PrestaShop in phase 2.'
        : 'La connexion au compte sera reliée à votre PrestaShop en phase 2 de la migration.');
      setSubmitting(false);
    }, 400);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1px solid #ddd',
    borderRadius: 4, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
    background: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: '#333', marginBottom: 6,
  };

  return (
    <div style={{ background: '#fff', padding: 24, border: '1px solid #e5e0d6', borderRadius: 4 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} style={inputStyle}
            autoComplete="email" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label htmlFor="password" style={labelStyle}>
            {locale === 'en' ? 'Password' : 'Mot de passe'}
          </label>
          <input id="password" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} style={inputStyle}
            autoComplete="current-password" />
        </div>
        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <a href="#" style={{ fontSize: 12, color: '#666', textDecoration: 'underline' }}>
            {locale === 'en' ? 'Forgot password?' : 'Mot de passe oublié ?'}
          </a>
        </div>
        <button type="submit" disabled={submitting}
          style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
          {submitting
            ? (locale === 'en' ? 'Connecting...' : 'Connexion...')
            : (locale === 'en' ? 'Sign in' : 'Se connecter')}
        </button>
      </form>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e0d6', textAlign: 'center', fontSize: 13, color: '#666' }}>
        {locale === 'en' ? 'No account yet?' : 'Pas encore de compte ?'}{' '}
        <Link href={`/${locale}/inscription`} style={{ color: '#1a1a1a', fontWeight: 700, textDecoration: 'underline' }}>
          {locale === 'en' ? 'Create one' : 'Inscrivez-vous'}
        </Link>
      </div>
    </div>
  );
}
