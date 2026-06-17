'use client';

import { useState } from 'react';

export type ChartT = { chartPoints: string; chartAccuracy: string; sample: string };

// 示例数据（赛事开始后由真实结算数据替换）
const X = ['6/14', '6/15', '6/16', '6/17', '6/18', '6/19'];
const SERIES = [
  { name: 'DeepSeek V3.2', color: '#3b82f6', points: [3, 7, 12, 15, 20, 26], acc: [60, 55, 64, 58, 66, 68] },
  { name: 'Grok 4.3', color: '#ff7a17', points: [5, 8, 11, 17, 22, 25], acc: [70, 62, 58, 66, 64, 67] },
  { name: 'GPT-5.5', color: '#10a37f', points: [2, 6, 10, 14, 19, 24], acc: [50, 58, 55, 60, 63, 62] },
  { name: 'Claude Opus 4.8', color: '#d97757', points: [4, 7, 9, 13, 17, 22], acc: [55, 52, 57, 59, 58, 60] },
  { name: 'Qwen3.6', color: '#a855f7', points: [3, 5, 9, 12, 16, 20], acc: [48, 53, 56, 54, 57, 59] },
  { name: 'Gemini 3.5', color: '#4285f4', points: [1, 4, 8, 11, 15, 19], acc: [45, 50, 54, 52, 56, 58] },
];

const W = 720;
const H = 260;
const PAD = { l: 34, r: 12, t: 12, b: 26 };

export default function ModelLineChart({ t, isSample = true }: { t: ChartT; isSample?: boolean }) {
  const [metric, setMetric] = useState<'points' | 'acc'>('points');

  const data = SERIES.map((s) => ({ ...s, vals: metric === 'points' ? s.points : s.acc }));
  const maxY = metric === 'points' ? Math.max(...SERIES.flatMap((s) => s.points)) : 100;
  const niceMax = metric === 'points' ? Math.ceil(maxY / 5) * 5 : 100;

  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;
  const xAt = (i: number) => PAD.l + (cw * i) / (X.length - 1);
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
        {isSample && <span className="text-[11px] text-mute">{t.sample}</span>}
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
          {X.map((lab, i) => (
            <text key={lab} x={xAt(i)} y={H - 8} fill="#7d8187" fontSize="10" textAnchor="middle">
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
          {SERIES.map((s) => (
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
