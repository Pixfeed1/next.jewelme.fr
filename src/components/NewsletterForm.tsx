'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n';

export default function NewsletterForm() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'already'>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('success');
        setMessage('Merci de votre inscription !');
        setEmail('');
      } else if (data.already) {
        setStatus('already');
        setMessage('Cet email est déjà inscrit.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Erreur lors de l\'inscription.');
      }
    } catch {
      setStatus('error');
      setMessage('Erreur réseau.');
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <form onSubmit={onSubmit} style={{ display: 'flex', maxWidth: 360 }}>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder={t('your_email')} aria-label="Email"
          disabled={status === 'loading'}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: 'none',
            borderRadius: '4px 0 0 4px',
            background: 'rgba(255,255,255,0.95)',
            color: '#333',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          type="submit" disabled={status === 'loading' || !email}
          className="btn-or-green"
          style={{
            borderRadius: '0 4px 4px 0',
            padding: '0 18px',
            cursor: status === 'loading' ? 'wait' : 'pointer',
            opacity: status === 'loading' || !email ? 0.7 : 1,
            border: 'none',
          }}
        >
          {status === 'loading' ? '…' : t('subscribe')}
        </button>
      </form>
      {message && (
        <p style={{
          marginTop: 8,
          fontSize: 12,
          color: status === 'success' ? '#7ed991' : status === 'already' ? '#ddd' : '#ff8888',
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
