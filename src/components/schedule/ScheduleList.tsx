'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconChevronRight } from '@tabler/icons-react';
import { teamName } from '@/i18n/teams';

export type SchedMatch = {
  id: string;
  stage: string;
  kickoff_utc: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home: { name: string; flag_url: string | null } | null;
  away: { name: string; flag_url: string | null } | null;
};

export type SchedT = {
  all: string;
  upcoming: string;
  finished: string;
  group: string;
  knockout: string;
  finishedShort: string;
  live: string;
  empty: string;
};

type Filter = 'all' | 'upcoming' | 'finished' | 'group' | 'knockout';

function Flag({ name, flag }: { name?: string; flag?: string | null }) {
  return flag ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={flag} alt={name ?? ''} className="h-5 w-5 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="h-5 w-5 shrink-0 rounded-full bg-hairline" />
  );
}

export default function ScheduleList({
  matches,
  t,
  locale,
  localeTag,
}: {
  matches: SchedMatch[];
  t: SchedT;
  locale: string;
  localeTag: string;
}) {
  const [f, setF] = useState<Filter>('all');

  const filters: [Filter, string][] = [
    ['all', t.all],
    ['upcoming', t.upcoming],
    ['finished', t.finished],
    ['group', t.group],
    ['knockout', t.knockout],
  ];

  const show = matches.filter((m) =>
    f === 'all'
      ? true
      : f === 'upcoming'
        ? m.status !== 'finished'
        : f === 'finished'
          ? m.status === 'finished'
          : f === 'group'
            ? m.stage === 'group'
            : m.stage !== 'group'
  );

  // 按日期分组（保持已排序顺序）
  const groups: { key: string; items: SchedMatch[] }[] = [];
  for (const m of show) {
    const key = new Date(m.kickoff_utc).toLocaleDateString(localeTag, {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, items: [] };
      groups.push(g);
    }
    g.items.push(m);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setF(key)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              f === key
                ? 'border-sunset bg-sunset text-canvas'
                : 'border-hairline text-mute hover:text-body'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="rounded-card border border-hairline bg-canvas-card p-8 text-center text-sm text-mute">
          {t.empty}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="mb-2 px-1 font-mono text-xs uppercase tracking-wider text-mute">
              {g.key}
            </div>
            <div className="overflow-hidden rounded-card border border-hairline bg-canvas-card">
              {g.items.map((m) => {
                const finished = m.status === 'finished';
                const time = new Date(m.kickoff_utc).toLocaleTimeString(localeTag, {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });
                return (
                  <Link
                    key={m.id}
                    href={`/${locale}/match/${m.id}`}
                    className="flex items-center gap-3 border-b border-hairline px-3 py-2.5 last:border-b-0 hover:bg-canvas-soft"
                  >
                    <span className="w-12 shrink-0 text-center text-[11px] text-mute">
                      {finished ? t.finishedShort : m.status === 'live' ? t.live : time}
                    </span>
                    <div className="flex flex-1 items-center justify-end gap-2 truncate text-sm text-ink">
                      <span className="truncate">{teamName(m.home?.name, locale)}</span>
                      <Flag name={m.home?.name} flag={m.home?.flag_url} />
                    </div>
                    <span className="w-12 shrink-0 text-center font-mono text-sm">
                      {finished ? (
                        <span className="font-medium text-ink">
                          {m.home_score}-{m.away_score}
                        </span>
                      ) : (
                        <span className="text-mute">VS</span>
                      )}
                    </span>
                    <div className="flex flex-1 items-center gap-2 truncate text-sm text-ink">
                      <Flag name={m.away?.name} flag={m.away?.flag_url} />
                      <span className="truncate">{teamName(m.away?.name, locale)}</span>
                    </div>
                    <IconChevronRight size={15} className="shrink-0 text-mute" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
