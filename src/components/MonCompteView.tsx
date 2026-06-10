'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import { useT } from '@/lib/i18n';
import { localeHref } from '@/lib/url-builder';

export default function MonCompteView() {
  const { user, loading, logout } = useAuth();
  const { locale } = useLocale();
  const t = useT();
  const router = useRouter();

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

  const memberSince = user.date_add
    ? new Date(user.date_add).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid #f0ece4', fontSize: 14 };
  const btnStyle: React.CSSProperties = {
    padding: '12px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, textAlign: 'center',
    textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', border: 0,
  };

  return (
    <div style={{ maxWidth: 640, margin: '20px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>{t('account_title')}</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 15 }}>
        {t('account_hello')} {user.firstname} 👋
      </p>

      <div style={{ background: '#fff', border: '1px solid #e5e0d6', borderRadius: 4, padding: '8px 20px', marginBottom: 24 }}>
        <div style={rowStyle}>
          <span style={{ color: '#888' }}>{t('auth_firstname')} / {t('auth_lastname')}</span>
          <strong>{user.firstname} {user.lastname}</strong>
        </div>
        <div style={rowStyle}>
          <span style={{ color: '#888' }}>Email</span>
          <strong>{user.email}</strong>
        </div>
        {memberSince && (
          <div style={rowStyle}>
            <span style={{ color: '#888' }}>{t('account_member_since')}</span>
            <strong>{memberSince}</strong>
          </div>
        )}
        <div style={{ ...rowStyle, borderBottom: 0 }}>
          <span style={{ color: '#888' }}>Newsletter</span>
          <strong style={{ color: user.newsletter ? '#3f6e51' : '#999' }}>
            {user.newsletter ? t('account_newsletter_on') : t('account_newsletter_off')}
          </strong>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button type="button" disabled title={t('account_coming_soon')}
          style={{ ...btnStyle, background: '#f0f0f0', color: '#888', border: '1px solid #ddd', cursor: 'default' }}>
          {t('account_edit_info')}
        </button>
        <button type="button" disabled title={t('account_coming_soon')}
          style={{ ...btnStyle, background: '#f0f0f0', color: '#888', border: '1px solid #ddd', cursor: 'default' }}>
          {t('account_my_orders')}
        </button>
        <button type="button" onClick={handleLogout}
          style={{ ...btnStyle, background: '#1a1a1a', color: '#fff' }}>
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
