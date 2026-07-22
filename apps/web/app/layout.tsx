import type { Metadata } from 'next';
import { Inter, Sora, JetBrains_Mono } from 'next/font/google';
import { SkipToContent } from '@/components/a11y/skip-to-content';
import { ConsentBanner } from '@/components/marketing/consent-banner';
import { GlobalFooter } from '@/components/carmo/global-footer';
import { GlobalNav } from '@/components/carmo/global-nav';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { Toaster } from '@/components/ui/sonner';
import { resolveMetadataBase } from '@/lib/seo/site-origin';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/structured-data';
import { getCurrentCity } from '@/lib/cities';
import { isMobileAppRequest } from '@/lib/runtime/mobile-app';
import { cn } from '@/lib/utils';
import { ChatWidget } from '@/components/chat/chat-widget';
import { WebViewHydrationProbe } from '@/components/debug/webview-hydration-probe';
import { HimetricaAnalytics } from '@/components/analytics/himetrica-analytics';
import { RouteProgress } from '@/components/navigation/route-progress';
import { PageTransition } from '@/components/navigation/page-transition';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['500', '600', '800'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: 'Portal Carmelitano — Carmo do Rio Claro/MG, Furnas e Canastra',
    template: '%s | Portal Carmelitano',
  },
  description:
    'Portal hiperlocal de Carmo do Rio Claro/MG: comércio, turismo na região de Furnas e Canastra, eventos, imóveis, classificados, serviços públicos e transparência municipal.',
  applicationName: 'Portal Carmelitano',
  keywords: [
    'Carmo do Rio Claro',
    'Carmo do Rio Claro MG',
    'Furnas',
    'Canastra',
    'Lago de Furnas',
    'turismo Furnas',
    'pousadas Furnas',
    'comércio local',
    'agenda Carmo do Rio Claro',
    'imóveis Carmo do Rio Claro',
    'classificados Carmo do Rio Claro',
  ],
  authors: [{ name: 'Portal Carmelitano' }],
  creator: 'Portal Carmelitano',
  publisher: 'Portal Carmelitano',
  category: 'local',
  openGraph: {
    title: 'Portal Carmelitano — Carmo do Rio Claro/MG',
    description:
      'Tudo de Carmo do Rio Claro num só lugar: turismo na Furnas e Canastra, comércio, eventos, imóveis, serviços e transparência.',
    siteName: 'Portal Carmelitano',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal Carmelitano',
    description: 'Portal hiperlocal de Carmo do Rio Claro/MG.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [city, embeddedApp] = await Promise.all([getCurrentCity(), isMobileAppRequest()]);

  return (
    <html
      lang="pt-BR"
      data-app={embeddedApp ? 'embedded' : 'web'}
      data-embedded-app={embeddedApp ? 'true' : undefined}
      className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <meta charSet="utf-8" />
      </head>
      <body
        className={cn(
          'flex min-h-full flex-col overflow-x-clip bg-paper font-sans text-ink-900',
          embeddedApp
            ? 'pb-0'
            : 'pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0',
        )}
      >
        <SkipToContent />
        <RouteProgress />
        <JsonLdScript data={organizationJsonLd()} />
        <JsonLdScript data={websiteJsonLd()} />
        {embeddedApp ? null : (
          <div data-hide-in-embedded-app>
            <GlobalNav />
          </div>
        )}
        <div id="conteudo-principal">
          <PageTransition embeddedApp={embeddedApp}>{children}</PageTransition>
        </div>
        {embeddedApp ? null : <GlobalFooter cityName={city?.name} />}
        <div id="carmo-floating-root" />
        {city && !embeddedApp ? (
          <div data-hide-in-embedded-app>
            <ChatWidget cityName={city.name} />
          </div>
        ) : null}
        {embeddedApp ? null : (
          <div data-hide-in-embedded-app>
            <ConsentBanner />
          </div>
        )}
        <HimetricaAnalytics />
        <WebViewHydrationProbe />
        <Toaster />
      </body>
    </html>
  );
}
