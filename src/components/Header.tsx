import Link from 'next/link';
import { fetchShopConfig } from '@/lib/shop-config';
import { getServerT } from '@/lib/i18n';
import { fetchMegaMenu, MegaMenuEntry } from '@/lib/megamenu';
import { mapPrestaUrl } from '@/lib/presta-url-mapper';
import { cookies } from 'next/headers';
import type { Locale } from '@/lib/locale-context';
import { categoryUrl, manufacturerUrl, homeUrl, localeHref } from '@/lib/url-builder';
import CartBadge from './CartBadge';
import LocaleSwitcher from './LocaleSwitcher';
import MobileMenuDrawer from './MobileMenuDrawer';
import SearchBox from './SearchBox';
import AccountMenu from './AccountMenu';

const itemLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '12px 14px',
  color: '#1a1a1a',
  textDecoration: 'none',
  fontSize: 15,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
};

export default async function Header() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr') as Locale;
  const [config, megamenu, t] = await Promise.all([
    fetchShopConfig(),
    fetchMegaMenu(),
    getServerT(),
  ]);
  const { shop } = config;

  return (
    <header id="header" style={{ background: 'var(--or-dark)', color: '#fff' }}>
      {/* Top: logo + search + signin + cart (fond sombre) */}
      <div style={{ padding: '4px 0' }}>
        <div className="header-main-grid" style={{ maxWidth: 1600, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MobileMenuDrawer entries={megamenu.entries} locale={locale} loginLabel={t('login')} />
            <Link href={homeUrl(locale)} style={{ flexShrink: 0, textDecoration: 'none' }}>
              {shop.logo_url ? (
                <>
                  <img src={shop.logo_url} alt={shop.name} className="header-logo-img header-logo-full" style={{ width: 'auto', display: 'block' }} />
                  <img src="/logo-compact.png" alt={shop.name} className="header-logo-img header-logo-compact" style={{ width: 'auto', display: 'none' }} />
                </>
              ) : (
                <span style={{ fontFamily: 'Roboto Condensed', fontWeight: 700, fontSize: 24, color: '#fff' }}>{shop.name}</span>
              )}
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SearchBox placeholder={t('search')} />
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-end' }}>
            <AccountMenu />
            <CartBadge />
            <LocaleSwitcher />
          </div>
        </div>
      </div>

      {/* Barre de recherche mobile (Juno/Discogs) - visible uniquement sur mobile */}
      <div className="header-search-mobile">
        <SearchBox placeholder={t('search')} />
      </div>

      {/* Mega-menu (même couleur sombre, séparé par une ligne fine) */}
      {megamenu.entries.length > 0 ? (
        <nav style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.08)', color: '#1a1a1a', position: 'relative' }}>
          <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 32px' }}>
            <ul className="megamenu-list" style={{ display: 'flex', gap: 0, margin: 0, padding: 0, listStyle: 'none', flexWrap: 'wrap', justifyContent: 'center' }}>
              {megamenu.entries.map((entry) => renderMenuItem(entry, locale))}
            </ul>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function renderMenuItem(entry: MegaMenuEntry, locale: string) {
  const labelChip = entry.label ? (
    <span style={{ marginLeft: 6, padding: '2px 6px', borderRadius: 3, background: entry.label_color || '#e95144', fontSize: 10 }}>{entry.label}</span>
  ) : null;

  if (!entry.has_dropdown) {
    if (entry.link) {
      const isExternal = /^https?:\/\//.test(entry.link) || entry.link_newtab;
      if (isExternal) {
        return (
          <li key={entry.id}>
            <a href={entry.link}
               target={entry.link_newtab ? '_blank' : undefined}
               rel={entry.link_newtab ? 'noopener noreferrer' : undefined}
               className="megamenu-item"
               style={itemLabelStyle}>
              <span>{entry.name}</span>
              {labelChip}
            </a>
          </li>
        );
      }
      return (
        <li key={entry.id}>
          <Link href={mapPrestaUrl(entry.link, locale)}
                className="megamenu-item"
                style={itemLabelStyle}>
            <span>{entry.name}</span>
            {labelChip}
          </Link>
        </li>
      );
    }
    return (
      <li key={entry.id}>
        <span className="megamenu-item" style={itemLabelStyle}>
          <span>{entry.name}</span>
          {labelChip}
        </span>
      </li>
    );
  }

  const dropdownGroups = entry.dropdown ?? [];
  const allCategories = dropdownGroups.flatMap((g) => g.categories ?? []);
  const allManufacturers = dropdownGroups.flatMap((g) => g.manufacturers ?? []);

  return (
    <li key={entry.id} className="megamenu-has-dropdown" style={{ position: 'relative' }}>
      {entry.link ? (
        <Link href={mapPrestaUrl(entry.link, locale)} className="megamenu-item" style={itemLabelStyle}>
          <span>{entry.name}</span>
          {labelChip}
        </Link>
      ) : (
        <span className="megamenu-item" style={{ ...itemLabelStyle, cursor: 'pointer' }}>
          <span>{entry.name}</span>
          {labelChip}
        </span>
      )}
      <div className="megamenu-dropdown" style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        minWidth: 260,
        maxWidth: 340,
        background: '#fff',
        color: 'var(--or-text)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
        padding: '4px 0',
        zIndex: 50,
        display: 'none',
      }}>
        {allCategories.length > 0 ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {allCategories.map((cat) => (
              <li key={'c-' + cat.id}>
                <Link href={cat.url ? mapPrestaUrl(cat.url, locale) : categoryUrl({ id: cat.id, linkRewrite: (cat as any).link_rewrite || cat.name }, locale)}
                      style={{ display: 'block', padding: '10px 16px', color: 'var(--or-text)', textDecoration: 'none', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--or-bg-soft)' }}>
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {allManufacturers.length > 0 ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {allManufacturers.map((m) => (
              <li key={'m-' + m.id}>
                <Link href={m.url ? mapPrestaUrl(m.url, locale) : manufacturerUrl({ id: m.id, name: m.name, linkRewrite: (m as any).link_rewrite }, locale)}
                      style={{ display: 'block', padding: '10px 16px', color: 'var(--or-text)', textDecoration: 'none', fontSize: 13, fontWeight: 500, borderBottom: '1px solid var(--or-bg-soft)' }}>
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
