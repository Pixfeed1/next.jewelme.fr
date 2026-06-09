import { fetchShopConfig } from '@/lib/shop-config';
import { getServerT } from '@/lib/i18n';
import { cookies } from 'next/headers';
import { cmsUrl } from '@/lib/url-builder';
import NewsletterForm from './NewsletterForm';

interface SocialInfo {
  label: string;
  color: string;
  iconPath: string;
}

const SOCIAL_ICONS: Record<string, SocialInfo> = {
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    iconPath: 'M13.4 21.5v-8.9h2.9l.4-3.4h-3.3V7c0-1 .3-1.7 1.7-1.7H17V2.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.4h2.9v8.9h3.2z',
  },
  twitter: {
    label: 'X (Twitter)',
    color: '#000000',
    iconPath: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  youtube: {
    label: 'YouTube',
    color: '#FF0000',
    iconPath: 'M23.5 6.2c-.3-1-1.1-1.9-2.1-2.1-1.9-.5-9.4-.5-9.4-.5s-7.5 0-9.4.5C1.6 4.3.8 5.2.5 6.2 0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1.1 1.9 2.1 2.1 1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6z',
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    iconPath: 'M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.5.3 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.5.2-1 .3-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.5-.3-1-.4-2.2-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.5-.2 1-.3 2.2-.4 1.2 0 1.6-.1 4.8-.1zm0-2.2C8.7 0 8.3 0 7.1.1 5.8.1 5 .3 4.2.6c-.8.3-1.5.7-2.2 1.4C1.3 2.7.9 3.4.6 4.2.3 5 .1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.3 2.1.5 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.5 2.9.5 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c1.3-.1 2.1-.3 2.9-.5.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.6.5-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.3-2.1-.5-2.9-.3-.8-.7-1.5-1.4-2.2C21.3 1.3 20.6.9 19.8.6 19 .3 18.2.1 16.9.1 15.7 0 15.3 0 12 0zm0 5.8c-3.4 0-6.2 2.8-6.2 6.2s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2S15.4 5.8 12 5.8zm0 10.2c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm6.4-11.8c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4 1.4-.6 1.4-1.4-.6-1.4-1.4-1.4z',
  },
  pinterest: {
    label: 'Pinterest',
    color: '#E60023',
    iconPath: 'M12 0C5.4 0 0 5.4 0 12c0 5 3.1 9.3 7.6 11-.1-.9-.2-2.4 0-3.4.2-.9 1.4-5.7 1.4-5.7s-.4-.7-.4-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.8-2.3 3.8-5.6 0-2.9-2.1-5-5.1-5-3.5 0-5.5 2.6-5.5 5.3 0 1 .4 2.2.9 2.8.1.1.1.2.1.3-.1.4-.3 1.2-.3 1.4-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.7 0-3.8 2.8-7.3 8-7.3 4.2 0 7.5 3 7.5 7 0 4.2-2.6 7.5-6.3 7.5-1.2 0-2.4-.6-2.8-1.4l-.8 2.9c-.3 1.1-1 2.4-1.5 3.3 1.1.3 2.3.5 3.5.5 6.6 0 12-5.4 12-12S18.6 0 12 0z',
  },
  tiktok: {
    label: 'TikTok',
    color: '#000000',
    iconPath: 'M19.6 6.3c-.6-.4-1.2-.9-1.7-1.5-.8-.9-1.1-1.9-1.2-2.6h-3.3v13.4c0 1.7-1.4 3.1-3.1 3.1S7.2 17.3 7.2 15.6s1.4-3.1 3.1-3.1c.3 0 .6 0 .9.1V9.2c-.3 0-.6-.1-.9-.1-3.5 0-6.4 2.9-6.4 6.4 0 3.5 2.9 6.4 6.4 6.4s6.4-2.9 6.4-6.4V9c1.3.9 2.9 1.5 4.5 1.5V7.2c0-.1-1.4 0-1.6-.9z',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    iconPath: 'M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z',
  },
  rss: {
    label: 'RSS',
    color: '#F26522',
    iconPath: 'M4 4v3c7.2 0 13 5.8 13 13h3C20 11.1 12.9 4 4 4zm0 6v3c3.9 0 7 3.1 7 7h3c0-5.5-4.5-10-10-10zm2 7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  },
  vimeo: {
    label: 'Vimeo',
    color: '#1AB7EA',
    iconPath: 'M23.9 6.4c-.1 2.3-1.7 5.4-4.8 9.4-3.2 4.1-5.8 6.2-8 6.2-1.4 0-2.5-1.2-3.5-3.7L5.7 11.7c-.7-2.5-1.5-3.7-2.3-3.7-.2 0-.8.3-1.9 1L.3 7.4c1.2-1 2.4-2.1 3.5-3.1 1.6-1.4 2.8-2.1 3.6-2.2 1.9-.2 3 1.1 3.5 3.8.5 2.9.8 4.7 1 5.4.6 2.8 1.3 4.2 2 4.2.6 0 1.5-.9 2.7-2.8 1.2-1.8 1.8-3.2 1.9-4.2.1-1.3-.4-1.9-1.4-1.9-.5 0-1 .1-1.5.3.9-3.1 2.7-4.6 5.3-4.5 1.9.1 2.9 1.4 2.9 4z',
  },
};

export default async function Footer() {
  const config = await fetchShopConfig();
  const t = await getServerT();
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr';
  const { shop, social, cms_pages: allCmsPages } = config;
  // Frais de port offert (id=29) non traduit, on le retire du footer
  const cms_pages = allCmsPages.filter((p) => p.id !== 29);
  const socialEntries = Object.entries(social).filter(([_, url]) => !!url);

  return (
    <footer id="footer" style={{ marginTop: 64 }}>
      <div style={{ background: 'var(--or-dark)', color: '#fff', padding: '48px 0 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40 }}>

          {socialEntries.length > 0 && (
            <div>
              <p className="h4" style={{ fontSize: 16, marginBottom: 16, marginTop: 0 }}>{t('contact_us')}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {socialEntries.map(([platform, url]) => {
                  const info = SOCIAL_ICONS[platform] || { label: platform, color: '#666', iconPath: '' };
                  return (
                    <li key={platform}>
                      <a href={url as string} target="_blank" rel="noopener noreferrer" title={info.label}
                        className="social-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: info.color, color: '#fff', textDecoration: 'none' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d={info.iconPath} />
                        </svg>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div>
            <p className="h4" style={{ fontSize: 16, marginBottom: 16, marginTop: 0 }}>{t('newsletter')}</p>
            <NewsletterForm />
            <p style={{ fontSize: 11, color: 'var(--or-grey-light)', marginTop: 8 }}>
              {t('unsubscribe_anytime')}
            </p>
          </div>

          {cms_pages.length > 0 && (
            <div>
              <p className="h4" style={{ fontSize: 16, marginBottom: 16, marginTop: 0 }}>{t('information')}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cms_pages.map((page) => (
                  <li key={page.id}>
                    <a href={cmsUrl({ id: page.id, slug: page.link_rewrite }, locale)}
                      style={{ color: 'var(--or-grey-light)', textDecoration: 'none', fontSize: 14 }}>
                      {page.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(shop.email || shop.phone) && (
            <div>
              <p className="h4" style={{ fontSize: 16, marginBottom: 16, marginTop: 0 }}>Contact</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--or-grey-light)' }}>
                {shop.phone && (
                  <li><a href={`tel:${shop.phone.replace(/\s/g, '')}`} style={{ color: 'inherit', textDecoration: 'none' }}>{shop.phone}</a></li>
                )}
                {shop.email && (
                  <li><a href={`mailto:${shop.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{shop.email}</a></li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--or-dark)', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'center' }}>
          <img src="/img/payment/payment-methods.png" alt="Payment methods" style={{ maxHeight: 24, height: 'auto', width: 'auto' }} />
        </div>
      </div>
      <div style={{ background: 'var(--or-dark)', color: '#fff', padding: '14px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 12 }}>© {new Date().getFullYear()} {shop.name} — {t('all_rights_reserved')}</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--or-grey-light)' }}>
            {t('headless_poc_by')} <a href="https://pixfeed.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--or-grey-light)' }}>PixFeed</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
