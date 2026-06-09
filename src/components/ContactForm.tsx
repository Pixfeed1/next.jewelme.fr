'use client';
import { useState } from 'react';
import { useT } from '@/lib/i18n';
import type { ContactSubject } from '@/lib/contact';

interface Props { subjects: ContactSubject[]; }

export default function ContactForm({ subjects }: Props) {
  const t = useT();
  const [idSubject, setIdSubject] = useState<number>(subjects[0]?.id ?? 0);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {};
    if (!idSubject) errs.subject = true;
    if (!email.trim()) errs.email = true;
    if (!message.trim()) errs.message = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append('id_subject', String(idSubject));
        fd.append('email', email);
        fd.append('message', message);
        fd.append('_honey', '');
        fd.append('file', file);
        res = await fetch('/api/contact/submit', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_subject: idSubject, email, message, _honey: '' }),
        });
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || t('send_error'));
      }
    } catch {
      setErrorMsg(t('network_error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, background: '#e8f5e9', border: '1px solid #3f6e51', borderRadius: 4, color: '#1b4d2e' }}>
        <p style={{ margin: 0 }}>{t('contact_success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e5e0d6', padding: 24, borderRadius: 4 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 24px', color: '#333', borderBottom: '1px solid #e5e0d6', paddingBottom: 12 }}>
        {t('contact_us').toUpperCase()}
      </h2>

      <FormRow label={t('subject')}>
        <select className={`pwf-input pwf-input--contact${errors.subject ? ' error' : ''}`} value={idSubject} onChange={(e) => setIdSubject(parseInt(e.target.value, 10))}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </FormRow>

      <FormRow label={t('email_address')}>
        <input className={`pwf-input pwf-input--contact${errors.email ? ' error' : ''}`} type="email" placeholder={t('your_email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormRow>

      <FormRow label={t('attached_document')} optional>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ fontSize: 13 }} />
      </FormRow>

      <FormRow label={t('message_label')}>
        <textarea className={`pwf-input pwf-input--contact${errors.message ? ' error' : ''}`} placeholder={t('how_can_we_help')} rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
      </FormRow>

      {/* Honeypot anti-bot */}
      <input type="text" name="_honey" autoComplete="off" tabIndex={-1} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

      {errorMsg && <p style={{ color: '#d0121a', fontSize: 13, marginTop: 12 }}>{errorMsg}</p>}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button type="submit" className="pwf-submit" disabled={submitting}>
          {submitting ? t('sending') : t('send')}
        </button>
      </div>
    </form>
  );
}

function FormRow({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'center', marginBottom: 18 }}>
      <label style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#555' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>{children}</div>
        {optional && <span style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>Optional</span>}
      </div>
    </div>
  );
}
