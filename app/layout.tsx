import type { Metadata } from 'next';
import { IBM_Plex_Sans, Space_Grotesk } from 'next/font/google';

import { AppProviders } from '@/components/providers/app-providers';
import { PwaRegister } from '@/components/pwa-register';
import { SiteNav } from '@/components/site-nav';

import './globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700'],
});

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'fishbitecast.com',
  description: 'Freshwater fishing forecast score by location, weather, and moon phase.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'fishbitecast.com',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        <AppProviders>
          <PwaRegister />
          <div className="page-shell">
            <header className="site-header">
              <div className="brand-block">
                <span className="brand-mark" aria-hidden>
                  <img src="/images/image2.png" alt="" className="brand-logo" />
                </span>
                <div>
                  <p className="brand-kicker">Freshwater Forecast</p>
                  <h1 className="site-title">fishbitecast.com</h1>
                  <p className="brand-subtitle">Forecast clarity for freshwater anglers</p>
                </div>
              </div>
              <SiteNav />
            </header>
            <main className="main-content">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
