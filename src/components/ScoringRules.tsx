import {
  IconTargetArrow,
  IconArrowsDiff,
  IconCheck,
  IconX,
  IconTournament,
  IconInfoCircle,
} from '@tabler/icons-react';

export type RulesT = {
  title: string;
  subtitle: string;
  exactTitle: string;
  exactDesc: string;
  diffTitle: string;
  diffDesc: string;
  outcomeTitle: string;
  outcomeDesc: string;
  missTitle: string;
  missDesc: string;
  ptsUnit: string;
  knockout: string;
  fairnessNote: string;
};

// 计分规则展示板（模型与用户同规则）。纯展示，可在首页/预测页复用。
// 分值与 scripts/lib/scoring.mjs 保持一致：精确5 / 净胜球3 / 走势1 / 错0，淘汰赛晋级 +2。
export default function ScoringRules({ t }: { t: RulesT }) {
  const cards = [
    { pts: 5, color: 'text-sunset', Icon: IconTargetArrow, title: t.exactTitle, desc: t.exactDesc },
    { pts: 3, color: 'text-ink', Icon: IconArrowsDiff, title: t.diffTitle, desc: t.diffDesc },
    { pts: 1, color: 'text-ink', Icon: IconCheck, title: t.outcomeTitle, desc: t.outcomeDesc },
    { pts: 0, color: 'text-mute', Icon: IconX, title: t.missTitle, desc: t.missDesc },
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-body">{t.subtitle}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.pts} className="rounded-card border border-hairline bg-canvas-card p-4">
            <div className="flex items-center justify-between">
              <c.Icon size={18} stroke={1.5} className="text-mute" />
              <span className="flex items-baseline gap-1">
                <span className={`font-mono text-2xl font-medium ${c.color}`}>
                  {c.pts > 0 ? `+${c.pts}` : c.pts}
                </span>
                <span className="text-[10px] text-mute">{t.ptsUnit}</span>
              </span>
            </div>
            <div className="mt-2 text-sm font-medium text-ink">{c.title}</div>
            <div className="mt-0.5 text-xs text-mute">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-start gap-2 rounded-card border border-hairline bg-canvas-card px-4 py-3 text-sm text-body">
          <IconTournament size={16} stroke={1.5} className="mt-0.5 shrink-0 text-sunset" />
          <span>{t.knockout}</span>
        </div>
        <div className="flex flex-1 items-start gap-2 rounded-card border border-hairline bg-canvas-card px-4 py-3 text-xs text-mute">
          <IconInfoCircle size={16} stroke={1.5} className="mt-0.5 shrink-0" />
          <span>{t.fairnessNote}</span>
        </div>
      </div>
    </div>
  );
}
