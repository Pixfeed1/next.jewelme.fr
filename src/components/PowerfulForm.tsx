'use client';
import { useEffect, useState } from 'react';
import type { PowerfulForm as PwFormType, PowerfulFormField } from '@/lib/powerful-form';

interface Props { id: number; }

export default function PowerfulForm({ id }: Props) {
  const [form, setForm] = useState<PwFormType | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`/api/powerful-form/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setForm)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ color: '#888', fontSize: 13 }}>Chargement du formulaire…</p>;
  if (!form) return <p style={{ color: '#c00', fontSize: 13 }}>Formulaire indisponible.</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {};
    form.fields.forEach((f) => {
      if (f.required && f.type !== 'separator' && f.type !== 'recaptcha' && !(values[f.name]?.trim())) {
        errs[f.name] = true;
      }
    });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/powerful-form/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_form: id, values, _honey: '' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      setErrorMsg('Erreur reseau');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{ padding: 24, background: '#e8f5e9', border: '1px solid #3f6e51', borderRadius: 4, color: '#1b4d2e' }}
        dangerouslySetInnerHTML={{ __html: form.success }}
      />
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {form.header && (
        <div
          className="typo"
          style={{ marginBottom: 24, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: form.header }}
        />
      )}
      <form onSubmit={handleSubmit}>
        {form.fields.map((f) => (
          <FormField
            key={f.id}
            field={f}
            value={values[f.name] || ''}
            onChange={(v) => { setValues({ ...values, [f.name]: v }); if (errors[f.name]) setErrors({ ...errors, [f.name]: false }); }}
            error={!!errors[f.name]}
          />
        ))}
        {/* Honeypot anti-bot */}
        <input type="text" name="_honey" autoComplete="off" tabIndex={-1} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

        {errorMsg && <p style={{ color: '#d0121a', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>}

        <button type="submit" className="pwf-submit" disabled={submitting}>
          {submitting ? 'Envoi…' : form.send_label}
        </button>
      </form>
      {form.footer && (
        <div style={{ marginTop: 24 }} dangerouslySetInnerHTML={{ __html: form.footer }} />
      )}
    </div>
  );
}

function FormField({ field, value, onChange, error }: { field: PowerfulFormField; value: string; onChange: (v: string) => void; error: boolean }) {
  if (field.type === 'separator') {
    return <hr style={{ border: 0, borderTop: '1px solid #e5e0d6', margin: '16px 0' }} />;
  }
  if (field.type === 'recaptcha') {
    return null;
  }
  const inputClass = `pwf-input${error ? ' error' : ''}`;
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#444' }}>
        {field.label}{field.required && <span style={{ color: '#d0121a', marginLeft: 4 }}>*</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} rows={5} />
      ) : (
        <input className={inputClass} type={field.type === 'email' ? 'email' : 'text'} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && <span style={{ color: '#d0121a', fontSize: 12 }}>Ce champ est requis</span>}
    </div>
  );
}
