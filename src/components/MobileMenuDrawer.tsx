'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLocale, LOCALES } from '@/lib/locale-context';
import { categoryUrl, manufacturerUrl, localeHref } from '@/lib/url-builder';
import { mapPrestaUrl } from '@/lib/presta-url-mapper';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';
import type { MegaMenuEntry } from '@/lib/megamenu';

interface Props {
  entries: MegaMenuEntry[];
  locale: string;
  loginLabel: string;
}

export default function MobileMenuDrawer({ entries, locale, loginLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const { locale: currentLocale, setLocale: setLocaleCtx } = useLocale();
  const { user, logout } = useAuth();
  const t = useT();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => { setOpen(false); setExpanded(null); };

  return (
    <>
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setOpen(true)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <i className="material-icons" style={{ fontSize: 28, color: '#fff' }}>menu</i>
      </button>

      {open && <div className="mobile-menu-backdrop" onClick={close} />}

      <aside className={`mobile-menu-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">Menu</span>
          <button type="button" onClick={close} aria-label="Fermer">
            <i className="material-icons" style={{ fontSize: 28, color: '#fff' }}>close</i>
          </button>
        </div>

        <form action={localeHref('/recherche', locale)} method="GET" className="mobile-menu-search" onSubmit={close}>
          <input type="text" name="s" placeholder="Rechercher..." aria-label="Rechercher" />
          <button type="submit" aria-label="Rechercher">
            <i className="material-icons">search</i>
          </button>
        </form>

        <nav className="mobile-menu-nav">
          {user ? (
            <>
              <Link href={localeHref('/mon-compte', locale)} onClick={close} className="mobile-menu-link mobile-menu-account">
                <i className="material-icons">person</i>
                <span>{t('account_hello')} {user.firstname}</span>
              </Link>
              <button type="button" className="mobile-menu-link" onClick={async () => { await logout(); close(); }}
                style={{ background: 'none', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer', color: '#bf1212' }}>
                {t('logout')}
              </button>
            </>
          ) : (
            <Link href={localeHref('/connexion', locale)} onClick={close} className="mobile-menu-link mobile-menu-account">
              <i className="material-icons">person</i>
              <span>{loginLabel}</span>
            </Link>
          )}

          <div className="mobile-menu-divider" />

          {entries.map((entry) => {
            const hasDropdown = entry.has_dropdown && entry.dropdown && entry.dropdown.length > 0;
            const dropdownGroups = entry.dropdown ?? [];
            const allCategories = dropdownGroups.flatMap((g) => g.categories ?? []);
            const allManufacturers = dropdownGroups.flatMap((g) => g.manufacturers ?? []);
            const isOpen = expanded === entry.id;

            if (!hasDropdown) {
              if (entry.link) {
                const isExternal = /^https?:\/\//.test(entry.link) || entry.link_newtab;
                if (isExternal) {
                  return (
                    <a key={entry.id} href={entry.link} className="mobile-menu-link"
                       target={entry.link_newtab ? '_blank' : undefined}
                       rel={entry.link_newtab ? 'noopener noreferrer' : undefined}
                       onClick={close}>
                      {entry.name}
                    </a>
                  );
                }
                return (
                  <Link key={entry.id} href={mapPrestaUrl(entry.link, locale)} className="mobile-menu-link" onClick={close}>
                    {entry.name}
                  </Link>
                );
              }
              return <span key={entry.id} className="mobile-menu-link">{entry.name}</span>;
            }

            return (
              <div key={entry.id} className="mobile-menu-group">
                <button type="button" className="mobile-menu-link mobile-menu-group-toggle"
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                  aria-expanded={isOpen}>
                  <span>{entry.name}</span>
                  <i className="material-icons">{isOpen ? 'expand_less' : 'expand_more'}</i>
                </button>
                {isOpen && (
                  <div className="mobile-menu-children">
                    {entry.link && (
                      <Link href={mapPrestaUrl(entry.link, locale)} className="mobile-menu-sublink" onClick={close}>
                        → Tout voir
                      </Link>
                    )}
                    {allCategories.map((cat) => (
                      <Link key={'c-' + cat.id}
                        href={cat.url ? mapPrestaUrl(cat.url, locale) : categoryUrl({ id: cat.id, linkRewrite: (cat as any).link_rewrite || cat.name }, locale)}
                        className="mobile-menu-sublink" onClick={close}>
                        {cat.name}
                      </Link>
                    ))}
                    {allManufacturers.map((m) => (
                      <Link key={'m-' + m.id}
                        href={m.url ? mapPrestaUrl(m.url, locale) : manufacturerUrl({ id: m.id, name: m.name, linkRewrite: (m as any).link_rewrite }, locale)}
                        className="mobile-menu-sublink" onClick={close}>
                        {m.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mobile-menu-locale">
          <span className="mobile-menu-locale-label">Langue / Language</span>
          <div className="mobile-menu-locale-buttons">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => { setLocaleCtx(l.code); close(); }}
                className={`mobile-menu-locale-btn${l.code === currentLocale ? ' active' : ''}`}
              >
                <span aria-hidden="true">{l.code === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
