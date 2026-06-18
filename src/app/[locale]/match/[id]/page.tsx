import { createClient } from '@/lib/supabase/server';
import StanceBoard, { type Pred } from '@/components/match/StanceBoard';
import LocalTime from '@/components/LocalTime';
import ShareButtons from '@/components/ShareButtons';
import { altLinks } from '@/lib/seo';
import { getDictionary, fill } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import {
  IconArrowLeft,
  IconBallFootball,
  IconClock,
  IconMapPin,
} from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

const LOCALE_TAG: Record<Locale, string> = { en: 'en-US', zh: 'zh-CN', es: 'es-ES' };

export async function generateMetadata({
  params,
}: {
  params: { id: string; locale: Locale };
}): Promise<import('next').Metadata> {
  const dict = await getDictionary(params.locale);
  const supabase = createClient();
  const { data } = await supabase
    .from('matches')
    .select('home:home_team_id(name), away:away_team_id(name)')
    .eq('id', params.id)
    .single();
  const mm = data as any;
  const home = mm?.home?.name ?? '?';
  const away = mm?.away?.name ?? '?';
  const title = fill(dict.meta.matchTitleFmt, { home, away });
  const description = fill(dict.meta.matchDescFmt, { home, away });
  return {
    title,
    description,
    alternates: altLinks(params.locale, `/match/${params.id}`),
    openGraph: { title, description, url: `/${params.locale}/match/${params.id}` },
    twitter: { title, description },
  };
}

export default async function MatchPage({
  params,
}: {
  params: { id: string; locale: Locale };
}) {
  const dict = await getDictionary(params.locale);
  const t = dict.match;
  const supabase = createClient();

  const { data } = await supabase
    .from('matches')
    .select(
      'id, stage, group_label, venue, kickoff_utc, status, home_score, away_score, ' +
        'home:home_team_id(name, flag_url), away:away_team_id(name, flag_url)'
    )
    .eq('id', params.id)
    .single();

  const match = data as any;

  if (!match) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center text-mute">{t.notFound}</main>
    );
  }

  const { data: preds } = await supabase
    .from('model_predictions')
    .select('pred_home, pred_away, reasoning, points, pred_advance_team_id, model:model_id(name, provider)')
    .eq('match_id', params.id);

  const predictions = (preds ?? []) as unknown as Pred[];
  const home = match.home as any;
  const away = match.away as any;
  const finished = match.status === 'finished';
  const isKnockout = match.stage !== 'group';

  const stageLabel = (t.stages as Record<string, string>)[match.stage] ?? match.stage;
  const groupLabel = match.group_label ? fill(t.groupFmt, { g: match.group_label }) : '';

  // SportsEvent 结构化数据（JSON-LD）：让谷歌识别这是一场足球赛事
  // 注：location 需真实场馆数据；当前 API 无 venue，故暂缺（该富结果低影响，不造假）。
  const matchName = `${home?.name ?? '?'} vs ${away?.name ?? '?'}`;
  const endDate = new Date(
    new Date(match.kickoff_utc).getTime() + 2 * 3600 * 1000
  ).toISOString();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: matchName,
    description: fill(dict.meta.matchDescFmt, { home: home?.name ?? '?', away: away?.name ?? '?' }),
    sport: 'Soccer',
    startDate: match.kickoff_utc,
    endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    homeTeam: { '@type': 'SportsTeam', name: home?.name ?? '?' },
    awayTeam: { '@type': 'SportsTeam', name: away?.name ?? '?' },
    image: `https://predworld.fun/${params.locale}/opengraph-image`,
    url: `https://predworld.fun/${params.locale}/match/${params.id}`,
    ...(match.venue ? { location: { '@type': 'Place', name: match.venue } } : {}),
  };

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a
        href={`/${params.locale}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-mute hover:text-body"
      >
        <IconArrowLeft size={16} /> {dict.nav.back}
      </a>

      <section className="rounded-card border border-hairline bg-canvas-card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-center gap-2 font-mono text-sm uppercase tracking-[0.16em] text-mute">
          <IconBallFootball size={16} />
          {stageLabel}
          {groupLabel ? ` · ${groupLabel}` : ''}
        </div>

        <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
          <TeamSide name={home?.name} flag={home?.flag_url} />
          <div className="flex shrink-0 flex-col items-center px-1">
            {finished ? (
              <div className="text-4xl font-medium text-ink sm:text-5xl">
                {match.home_score}<span className="px-2 text-mute">-</span>{match.away_score}
              </div>
            ) : (
              <div className="text-2xl font-medium text-mute sm:text-3xl">{t.vs}</div>
            )}
          </div>
          <TeamSide name={away?.name} flag={away?.flag_url} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-mute">
          <span className="inline-flex items-center gap-1.5">
            <IconClock size={15} />{' '}
            <LocalTime
              utc={match.kickoff_utc}
              localeTag={LOCALE_TAG[params.locale]}
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
          {match.venue && (
            <span className="inline-flex items-center gap-1.5">
              <IconMapPin size={15} /> {match.venue}
            </span>
          )}
          <span
            className={`rounded-full px-3 py-0.5 text-xs ${
              finished ? 'bg-hairline text-body' : 'bg-sunset/15 text-sunset'
            }`}
          >
            {finished ? t.finished : t.scheduled}
          </span>
        </div>

        <div className="mt-6 border-t border-hairline pt-5">
          <ShareButtons
            url={`https://predworld.fun/${params.locale}/match/${match.id}`}
            title={`${matchName} — 10 AI models predict · predworld.fun`}
            t={{ share: t.share, copied: t.copied }}
          />
        </div>
      </section>

      <div className="mb-4 mt-9 flex items-baseline justify-between">
        <h2 className="text-xl font-medium text-ink">{t.sectionTitle}</h2>
        <span className="text-xs text-mute">{t.tapHint}</span>
      </div>

      {predictions.length === 0 ? (
        <p className="rounded-card border border-hairline bg-canvas-card p-6 text-center text-sm text-mute">
          {t.noPredictions}
        </p>
      ) : (
        <StanceBoard
          predictions={predictions}
          homeName={home?.name ?? '?'}
          awayName={away?.name ?? '?'}
          isKnockout={isKnockout}
          t={dict.stance}
        />
      )}

      <div className="mt-10 rounded-card border border-hairline bg-canvas-card p-6 text-center">
        <p className="text-base text-body">{t.ctaQuestion}</p>
        <a
          href={`/${params.locale}/predict`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sunset px-6 py-3 text-sm font-medium text-canvas"
        >
          {t.cta}
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
