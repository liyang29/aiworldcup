// 支持的语种。加新语种：在这里加 code + 建对应 dictionaries/<code>.json 即可。
export const locales = ['en', 'zh', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
};
