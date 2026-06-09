'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function InscriptionForm({ locale }: { locale: string }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      alert(locale === 'en'
        ? 'Account creation will be connected to your PrestaShop in phase 2.'
        : 'La création de compte sera reliée à votre PrestaShop en phase 2 de la migration.');
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
        <div className="checkout-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label htmlFor="firstName" style={labelStyle}>{locale === 'en' ? 'First name' : 'Prénom'}</label>
            <input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} autoComplete="given-name" />
          </div>
          <div>
            <label htmlFor="lastName" style={labelStyle}>{locale === 'en' ? 'Last name' : 'Nom'}</label>
            <input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} autoComplete="family-name" />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password" style={labelStyle}>{locale === 'en' ? 'Password' : 'Mot de passe'}</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
          <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{locale === 'en' ? 'Minimum 8 characters' : 'Minimum 8 caractères'}</p>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#444', cursor: 'pointer' }}>
            <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
            <span>{locale === 'en' ? 'I accept the terms and conditions and the privacy policy.' : 'J\'accepte les conditions générales de vente et la politique de confidentialité.'}</span>
          </label>
        </div>
        <button type="submit" disabled={submitting || !agree}
          style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', cursor: submitting || !agree ? 'not-allowed' : 'pointer',
            opacity: submitting || !agree ? 0.5 : 1 }}>
          {submitting ? (locale === 'en' ? 'Creating...' : 'Création...') : (locale === 'en' ? 'Create my account' : 'Créer mon compte')}
        </button>
      </form>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e0d6', textAlign: 'center', fontSize: 13, color: '#666' }}>
        {locale === 'en' ? 'Already have an account?' : 'Déjà un compte ?'}{' '}
        <Link href={`/${locale}/connexion`} style={{ color: '#1a1a1a', fontWeight: 700, textDecoration: 'underline' }}>
          {locale === 'en' ? 'Sign in' : 'Connectez-vous'}
        </Link>
      </div>
    </div>
  );
}
