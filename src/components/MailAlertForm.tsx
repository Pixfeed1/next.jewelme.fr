'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n';
interface Props {
  idProduct: number;
  productName: string;
}
export default function MailAlertForm({ idProduct, productName }: Props) {
  const t = useT();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/mailalert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id_product: idProduct }),
      });
      const data = await res.json();
      if (data.ok) {
        const msg = data.already
          ? 'Vous êtes déjà inscrit à l\'alerte pour ce produit.'
          : 'Nous vous préviendrons par email dès que ce produit sera de nouveau disponible.';
        setFeedback({ type: 'success', msg });
        setEmail('');
      } else {
        setFeedback({ type: 'error', msg: data.error || 'Erreur, veuillez réessayer.' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Erreur réseau, veuillez réessayer.' });
    } finally {
      setPending(false);
    }
  };
  return (
    <div style={{ marginBottom: 24, padding: 16, background: '#f7f7f7', borderRadius: 4, border: '1px solid var(--or-grey-lighter)' }}>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--or-text)' }}>
        <strong>Prévenez-moi de la disponibilité</strong>
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>
        Indiquez votre email pour être averti dès que <em>{productName}</em> sera de nouveau en stock.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          disabled={pending}
          style={{ flex: '1 1 200px', minWidth: 0, height: 40, padding: '0 12px', border: '1px solid var(--or-grey-lighter)', borderRadius: 4, fontSize: 14, fontFamily: 'inherit' }}
        />
        <button
          type="submit"
          disabled={pending || !email}
          className="btn-mailalert"
          style={{ height: 40, padding: "0 20px", background: "var(--or-dark)", color: "#fff", border: 0, borderRadius: 4, fontSize: 13, fontWeight: 600, transition: "background 0.2s ease", cursor: pending ? 'wait' : 'pointer', opacity: pending || !email ? 0.6 : 1 }}
        >
          {pending ? t('sending') : t('notify_me')}
        </button>
      </form>
      {feedback && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 4, fontSize: 13, background: feedback.type === 'success' ? '#e8f5e9' : '#fde7e7', color: feedback.type === 'success' ? '#1b4d2e' : '#a71212', border: `1px solid ${feedback.type === 'success' ? '#3f6e51' : '#d0121a'}` }}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
