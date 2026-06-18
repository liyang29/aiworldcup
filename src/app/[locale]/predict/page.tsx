import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import PredictForm from '@/components/predict/PredictForm';
import ScoringRules from '@/components/ScoringRules';
import LocalTime from '@/components/LocalTime';
import { IconBallFootball, IconClock, IconCheck, IconUser, IconScale, IconArrowRight } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

const LOCALE_TAG: Record<Locale, string> = { en: 'en-US', zh: 'zh-CN', es: 'es-ES' };

export default async function PredictPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { match?: string };
}) {
  const locale = params.locale;
  const dict = await getDictionary(locale);
  const t = dict.predict;
  const supabase = createClient();

  const { data: upcomingData } = await supabase
    .from('matches')
    .select('id, kickoff_utc, home:home_team_id(name, flag_url), away:away_team_id(name, flag_url)')
    .eq('status', 'scheduled')
    .gt('kickoff_utc', new Date().toISOString())
    .order('kickoff_utc', { ascending: true })
    .limit(24);
  const upcoming = (upcomingData ?? []) as any[];

  const selected = upcoming.find((m) => m.id === searchParams.match) ?? upcoming[0];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let myPreds: Record<string, { pred_home: number; pred_away: number }> = {};
  if (user) {
    const { data } = await supabase
      .from('user_predictions')
      .select('match_id, pred_home, pred_away')
      .eq('user_id', user.id);
    for (const p of data ?? []) myPreds[p.match_id] = p;
  }


  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  // 时间统一在客户端按访客本地时区显示（附时区缩写），与首页/比赛页一致
  const timeOpts: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  };

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-medium text-ink">{t.title}</h1>
      <p className="mt-2 text-sm text-body">{t.subtitle}</p>

      {!selected ? (
        <p className="mt-8 rounded-card border border-hairline bg-canvas-card p-8 text-center text-sm text-mute">
          {t.noUpcoming}
        </p>
      ) : (
        <section className="mt-8 rounded-card border border-hairline bg-canvas-card p-6">
          <div className="mb-5 flex items-center justify-center gap-4 text-center">
            <Team name={selected.home?.name} flag={selected.home?.flag_url} />
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-mute">VS</span>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-mute">
                <IconClock size={11} />{' '}
                <LocalTime utc={selected.kickoff_utc} localeTag={LOCALE_TAG[locale]} options={timeOpts} />
              </span>
            </div>
            <Team name={selected.away?.name} flag={selected.away?.flag_url} />
          </div>

          {myPreds[selected.id] ? (
            <div className="text-center">
              <div className="text-xs text-mute">{t.yourPrediction}</div>
              <div className="mt-1 font-mono text-2xl font-medium text-ink">
                {myPreds[selected.id].pred_home}-{myPreds[selected.id].pred_away}
              </div>
              <div className="mt-1 text-xs text-mute">{t.locked}</div>
            </div>
          ) : (
            <PredictForm
              matchId={selected.id}
              locale={locale}
              homeName={selected.home?.name ?? '?'}
              awayName={selected.away?.name ?? '?'}
              siteKey={siteKey}
              t={{
                submit: t.submit,
                submitting: t.submitting,
                fillFirst: t.fillFirst,
                success: t.success,
                verifyFailed: t.verifyFailed,
                tooLate: t.tooLate,
                anonError: t.anonError,
              }}
            />
          )}
        </section>
      )}

      {/* 积分规则 */}
      <section className="mt-8">
        <h2 className="mb-3 inline-flex items-center gap-2 text-base font-medium text-ink">
          <IconScale size={18} /> {dict.rules.title}
        </h2>
        <ScoringRules t={dict.rules} />
      </section>

      {/* 其它即将开赛 */}
      {upcoming.length > 1 && (
        <section className="mt-8">
          <h2 className="mb-3 inline-flex items-center gap-2 text-base font-medium text-ink">
            <IconBallFootball size={18} /> {t.otherMatches}
          </h2>
          <div className="overflow-hidden rounded-card border border-hairline bg-canvas-card">
            {upcoming.map((m) => (
              <Link
                key={m.id}
                href={`/${locale}/predict?match=${m.id}`}
                className={`flex items-center gap-2 border-b border-hairline px-3 py-2.5 text-sm last:border-b-0 hover:bg-canvas-soft ${
                  m.id === selected?.id ? 'bg-canvas-soft' : ''
                }`}
              >
                <span className="flex-1 truncate text-ink">
                  {m.home?.name} <span className="text-mute">vs</span> {m.away?.name}
                </span>
                {myPreds[m.id] ? (
                  <span className="inline-flex items-center gap-0.5 text-xs text-sunset">
                    <IconCheck size={13} /> {t.predicted}
                  </span>
                ) : (
                  <span className="text-[11px] text-mute">
                    <LocalTime utc={m.kickoff_utc} localeTag={LOCALE_TAG[locale]} options={timeOpts} />
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 人类榜入口（完整榜单在专门页） */}
      <section className="mt-8">
        <a
          href={`/${locale}/leaderboard`}
          className="flex items-center justify-between rounded-card border border-hairline bg-canvas-card px-4 py-3.5 transition-colors hover:border-mute"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
            <IconUser size={18} /> {t.humanBoard}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-mute">
            {dict.home.humanViewAll} <IconArrowRight size={15} />
          </span>
        </a>
      </section>
    </main>
  );
}

function Team({ name, flag }: { name?: string; flag?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
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
