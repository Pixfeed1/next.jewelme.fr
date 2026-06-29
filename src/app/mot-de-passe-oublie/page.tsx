export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { Locale } from '@/lib/locale-context';
import { getServerT } from '@/lib/i18n';
import MotDePasseOublieForm from './MotDePasseOublieForm';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default async function MotDePasseOubliePage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr') as Locale;
  const t = await getServerT();

  return (
    <div style={{ maxWidth: 460, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>{t('auth_forgot_title')}</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>{t('auth_forgot_intro')}</p>
      <MotDePasseOublieForm locale={locale} />
    </div>
  );
}
