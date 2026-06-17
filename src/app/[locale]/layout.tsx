import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: '世界杯 AI 预测竞技场',
  description:
    '让主流大模型在 2026 世界杯每场比赛赛前公开预测，按真实结果计分排名。你能赢过 GPT 吗？',
};

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
          <SiteFooter dict={dict} />
        </div>
      </body>
    </html>
  );
}
