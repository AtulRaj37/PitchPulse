import type { Metadata } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import SmoothScroll from '@/components/SmoothScroll';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const clashDisplay = Outfit({
  subsets: ['latin'],
  variable: '--font-clash',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PitchPulse | Hyper-Local Cricket Scoring',
  description: 'The ultimate cricket scoring and tournament management platform for local tournaments, gully cricket, and professional leagues.',
  keywords: ['cricket', 'scoring', 'tournament', 'match', 'sports', 'live score'],
  authors: [{ name: 'PitchPulse Team' }],
  creator: 'PitchPulse',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pitchpulse.com',
    siteName: 'PitchPulse',
    title: 'PitchPulse | Hyper-Local Cricket Scoring',
    description: 'The ultimate cricket scoring and tournament management platform.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PitchPulse | Hyper-Local Cricket Scoring',
    description: 'The ultimate cricket scoring and tournament management platform.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icons/logo-only.png',
    apple: '/icons/logo-only.png',
  },
};

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${clashDisplay.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-zinc-950 antialiased">
        <Providers>
          <SmoothScroll>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster />
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}
