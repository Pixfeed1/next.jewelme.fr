'use client';
import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/locale-context';

const LS_KEY = 'orp-newsletter-popup-dismissed';
const DISMISS_DAYS = 30;
const DELAY_MS = 8000;

export default function NewsletterPopup() {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(LS_KEY);
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (!isNaN(ts) && (Date.now() - ts) < DISMISS_DAYS * 86400000) return;
    }
    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem(LS_KEY, String(Date.now()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(close, 2500);
      }
    } catch (err) {
      console.warn('Newsletter error', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="newsletter-popup-backdrop" onClick={close}>
      <div className="newsletter-popup" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="newsletter-popup-close" onClick={close} aria-label="Fermer">
          <i className="material-icons">close</i>
        </button>
        {success ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <i className="material-icons" style={{ fontSize: 48, color: '#3f6e51' }}>check_circle</i>
            <h3 style={{ margin: '12px 0 4px', fontFamily: 'Roboto Condensed, sans-serif' }}>
              {locale === 'en' ? 'Thank you!' : 'Merci !'}
            </h3>
            <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
              {locale === 'en' ? 'You\'re successfully subscribed.' : 'Votre inscription est confirmée.'}
            </p>
          </div>
        ) : (
          <>
            <h3 style={{ margin: '0 0 8px', fontFamily: 'Roboto Condensed, sans-serif', fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {locale === 'en' ? 'Stay in the loop' : 'Restez informé'}
            </h3>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px' }}>
              {locale === 'en'
                ? 'Subscribe to our newsletter and never miss our new releases.'
                : 'Inscrivez-vous à notre newsletter et ne manquez aucune de nos nouveautés.'}
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={locale === 'en' ? 'Your email' : 'Votre email'}
                style={{ flex: 1, padding: '12px 14px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, fontFamily: 'inherit' }} />
              <button type="submit" disabled={submitting}
                style={{ padding: '0 18px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', cursor: submitting ? 'wait' : 'pointer', letterSpacing: '0.5px' }}>
                {submitting ? '...' : (locale === 'en' ? "I'm in" : "Je m'inscris")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
