import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { Locale } from '@/lib/locale-context';
import { getServerT } from '@/lib/i18n';
import ConnexionForm from './ConnexionForm';

export const metadata: Metadata = { title: 'Connexion' };

export default async function ConnexionPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr') as Locale;
  const t = await getServerT();

  return (
    <div style={{ maxWidth: 460, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>{t('login')}</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        {locale === 'en'
          ? 'Sign in to access your account, orders and wishlist.'
          : 'Connectez-vous pour accéder à votre compte, vos commandes et votre liste de souhaits.'}
      </p>
      <ConnexionForm locale={locale} />
    </div>
  );
}
