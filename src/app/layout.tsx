import type { Metadata, Viewport } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PlayerProvider } from '@/lib/player-context';
import { CartProvider } from '@/lib/cart-context';
import CartSidePanel from '@/components/CartSidePanel';
import { cookies } from 'next/headers';
import { LocaleProvider, type Locale } from '@/lib/locale-context';
import PersistentPlayer from '@/components/PersistentPlayer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import BrevoChat from '@/components/BrevoChat';
import NewsletterPopup from '@/components/NewsletterPopup';
import ScrollTopButton from '@/components/ScrollTopButton';
import { fetchShopConfig } from '@/lib/shop-config';
import '@/styles/player.css';
import '@/styles/onlyroots.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1a1a1a',
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchShopConfig();
  return {
    title: `${config.shop.name} — Headless POC`,
    description: 'Démo headless Next.js — POC PixFeed',
    icons: config.shop.favicon_url ? [{ rel: 'icon', url: config.shop.favicon_url }] : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialLocale = (cookieStore.get('locale')?.value === 'en' ? 'en' : 'fr') as Locale;
  const gaId = process.env.NEXT_PUBLIC_GA_ID || '';

  return (
    <html lang={initialLocale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body style={{ margin: 0 }}>
        <LocaleProvider initialLocale={initialLocale}>
          <CartProvider>
            <PlayerProvider>
              <Header />
              <main style={{ width: '100%', maxWidth: 1650, margin: '0 auto', padding: '24px 32px' }}>
                {children}
              </main>
              <Footer />
              <PersistentPlayer />
            </PlayerProvider>
            <CartSidePanel />
          </CartProvider>
        </LocaleProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <BrevoChat />
        <NewsletterPopup />
        <ScrollTopButton />
      </body>
    </html>
  );
}
