import { IconUser } from '@tabler/icons-react';
import { fill } from '@/i18n/dictionaries';
import type { HumanRow, MyRank } from '@/lib/leaderboard';

export type HumanBoardT = {
  you: string;
  yourRank: string;
  rankFmt: string;
  ptsUnit: string;
  humanEmpty: string;
};

// 人类榜展示（首页 Top5 / 预测页 Top100 共用）。
export default function HumanBoard({
  rows,
  myRank,
  t,
}: {
  rows: HumanRow[];
  myRank: MyRank;
  t: HumanBoardT;
}) {
  return (
    <div>
      {rows.length === 0 ? (
        <p className="rounded-card border border-hairline bg-canvas-card p-6 text-center text-sm text-mute">
          {t.humanEmpty}
        </p>
      ) : (
        <div className="rounded-card border border-hairline bg-canvas-card p-2">
          {rows.map((h, i) => (
            <div
              key={i}
              id={h.isMe ? 'me-row' : undefined}
              className={`flex items-center gap-3 rounded-card px-3 py-2 ${h.isMe ? 'bg-sunset/10' : ''}`}
            >
              <span className={`w-5 text-center text-sm ${i === 0 ? 'text-sunset' : 'text-mute'}`}>
                {i + 1}
              </span>
              {h.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-hairline text-mute">
                  <IconUser size={13} />
                </span>
              )}
              <span className="flex-1 truncate text-sm text-ink">
                {h.name}
                {h.isMe && <span className="ml-1 text-xs text-sunset">· {t.you}</span>}
              </span>
              <span className="font-mono text-sm text-body">{h.points}</span>
            </div>
          ))}
        </div>
      )}

      {myRank && (
        <div className="mt-2 flex items-center gap-3 rounded-card border border-sunset/30 bg-sunset/10 px-3 py-2.5">
          <span className="text-xs text-sunset">{t.yourRank}</span>
          <span className="flex-1 text-sm font-medium text-ink">
            {fill(t.rankFmt, { n: myRank.rank })}
          </span>
          <span className="font-mono text-sm text-body">
            {myRank.points} {t.ptsUnit}
          </span>
        </div>
      )}
    </div>
  );
}
