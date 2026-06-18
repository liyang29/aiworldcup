import { createClient } from '@/lib/supabase/server';
import StanceBoard, { type Pred } from '@/components/match/StanceBoard';
import ScheduleList, { type SchedMatch } from '@/components/schedule/ScheduleList';
import ModelAvatar, { logoFor } from '@/components/ModelAvatar';
import ModelLineChart from '@/components/charts/ModelLineChart';
import LocalTime from '@/components/LocalTime';
import CollapsibleStance from '@/components/CollapsibleStance';
import ScoringRules from '@/components/ScoringRules';
import HumanBoard from '@/components/HumanBoard';
import { fetchHumanBoard } from '@/lib/leaderboard';
import { getDictionary, fill } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import {
  IconTrophy,
  IconBallFootball,
  IconChartLine,
  IconClock,
  IconCalendar,
  IconScale,
  IconArrowRight,
  IconUser,
} from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

const LOCALE_TAG: Record<Locale, string> = { en: 'en-US', zh: 'zh-CN', es: 'es-ES' };

export default async function Home({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const t = dict.home;
  const supabase = createClient();

  // 每场被预测了几个模型（首页只展示"有 AI 预测"的比赛，避免顶上空比赛）
  const { data: predMatchRows } = await supabase
    .from('model_predictions')
    .select('match_id');
  const predCount = new Map<string, number>();
  for (const r of (predMatchRows ?? []) as any[]) {
    predCount.set(r.match_id, (predCount.get(r.match_id) ?? 0) + 1);
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
    return { name: m.name, color: PALETTE[i % PALETTE.length], points, acc, logo: logoFor(m.name) };
  });

  // 全部赛程（首页底部模块），并复用来挑首页展示的两场
  const { data: allMatchesData } = await supabase
    .from('matches')
    .select(
      'id, stage, group_label, kickoff_utc, status, home_score, away_score, ' +
        'home:home_team_id(name, flag_url), away:away_team_id(name, flag_url)'
    )
    .order('kickoff_utc', { ascending: true });
  const allMatches = (allMatchesData ?? []) as unknown as SchedMatch[];

  // 人类榜（首页精简版：Top5 + 我的排名）
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { rows: humanRows, myRank } = await fetchHumanBoard(supabase, 10, user?.id ?? null);

  // 首页固定展示「一前一后」两场——都必须有 AI 预测：
  //   upcoming = 有预测的下一场即将开赛（紧凑卡，赛前邀请用户预测）
  //   recent   = 有预测的最近一场进行中/刚结束（完整站队板 + 真实比分）
  const nowMs = Date.now();
  const predicted = allMatches.filter((m) => predCount.has(m.id)) as any[];
  const upcoming = predicted.find((m) => new Date(m.kickoff_utc).getTime() > nowMs) ?? null;
  const pastPredicted = predicted.filter((m) => new Date(m.kickoff_utc).getTime() <= nowMs);
  const recent = pastPredicted.length ? pastPredicted[pastPredicted.length - 1] : null;

  let recentPreds: Pred[] = [];
  if (recent) {
    const { data } = await supabase
      .from('model_predictions')
      .select('pred_home, pred_away, reasoning, points, pred_advance_team_id, model:model_id(name, provider)')
      .eq('match_id', recent.id);
    recentPreds = (data ?? []) as unknown as Pred[];
  }

  let upcomingPreds: Pred[] = [];
  if (upcoming) {
    const { data } = await supabase
      .from('model_predictions')
      .select('pred_home, pred_away, reasoning, points, pred_advance_team_id, model:model_id(name, provider)')
      .eq('match_id', upcoming.id);
    upcomingPreds = (data ?? []) as unknown as Pred[];
  }

  const matchLabel = (m: any) => {
    const s = (dict.match.stages as Record<string, string>)[m.stage] ?? m.stage;
    const g = m.group_label ? fill(dict.match.groupFmt, { g: m.group_label }) : '';
    return g ? `${s} · ${g}` : s;
  };

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
        <a
          href={`/${locale}/predict`}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-sunset px-7 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
        >
          {t.cta} <IconArrowRight size={16} />
        </a>
      </header>

      {/* 一前一后：即将开赛（紧凑卡） + 最近进行中/刚结束（完整站队板+真实比分） */}
      {(upcoming || recent) && (
        <section id="next" className="mt-12 scroll-mt-20 space-y-10">
          {/* 即将开赛 → 紧凑卡 + 「完整预测」下拉展开站队板 */}
          {upcoming && (
            <div>
              <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-medium text-ink">
                <IconBallFootball size={20} /> {t.upcomingLabel}
              </h2>

              <a
                href={`/${locale}/match/${upcoming.id}`}
                className="flex items-center justify-center gap-6 rounded-card border border-hairline bg-canvas-card p-5 transition-colors hover:border-mute"
              >
                <TeamMini name={upcoming.home?.name} flag={upcoming.home?.flag_url} />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-medium text-mute">{dict.match.vs}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-mute">
                    <IconClock size={12} />{' '}
                    <LocalTime
                      utc={upcoming.kickoff_utc}
                      localeTag={LOCALE_TAG[locale]}
                      options={{
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZoneName: 'short',
                      }}
                    />
                  </span>
                  <span className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mute">
                    {matchLabel(upcoming)}
                  </span>
                  <span className="mt-1.5 rounded-full bg-sunset/15 px-2.5 py-0.5 text-[11px] text-sunset">
                    {fill(t.predsCountFmt, { n: String(predCount.get(upcoming.id) ?? 0) })}
                  </span>
                </div>
                <TeamMini name={upcoming.away?.name} flag={upcoming.away?.flag_url} />
              </a>

              <div className="mt-4 flex justify-center">
                <a
                  href={`/${locale}/predict?match=${upcoming.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-sunset px-8 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
                >
                  {t.predictThis} <IconArrowRight size={16} />
                </a>
              </div>

              <CollapsibleStance
                predictions={upcomingPreds}
                homeName={upcoming.home?.name ?? '?'}
                awayName={upcoming.away?.name ?? '?'}
                isKnockout={upcoming.stage !== 'group'}
                t={dict.stance}
                expandLabel={t.expand}
                collapseLabel={t.collapse}
              />
            </div>
          )}

          {/* 最近进行中/刚结束 → 真实比分 + 完整站队板 */}
          {recent && (
            <div>
              <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-medium text-ink">
                <IconBallFootball size={20} /> {t.recentLabel}
              </h2>

              <a
                href={`/${locale}/match/${recent.id}`}
                className="mb-4 flex items-center justify-center gap-6 rounded-card border border-hairline bg-canvas-card p-5 transition-colors hover:border-mute"
              >
                <TeamMini name={recent.home?.name} flag={recent.home?.flag_url} />
                <div className="flex flex-col items-center">
                  {recent.home_score != null ? (
                    <span className="text-3xl font-medium text-ink">
                      {recent.home_score}
                      <span className="px-2 text-mute">-</span>
                      {recent.away_score}
                    </span>
                  ) : (
                    <span className="text-2xl font-medium text-mute">{dict.match.vs}</span>
                  )}
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-mute">
                    <IconClock size={12} />{' '}
                    <LocalTime
                      utc={recent.kickoff_utc}
                      localeTag={LOCALE_TAG[locale]}
                      options={{
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZoneName: 'short',
                      }}
                    />
                  </span>
                  <span className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mute">
                    {matchLabel(recent)}
                  </span>
                  {recent.status === 'live' && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                      {t.liveLabel}
                    </span>
                  )}
                </div>
                <TeamMini name={recent.away?.name} flag={recent.away?.flag_url} />
              </a>

              {recentPreds.length > 0 && (
                <StanceBoard
                  predictions={recentPreds}
                  homeName={recent.home?.name ?? '?'}
                  awayName={recent.away?.name ?? '?'}
                  isKnockout={recent.stage !== 'group'}
                  t={dict.stance}
                />
              )}
            </div>
          )}
        </section>
      )}

      {/* 统计：模型榜(AI) vs 人类榜 并排，积分赛跑折线图整宽在下 */}
      <section id="leaderboard" className="mt-14 scroll-mt-20">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 模型榜（AI） */}
          <div>
            <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-medium text-ink">
              <IconTrophy size={20} /> {t.leaderboard}
            </h2>
            <div className="rounded-card border border-hairline bg-canvas-card p-2">
              {leaderboard.map((m, i) => (
                <div key={m.name} className="flex items-center gap-3 rounded-card px-3 py-2">
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
            <p className="mt-2 px-1 text-xs text-mute">{t.since}</p>
          </div>

          {/* 人类榜（Top5 + 我的排名，完整版在预测页） */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-xl font-medium text-ink">
                <IconUser size={20} /> {dict.predict.humanBoard}
              </h2>
              <a
                href={`/${locale}/leaderboard`}
                className="inline-flex items-center gap-1 text-sm text-mute hover:text-body"
              >
                {t.humanViewAll} <IconArrowRight size={15} />
              </a>
            </div>
            <HumanBoard
              rows={humanRows}
              myRank={myRank}
              t={{
                you: dict.predict.you,
                yourRank: dict.predict.yourRank,
                rankFmt: dict.predict.rankFmt,
                ptsUnit: dict.predict.ptsUnit,
                humanEmpty: dict.predict.humanEmpty,
              }}
            />
          </div>
        </div>

        {/* 积分赛跑（整宽） */}
        <div className="mt-6">
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

      {/* 积分规则 */}
      <section id="rules" className="mt-14 scroll-mt-20">
        <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-medium text-ink">
          <IconScale size={20} /> {dict.rules.title}
        </h2>
        <ScoringRules t={dict.rules} />
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
