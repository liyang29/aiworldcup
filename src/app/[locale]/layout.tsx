import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', zh: 'zh_CN', es: 'es_ES' };

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  const m = dict.meta;
  return {
    metadataBase: new URL('https://predworld.fun'),
    title: { default: m.homeTitle, template: `%s` },
    description: m.homeDesc,
    applicationName: m.siteName,
    verification: { google: '06dxOsjCYdCkgSiaxqREMdzXdFn_HgLWGkATYKVt77s' },
    openGraph: {
      type: 'website',
      siteName: m.siteName,
      locale: OG_LOCALE[params.locale],
      title: m.homeTitle,
      description: m.homeDesc,
    },
    twitter: {
      card: 'summary_large_image',
      title: m.homeTitle,
      description: m.homeDesc,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const dict = await getDictionary(params.locale);
  return (
    <html lang={params.locale}>
      <body>
        <div className="flex min-h-screen flex-col">
          <SiteHeader locale={params.locale} dict={dict} />
          <div className="flex-1">{children}</div>
          <SiteFooter dict={dict} locale={params.locale} />
        </div>
      </body>
    </html>
  );
}
