'use client';

import { useState } from 'react';

export type ChartT = { chartPoints: string; chartAccuracy: string };
export type Series = { name: string; color: string; points: number[]; acc: number[] };

const W = 720;
const H = 260;
const PAD = { l: 34, r: 12, t: 12, b: 26 };

export default function ModelLineChart({
  xLabels,
  series,
  emptyText,
  t,
}: {
  xLabels: string[];
  series: Series[];
  emptyText: string;
  t: ChartT;
}) {
  const [metric, setMetric] = useState<'points' | 'acc'>('points');

  // 数据不足（不够画"随时间变化"的曲线）→ 显示积累中空状态，不放假数据
  if (xLabels.length < 2 || series.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-card border border-dashed border-hairline bg-canvas-card px-4 text-center text-sm text-mute">
        {emptyText}
      </div>
    );
  }

  const data = series.map((s) => ({ ...s, vals: metric === 'points' ? s.points : s.acc }));
  const maxRaw = metric === 'points' ? Math.max(1, ...series.flatMap((s) => s.points)) : 100;
  const niceMax = metric === 'points' ? Math.ceil(maxRaw / 5) * 5 || 5 : 100;

  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;
  const xAt = (i: number) => PAD.l + (cw * i) / Math.max(1, xLabels.length - 1);
  const yAt = (v: number) => PAD.t + ch - (ch * v) / niceMax;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex rounded-full border border-hairline p-0.5 text-xs">
          {(['points', 'acc'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-full px-3 py-1 ${
                metric === m ? 'bg-hairline text-ink' : 'text-mute hover:text-body'
              }`}
            >
              {m === 'points' ? t.chartPoints : t.chartAccuracy}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-hairline bg-canvas-card p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }}>
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} y1={yAt(v)} x2={W - PAD.r} y2={yAt(v)} stroke="#212327" strokeWidth="1" />
              <text x={PAD.l - 6} y={yAt(v) + 3} fill="#7d8187" fontSize="10" textAnchor="end">
                {metric === 'acc' ? `${v}%` : v}
              </text>
            </g>
          ))}
          {xLabels.map((lab, i) => (
            <text key={i} x={xAt(i)} y={H - 8} fill="#7d8187" fontSize="10" textAnchor="middle">
              {lab}
            </text>
          ))}
          {data.map((s) => (
            <g key={s.name}>
              <polyline
                points={s.vals.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
              />
              {s.vals.map((v, i) => (
                <circle key={i} cx={xAt(i)} cy={yAt(v)} r="2.5" fill={s.color} />
              ))}
            </g>
          ))}
        </svg>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] text-body">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
