'use client';

import { useState } from 'react';
import {
  IconX,
  IconArrowUpRight,
  IconArrowDownRight,
  IconMinus,
  IconCheck,
  IconTrophy,
} from '@tabler/icons-react';
import ModelAvatar from '../ModelAvatar';

export type Pred = {
  pred_home: number;
  pred_away: number;
  reasoning: string | null;
  points: number | null;
  pred_advance_team_id: string | null;
  model: { name: string; provider: string } | null;
};

export type StanceT = {
  backs: string;
  draw: string;
  empty: string;
  captionBacks: string;
  captionDraw: string;
  advance: string;
  points: string;
  noReason: string;
  close: string;
};

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

function ModelChip({ p, onClick }: { p: Pred; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`${p.model?.name} 的预测与理由`}
      className="flex w-full flex-col items-center gap-1.5 rounded-card border border-hairline bg-canvas-card px-1 py-2.5 transition-colors hover:border-mute"
    >
      <ModelAvatar name={p.model?.name} provider={p.model?.provider} />
      <span className="w-full truncate px-0.5 text-center text-xs font-medium text-ink">
        {p.model?.name}
      </span>
      <span className="font-mono text-xs text-mute">
        {p.pred_home}-{p.pred_away}
      </span>
    </button>
  );
}

export default function StanceBoard({
  predictions,
  homeName,
  awayName,
  isKnockout,
  t,
}: {
  predictions: Pred[];
  homeName: string;
  awayName: string;
  isKnockout: boolean;
  t: StanceT;
}) {
  const [active, setActive] = useState<Pred | null>(null);

  const homeBacks = predictions.filter((p) => p.pred_home > p.pred_away);
  const draws = predictions.filter((p) => p.pred_home === p.pred_away);
  const awayBacks = predictions.filter((p) => p.pred_home < p.pred_away);
  const total = predictions.length || 1;

  const Column = ({
    list,
    label,
    icon,
    accent,
    bg,
    border,
  }: {
    list: Pred[];
    label: string;
    icon: React.ReactNode;
    accent: string;
    bg: string;
    border: string;
  }) => (
    <div
      className="flex flex-col gap-2.5 rounded-card border p-2.5 sm:p-3"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center justify-center gap-1 text-center text-xs" style={{ color: accent }}>
        {icon}
        <span className="truncate">{label}</span>
        <span className="opacity-70">· {list.length}</span>
      </div>
      {list.length === 0 ? (
        <div className="rounded-card border border-dashed border-hairline px-1 py-4 text-center text-[11px] text-mute">
          {t.empty}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {list.map((p, i) => (
            <ModelChip key={i} p={p} onClick={() => setActive(p)} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* 拔河占比条 + 说明 */}
      <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-hairline">
        <span style={{ width: `${(homeBacks.length / total) * 100}%`, background: '#3b82f6' }} />
        <span style={{ width: `${(draws.length / total) * 100}%`, background: '#3a3d42' }} />
        <span style={{ width: `${(awayBacks.length / total) * 100}%`, background: '#ef4444' }} />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-mute">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#3b82f6' }} />
          {fill(t.captionBacks, { n: homeBacks.length, team: homeName })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#7d8187' }} />
          {fill(t.captionDraw, { n: draws.length })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#ef4444' }} />
          {fill(t.captionBacks, { n: awayBacks.length, team: awayName })}
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-3 sm:gap-4">
        <Column
          list={homeBacks}
          label={fill(t.backs, { team: homeName })}
          accent="#60a5fa"
          bg="rgba(59,130,246,0.10)"
          border="rgba(59,130,246,0.28)"
          icon={<IconArrowUpRight size={14} />}
        />
        <Column
          list={draws}
          label={t.draw}
          accent="#9aa0a6"
          bg="rgba(125,129,135,0.08)"
          border="rgba(125,129,135,0.22)"
          icon={<IconMinus size={14} />}
        />
        <Column
          list={awayBacks}
          label={fill(t.backs, { team: awayName })}
          accent="#f87171"
          bg="rgba(239,68,68,0.10)"
          border="rgba(239,68,68,0.28)"
          icon={<IconArrowDownRight size={14} />}
        />
      </div>

      {/* 点击弹窗：理由 */}
      {active && (
        <div
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-2xl border border-hairline bg-canvas-card p-5 sm:rounded-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ModelAvatar name={active.model?.name} provider={active.model?.provider} size={40} />
                <div>
                  <div className="text-sm font-medium text-ink">{active.model?.name}</div>
                  <div className="text-xs text-mute">{active.model?.provider}</div>
                </div>
              </div>
              <button onClick={() => setActive(null)} aria-label={t.close} className="text-mute hover:text-ink">
                <IconX size={20} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="font-mono text-2xl font-medium text-ink">
                {active.pred_home}<span className="px-1 text-mute">-</span>{active.pred_away}
              </span>
              <span className="text-xs text-mute">
                {homeName} vs {awayName}
              </span>
              {active.points !== null && (
                <span
                  className={`ml-auto inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] ${
                    active.points > 0 ? 'bg-sunset/15 text-sunset' : 'bg-hairline text-mute'
                  }`}
                >
                  <IconCheck size={11} /> {fill(t.points, { points: active.points })}
                </span>
              )}
            </div>

            {isKnockout && active.pred_advance_team_id && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-mute">
                <IconTrophy size={12} /> {t.advance}
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-body">
              {active.reasoning || t.noReason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
