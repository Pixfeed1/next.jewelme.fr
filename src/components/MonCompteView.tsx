'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import { useT, type TranslationKey } from '@/lib/i18n';
import { localeHref } from '@/lib/url-builder';
import AccountProfile from '@/components/account/AccountProfile';
import AccountOrders from '@/components/account/AccountOrders';
import AccountAddresses from '@/components/account/AccountAddresses';
import AccountVouchers from '@/components/account/AccountVouchers';

type Tab = 'profile' | 'orders' | 'addresses' | 'vouchers';

const TABS: { key: Tab; label: TranslationKey }[] = [
  { key: 'profile', label: 'account_tab_profile' },
  { key: 'orders', label: 'account_tab_orders' },
  { key: 'addresses', label: 'account_tab_addresses' },
  { key: 'vouchers', label: 'account_tab_vouchers' },
];

export default function MonCompteView() {
  const { user, loading, logout } = useAuth();
  const { locale } = useLocale();
  const t = useT();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');

  useEffect(() => {
    if (!loading && !user) {
      const from = encodeURIComponent(localeHref('/mon-compte', locale));
      router.replace(`${localeHref('/connexion', locale)}?from=${from}`);
    }
  }, [loading, user, locale, router]);

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>…</div>;
  }
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.replace(localeHref('/connexion', locale));
    router.refresh();
  };

  return (
    <div style={{ maxWidth: 820, margin: '20px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>{t('account_title')}</h1>
          <p style={{ color: '#666', marginBottom: 16, fontSize: 15 }}>
            {t('account_hello')} {user.firstname} 👋
          </p>
        </div>
        <button type="button" onClick={handleLogout}
          style={{ padding: '10px 18px', borderRadius: 4, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', border: 0, background: '#1a1a1a', color: '#fff' }}>
          {t('logout')}
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid #e5e0d6', marginBottom: 24 }}>
        {TABS.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            style={{
              padding: '10px 16px', border: 0, background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
              color: tab === key ? '#1a1a1a' : '#999',
              borderBottom: tab === key ? '2px solid #1a1a1a' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {t(label)}
          </button>
        ))}
      </div>

      {tab === 'profile' && <AccountProfile />}
      {tab === 'orders' && <AccountOrders />}
      {tab === 'addresses' && <AccountAddresses />}
      {tab === 'vouchers' && <AccountVouchers />}
    </div>
  );
}
