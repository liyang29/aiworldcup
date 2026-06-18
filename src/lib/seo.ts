import { locales, defaultLocale, type Locale } from '@/i18n/config';

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
