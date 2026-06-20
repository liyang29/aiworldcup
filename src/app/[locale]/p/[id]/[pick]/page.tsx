import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import StanceBoard, { type Pred } from '@/components/match/StanceBoard';
import { getDictionary, fill } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import { altLinks, ogMeta } from '@/lib/seo';
import { scoreLine } from '@/lib/scoring';
import { teamName } from '@/i18n/teams';
import BackLink from '@/components/BackLink';
import { IconBallFootball, IconArrowRight } from '@tabler/icons-react';

export const revalidate = 120;

function parsePick(pick: string): [number, number] | null {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(pick);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

async function fetchTeams(id: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('matches')
    .select('home:home_team_id(name), away:away_team_id(name)')
    .eq('id', id)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mm = data as any;
  return { home: mm?.home?.name ?? '?', away: mm?.away?.name ?? '?' };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string; locale: Locale; pick: string };
}): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  const pk = parsePick(params.pick);
  const raw = await fetchTeams(params.id);
  const home = teamName(raw.home, params.locale);
  const away = teamName(raw.away, params.locale);
  const score = pk ? `${pk[0]}-${pk[1]}` : '';
  const title = `${home} ${score} ${away} — ${dict.home.hook}`;
  const description = `${dict.sharecard.predicted}: ${home} ${score} ${away}. ${dict.meta.leaderboardDesc}`;
  return {
    title,
    description,
    alternates: altLinks(params.locale, `/p/${params.id}/${params.pick}`),
    ...ogMeta(params.locale, {
      siteName: dict.meta.siteName,
      title,
      description,
      path: `/p/${params.id}/${params.pick}`,
    }),
  };
}

export default async function SharePredictionPage({
  params,
}: {
  params: { id: string; locale: Locale; pick: string };
}) {
  const dict = await getDictionary(params.locale);
  const t = dict.match;
  const sc = dict.sharecard;
  const pk = parsePick(params.pick);
  const supabase = createPublicClient();

  const { data } = await supabase
    .from('matches')
    .select(
      'id, stage, group_label, status, home_score, away_score, ' +
        'home:home_team_id(name, flag_url), away:away_team_id(name, flag_url)'
    )
    .eq('id', params.id)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = data as any;

  if (!match || !pk) {
    return <main className="mx-auto max-w-2xl px-5 py-20 text-center text-mute">{t.notFound}</main>;
  }

  const [ph, pa] = pk;
  const home = match.home;
  const away = match.away;
  const homeLoc = teamName(home?.name, params.locale) || '?';
  const awayLoc = teamName(away?.name, params.locale) || '?';
  const finished = match.status === 'finished';

  const { data: preds } = await supabase
    .from('model_predictions')
    .select('pred_home, pred_away, reasoning, points, pred_advance_team_id, model:model_id(name, provider)')
    .eq('match_id', params.id);
  const predictions = (preds ?? []) as unknown as Pred[];

  // 赛后：算"这个预测赢了几个 AI"（同口径：只算90分钟比分）
  let beat: { n: number; total: number } | null = null;
  if (finished && match.home_score != null && predictions.length) {
    const mine = scoreLine(ph, pa, match.home_score, match.away_score);
    const n = predictions.filter(
      (p) => scoreLine(p.pred_home, p.pred_away, match.home_score, match.away_score) < mine
    ).length;
    beat = { n, total: predictions.length };
  }

  const stageLabel = (t.stages as Record<string, string>)[match.stage] ?? match.stage;
  const groupLabel = match.group_label ? fill(t.groupFmt, { g: match.group_label }) : '';

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <BackLink home={`/${params.locale}`} label={dict.nav.back} />

      <section className="rounded-card border border-hairline bg-canvas-card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-[0.16em] text-mute">
          <IconBallFootball size={16} />
          {stageLabel}
          {groupLabel ? ` · ${groupLabel}` : ''}
        </div>

        <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
          <TeamSide name={homeLoc} flag={home?.flag_url} />
          <div className="flex shrink-0 flex-col items-center px-1">
            {finished ? (
              <div className="text-2xl font-medium text-mute sm:text-3xl">
                {match.home_score}
                <span className="px-1.5">-</span>
                {match.away_score}
              </div>
            ) : (
              <div className="text-xl font-medium text-mute">{t.vs}</div>
            )}
          </div>
          <TeamSide name={awayLoc} flag={away?.flag_url} />
        </div>

        {/* 这个分享的预测 */}
        <div className="mx-auto mt-7 max-w-xs rounded-card border border-sunset/30 bg-sunset/10 px-4 py-4 text-center">
          <div className="text-xs uppercase tracking-wider text-sunset">{sc.predicted}</div>
          <div className="mt-1 font-mono text-4xl font-medium text-ink">
            {ph}-{pa}
          </div>
          {beat && (
            <div className="mt-2 text-sm text-body">
              {fill(sc.beatFmt, { n: beat.n, total: beat.total })}
            </div>
          )}
        </div>
      </section>

      {/* AI 站队 */}
      <div className="mb-4 mt-9 flex items-baseline justify-between">
        <h2 className="text-xl font-medium text-ink">{t.sectionTitle}</h2>
        <span className="text-xs text-mute">{t.tapHint}</span>
      </div>
      {predictions.length > 0 && (
        <StanceBoard
          predictions={predictions}
          homeName={homeLoc}
          awayName={awayLoc}
          isKnockout={match.stage !== 'group'}
          t={dict.stance}
        />
      )}

      {/* CTA：来挑战 */}
      <div className="mt-10 rounded-card border border-hairline bg-canvas-card p-6 text-center">
        <p className="text-base text-body">{dict.home.hook}</p>
        <a
          href={`/${params.locale}/predict?match=${match.id}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sunset px-6 py-3 text-sm font-medium text-canvas"
        >
          {sc.cta} <IconArrowRight size={15} />
        </a>
      </div>
    </main>
  );
}

function TeamSide({ name, flag }: { name?: string; flag?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3 text-center">
      {flag ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt={name ?? ''} className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-hairline text-sm text-mute sm:h-16 sm:w-16">
          {name?.slice(0, 2)}
        </div>
      )}
      <span className="text-lg font-medium leading-tight text-ink sm:text-xl">{name}</span>
    </div>
  );
}
