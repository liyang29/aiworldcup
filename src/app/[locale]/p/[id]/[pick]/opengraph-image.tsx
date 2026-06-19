import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { scoreLine } from '@/lib/scoring';
import { teamName } from '@/i18n/teams';

// 个人战绩分享卡（1200×630）：我的预测比分 + 与10个AI的对比 + 品牌。
export const runtime = 'edge';
export const alt = 'My World Cup prediction vs the AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const outcome = (h: number, a: number) => (h > a ? 'H' : h < a ? 'A' : 'D');
const parsePick = (p: string): [number, number] => {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(p);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
};

export default async function Image({ params }: { params: { id: string; pick: string; locale: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: m } = await supabase
    .from('matches')
    .select('status, home_score, away_score, home:home_team_id(name), away:away_team_id(name)')
    .eq('id', params.id)
    .single();
  const { data: preds } = await supabase
    .from('model_predictions')
    .select('pred_home, pred_away')
    .eq('match_id', params.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mm = m as any;
  const home = teamName(mm?.home?.name, params.locale) || 'Home';
  const away = teamName(mm?.away?.name, params.locale) || 'Away';
  const [ph, pa] = parsePick(params.pick);
  const finished = mm?.status === 'finished' && mm?.home_score != null;
  const list = preds ?? [];
  const total = list.length;

  let line = '';
  if (finished) {
    const mine = scoreLine(ph, pa, mm.home_score, mm.away_score);
    const beat = list.filter((p) => scoreLine(p.pred_home, p.pred_away, mm.home_score, mm.away_score) < mine).length;
    line = `Final ${mm.home_score}-${mm.away_score} · beat ${beat} of ${total} AIs`;
  } else {
    const po = outcome(ph, pa);
    const agree = list.filter((p) => outcome(p.pred_home, p.pred_away) === po).length;
    line = total ? `${agree} of ${total} AIs agree` : 'vs 10 AI models';
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '70px',
          background: '#0a0a0b',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 3, color: '#ff7a17', textTransform: 'uppercase' }}>
          My pick vs the AI
        </div>

        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', fontSize: 46, fontWeight: 700, textAlign: 'right' }}>
            {home}
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, color: '#ff7a17' }}>
            {ph}-{pa}
          </div>
          <div style={{ display: 'flex', flex: 1, fontSize: 46, fontWeight: 700 }}>{away}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', fontSize: 30, color: '#e5e7eb' }}>{line}</div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, fontSize: 26, color: '#7d8187' }}>
          predworld.fun · can you beat the AI?
        </div>
      </div>
    ),
    { ...size }
  );
}
