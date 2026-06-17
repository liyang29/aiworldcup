import { createClient } from '@/lib/supabase/server';
import StanceBoard, { type Pred } from '@/components/match/StanceBoard';
import ScheduleList, { type SchedMatch } from '@/components/schedule/ScheduleList';
import ModelAvatar from '@/components/ModelAvatar';
import ModelLineChart from '@/components/charts/ModelLineChart';
import { getDictionary, fill } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import {
  IconTrophy,
  IconBallFootball,
  IconChartLine,
  IconClock,
  IconArrowRight,
  IconCalendar,
} from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

const LOCALE_TAG: Record<Locale, string> = { en: 'en-US', zh: 'zh-CN', es: 'es-ES' };

export default async function Home({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const t = dict.home;
  const supabase = createClient();

  // 最近一场未开赛比赛
  const { data: nextData } = await supabase
    .from('matches')
    .select(
      'id, stage, group_label, kickoff_utc, ' +
        'home:home_team_id(name, flag_url), away:away_team_id(name, flag_url)'
    )
    .eq('status', 'scheduled')
    .gt('kickoff_utc', new Date().toISOString())
    .order('kickoff_utc', { ascending: true })
    .limit(1)
    .maybeSingle();
  const next = nextData as any;

  let predictions: Pred[] = [];
  if (next) {
    const { data } = await supabase
      .from('model_predictions')
      .select('pred_home, pred_away, reasoning, points, pred_advance_team_id, model:model_id(name, provider)')
      .eq('match_id', next.id);
    predictions = (data ?? []) as unknown as Pred[];
  }

  // 模型榜（累计积分）
  const { data: allPreds } = await supabase
    .from('model_predictions')
    .select('points, model:model_id(name, provider)');
  const totals = new Map<string, { name: string; provider: string; points: number; settled: boolean }>();
  for (const p of (allPreds ?? []) as any[]) {
    if (!p.model) continue;
    const cur = totals.get(p.model.name) ?? {
      name: p.model.name,
      provider: p.model.provider,
      points: 0,
      settled: false,
    };
    if (p.points != null) {
      cur.points += p.points;
      cur.settled = true;
    }
    totals.set(p.model.name, cur);
  }
  const leaderboard = [...totals.values()].sort((a, b) => b.points - a.points);
  const anySettled = leaderboard.some((m) => m.settled);

  // 折线图真实数据：按"结算比赛日"累计积分 / 命中率（数据不足时组件显示空状态）
  const PALETTE = [
    '#3b82f6', '#f97316', '#22c55e', '#ec4899', '#a855f7',
    '#06b6d4', '#eab308', '#ef4444', '#14b8a6', '#8b5cf6',
  ];
  const { data: settledPreds } = await supabase
    .from('model_predictions')
    .select('points, model:model_id(name), match:match_id(kickoff_utc)')
    .not('points', 'is', null);
  const dateSet = new Set<string>();
  for (const p of (settledPreds ?? []) as any[]) {
    if (p.match?.kickoff_utc) dateSet.add(p.match.kickoff_utc.slice(0, 10));
  }
  const chartDates = [...dateSet].sort();
  const chartLabels = chartDates.map((d) => {
    const [, mo, da] = d.split('-');
    return `${+mo}/${+da}`;
  });
  const byModel = new Map<string, { date: string; points: number }[]>();
  for (const m of leaderboard) byModel.set(m.name, []);
  for (const p of (settledPreds ?? []) as any[]) {
    if (!p.model || !p.match?.kickoff_utc) continue;
    byModel.get(p.model.name)?.push({ date: p.match.kickoff_utc.slice(0, 10), points: p.points ?? 0 });
  }
  const chartSeries = leaderboard.map((m, i) => {
    const arr = byModel.get(m.name) ?? [];
    let cp = 0, ch = 0, ct = 0;
    const points: number[] = [];
    const acc: number[] = [];
    for (const d of chartDates) {
      for (const x of arr.filter((x) => x.date === d)) {
        cp += x.points;
        ct++;
        if (x.points > 0) ch++;
      }
      points.push(cp);
      acc.push(ct ? Math.round((ch / ct) * 100) : 0);
    }
    return { name: m.name, color: PALETTE[i % PALETTE.length], points, acc };
  });

  // 全部赛程（首页底部模块）
  const { data: allMatchesData } = await supabase
    .from('matches')
    .select(
      'id, stage, kickoff_utc, status, home_score, away_score, ' +
        'home:home_team_id(name, flag_url), away:away_team_id(name, flag_url)'
    )
    .order('kickoff_utc', { ascending: true });
  const allMatches = (allMatchesData ?? []) as unknown as SchedMatch[];

  const stageLabel = next ? (dict.match.stages as Record<string, string>)[next.stage] ?? next.stage : '';
  const groupLabel = next?.group_label ? fill(dict.match.groupFmt, { g: next.group_label }) : '';
  const kickoff = next
    ? new Date(next.kickoff_utc).toLocaleString(LOCALE_TAG[locale], {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      {/* Title 介绍 */}
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-mute">
          <IconTrophy size={16} stroke={1.5} /> {t.eyebrow}
        </span>
        <h1 className="mt-3 text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
          {t.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-balance text-base text-body">
          {t.leadBefore}
          <span className="text-sunset">{t.leadHighlight}</span>
          {t.leadAfter}
        </p>
        <p className="mt-3 text-xl font-medium text-sunset">{t.hook}</p>
      </header>

      {/* 下一场 · AI 预测（完整站队板） */}
      {next && (
        <section id="next" className="mt-12 scroll-mt-20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-xl font-medium text-ink">
              <IconBallFootball size={20} /> {t.nextLabel}
            </h2>
            <a
              href={`/${locale}/match/${next.id}`}
              className="inline-flex items-center gap-1 text-sm text-mute hover:text-body"
            >
              {t.viewFull} <IconArrowRight size={15} />
            </a>
          </div>

          <a
            href={`/${locale}/match/${next.id}`}
            className="mb-4 flex items-center justify-center gap-6 rounded-card border border-hairline bg-canvas-card p-5 transition-colors hover:border-mute"
          >
            <TeamMini name={next.home?.name} flag={next.home?.flag_url} />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-medium text-mute">{dict.match.vs}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-mute">
                <IconClock size={12} /> {kickoff}
              </span>
              <span className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mute">
                {stageLabel}
                {groupLabel ? ` · ${groupLabel}` : ''}
              </span>
            </div>
            <TeamMini name={next.away?.name} flag={next.away?.flag_url} />
          </a>

          {predictions.length > 0 && (
            <StanceBoard
              predictions={predictions}
              homeName={next.home?.name ?? '?'}
              awayName={next.away?.name ?? '?'}
              isKnockout={next.stage !== 'group'}
              t={dict.stance}
            />
          )}
        </section>
      )}

      {/* 统计：模型榜 + 图表 */}
      <section id="leaderboard" className="mt-14 grid scroll-mt-20 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-medium text-ink">
            <IconTrophy size={20} /> {t.leaderboard}
          </h2>
          <div className="rounded-card border border-hairline bg-canvas-card p-2">
            {leaderboard.map((m, i) => (
              <div
                key={m.name}
                className="flex items-center gap-3 rounded-card px-3 py-2"
              >
                <span className={`w-5 text-center text-sm ${i === 0 ? 'text-sunset' : 'text-mute'}`}>
                  {i + 1}
                </span>
                <ModelAvatar name={m.name} provider={m.provider} size={28} />
                <span className="flex-1 truncate text-sm text-ink">{m.name}</span>
                <span className="font-mono text-sm text-body">
                  {anySettled ? `${m.points} ${t.ptsUnit}` : '—'}
                </span>
              </div>
            ))}
            {!anySettled && (
              <p className="px-3 py-2 text-center text-xs text-mute">{t.noSettled}</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-medium text-ink">
            <IconChartLine size={20} /> {t.chartTitle}
          </h2>
          <ModelLineChart
            xLabels={chartLabels}
            series={chartSeries}
            emptyText={t.comingSoon}
            t={{ chartPoints: t.chartPoints, chartAccuracy: t.chartAccuracy }}
          />
        </div>
      </section>

      {/* 赛程（首页底部） */}
      <section id="schedule" className="mt-14 scroll-mt-20">
        <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-medium text-ink">
          <IconCalendar size={20} /> {dict.schedule.title}
        </h2>
        <ScheduleList
          matches={allMatches}
          t={dict.schedule}
          locale={locale}
          localeTag={LOCALE_TAG[locale]}
        />
      </section>
    </main>
  );
}

function TeamMini({ name, flag }: { name?: string; flag?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {flag ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt={name ?? ''} className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-hairline text-xs text-mute">
          {name?.slice(0, 2)}
        </div>
      )}
      <span className="text-sm font-medium text-ink">{name}</span>
    </div>
  );
}
