'use client';
import { useEffect, useRef } from 'react';

interface Props {
  url: string;
  fields: Record<string, string | number>;
}

/**
 * Construit dynamiquement un formulaire caché vers la page de paiement Paybox
 * (URL publique e-transactions) et le soumet automatiquement au montage.
 */
export default function PayboxRedirectForm({ url, fields }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} action={url} method="POST" style={{ display: 'none' }} aria-hidden="true">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={String(value)} />
      ))}
    </form>
  );
}
