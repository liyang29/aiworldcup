import 'server-only';
import type { Locale } from './config';
import en from './dictionaries/en.json';

export type Dictionary = typeof en;

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  zh: () => import('./dictionaries/zh.json').then((m) => m.default as Dictionary),
  es: () => import('./dictionaries/es.json').then((m) => m.default as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return (loaders[locale] ?? loaders.en)();
}

// 简单占位替换：t("{n} 看好 {team}", { n: 5, team: "France" })
export function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
