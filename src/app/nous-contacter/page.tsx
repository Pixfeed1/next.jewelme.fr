import Link from 'next/link';
import { fetchContactInfo, fetchContactSubjects } from '@/lib/contact';
import ContactForm from '@/components/ContactForm';
import { getServerT } from '@/lib/i18n';
import { headers } from 'next/headers';
import { homeUrl } from '@/lib/url-builder';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact' };

export default async function ContactPage() {
  const h = await headers();
  const locale = h.get('x-locale') === 'en' ? 'en' : 'fr';
  const t = await getServerT();
  const [info, subjects] = await Promise.all([fetchContactInfo(), fetchContactSubjects()]);
  return (
    <div className="contact-page" style={{ maxWidth: 1280 }}>
      <p style={{ marginBottom: 24, fontSize: 13 }}>
        <Link href={homeUrl(locale)} style={{ color: '#888', textDecoration: 'none' }}>{t('home')}</Link>
        <span style={{ color: '#ccc', margin: '0 8px' }}>›</span>
        <span style={{ color: '#888' }}>{t('contact_us')}</span>
      </p>
      <div className="contact-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 280px) minmax(0, 1fr)', gap: 32 }}>
        <aside style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px', color: '#333', borderBottom: '1px solid #e5e0d6', paddingBottom: 12 }}>
            {t('information')}
          </h2>
          {info && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 13, color: '#444' }}>
                <i className="material-icons" style={{ flexShrink: 0, color: '#333', fontSize: 28, lineHeight: 1 }}>place</i>
                <div style={{ lineHeight: 1.5 }}>
                  <strong style={{ display: 'block', marginBottom: 2 }}>{info.name}</strong>
                  {info.address1}<br />
                  {info.postcode} {info.city}<br />
                  {info.country}
                </div>
              </div>
              {info.phone && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 13, color: '#444', alignItems: 'flex-start' }}>
                  <i className="material-icons" style={{ flexShrink: 0, color: '#333', fontSize: 28, lineHeight: 1 }}>phone</i>
                  <span>{t('call_us')} : <strong>{info.phone}</strong></span>
                </div>
              )}
              {info.email && (
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#444', alignItems: 'flex-start' }}>
                  <i className="material-icons" style={{ flexShrink: 0, color: '#333', fontSize: 28, lineHeight: 1 }}>mail</i>
                  <span>
                    {t('email_us')} :<br />
                    <a href={`mailto:${info.email}`} style={{ color: '#3f6e51', textDecoration: 'none' }}>{info.email}</a>
                  </span>
                </div>
              )}
            </>
          )}
        </aside>
        <ContactForm subjects={subjects} />
      </div>
    </div>
  );
}
