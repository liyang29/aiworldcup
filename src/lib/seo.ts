import { locales, defaultLocale, type Locale } from '@/i18n/config';

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', zh: 'zh_CN', es: 'es_ES' };

// 统一构造 openGraph + twitter（含 siteName / 大图卡 / 图片）。
// Next metadata 是浅合并：页面一旦设了 openGraph 就会覆盖布局的，所以每页都要显式带全。
// image 省略时（如比赛页）依赖其同目录的 opengraph-image 文件注入图片。
export function ogMeta(
  locale: Locale,
  opts: { siteName: string; title: string; description: string; path: string; image?: string }
) {
  const images = opts.image ? [opts.image] : undefined;
  return {
    openGraph: {
      type: 'website' as const,
      siteName: opts.siteName,
      locale: OG_LOCALE[locale],
      title: opts.title,
      description: opts.description,
      url: `/${locale}${opts.path}`,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: opts.title,
      description: opts.description,
      ...(images ? { images } : {}),
    },
  };
}

// 生成某页的 canonical + 三语 hreflang（含 x-default）。
// subpath 是「无语种前缀」的子路径，如 ''、'/leaderboard'、`/match/${id}`。
// 返回相对路径，由 metadataBase(https://www.predworld.fun) 解析成绝对 URL。
export function altLinks(locale: Locale, subpath: string) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `/${l}${subpath}`;
  languages['x-default'] = `/${defaultLocale}${subpath}`;
  return {
    canonical: `/${locale}${subpath}`,
    languages,
  };
}
