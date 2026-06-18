import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { locales } from '@/i18n/config';

const BASE = 'https://www.predworld.fun';

// 生成 /sitemap.xml：首页 / 排行榜 / 预测页 + 全部比赛页，每条都列出三语版本（hreflang alternates）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .order('kickoff_utc', { ascending: true });

  const now = new Date();

  // 给某个「无语种前缀的子路径」生成三语 alternates
  const alternates = (subpath: string) => {
    const languages: Record<string, string> = {};
    for (const l of locales) languages[l] = `${BASE}/${l}${subpath}`;
    return { languages };
  };

  const entries: MetadataRoute.Sitemap = [];

  // 静态页：首页 / 排行榜 / 预测页
  const staticPaths: { sub: string; freq: 'hourly' | 'daily'; pri: number }[] = [
    { sub: '', freq: 'hourly', pri: 1 },
    { sub: '/leaderboard', freq: 'daily', pri: 0.7 },
    { sub: '/predict', freq: 'daily', pri: 0.7 },
  ];
  for (const { sub, freq, pri } of staticPaths) {
    for (const l of locales) {
      entries.push({
        url: `${BASE}/${l}${sub}`,
        lastModified: now,
        changeFrequency: freq,
        priority: pri,
        alternates: alternates(sub),
      });
    }
  }

  // 比赛页（×三语）
  for (const m of (matches ?? []) as { id: string }[]) {
    const sub = `/match/${m.id}`;
    for (const l of locales) {
      entries.push({
        url: `${BASE}/${l}${sub}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: alternates(sub),
      });
    }
  }

  return entries;
}
