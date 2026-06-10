'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import { useT } from '@/lib/i18n';
import { localeHref } from '@/lib/url-builder';

export default function AccountMenu() {
  const { user, loading, logout } = useAuth();
  const { locale } = useLocale();
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const linkStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 13,
    textDecoration: 'none', whiteSpace: 'nowrap', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
  };

  // Déconnecté (ou pendant le 1er chargement) : lien "Se connecter"
  if (loading || !user) {
    return (
      <Link href={localeHref('/connexion', locale)} className="header-action-link" style={linkStyle}>
        <i className="material-icons" style={{ fontSize: 22 }}>person</i>
        <span>{t('login')}</span>
      </Link>
    );
  }

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.refresh();
  };

  const itemStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
    fontSize: 13, color: '#333', textDecoration: 'none', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="header-action-link" onClick={() => setOpen(o => !o)} style={linkStyle} aria-expanded={open}>
        <i className="material-icons" style={{ fontSize: 22 }}>person</i>
        <span>{t('account_hello')} {user.firstname}</span>
        <i className="material-icons" style={{ fontSize: 16 }}>{open ? 'expand_less' : 'expand_more'}</i>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid #ddd', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 200, zIndex: 1000 }}>
          <Link href={localeHref('/mon-compte', locale)} onClick={() => setOpen(false)} style={itemStyle}>
            {t('my_account')}
          </Link>
          <button type="button" disabled title={t('account_coming_soon')} style={{ ...itemStyle, color: '#aaa', cursor: 'default' }}>
            {t('account_my_orders')}
          </button>
          <button type="button" onClick={handleLogout} style={{ ...itemStyle, borderTop: '1px solid #eee', color: '#bf1212' }}>
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}
