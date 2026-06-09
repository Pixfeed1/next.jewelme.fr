import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { Locale } from '@/lib/locale-context';
import InscriptionForm from './InscriptionForm';

export const metadata: Metadata = { title: 'Inscription' };

export default async function InscriptionPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr') as Locale;

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
        {locale === 'en' ? 'Create an account' : 'Créer un compte'}
      </h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        {locale === 'en'
          ? 'Sign up to enjoy faster checkout, order tracking and exclusive offers.'
          : 'Inscrivez-vous pour un paiement plus rapide, le suivi de vos commandes et des offres exclusives.'}
      </p>
      <InscriptionForm locale={locale} />
    </div>
  );
}
