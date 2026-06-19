import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { teamName } from '@/i18n/teams';

// 每场比赛的专属社交分享大图（1200×630）：队名 + 比分/VS + 10模型站队 + 品牌。
export const runtime = 'edge';
export const alt = 'AI World Cup match prediction';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string; locale: string } }) {
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
  const finished = mm?.status === 'finished';
  const score = finished ? `${mm.home_score} - ${mm.away_score}` : 'VS';

  let h = 0,
    d = 0,
    a = 0;
  for (const p of preds ?? []) {
    if (p.pred_home > p.pred_away) h++;
    else if (p.pred_home < p.pred_away) a++;
    else d++;
  }
  const total = (preds ?? []).length;

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
          AI World Cup Arena
        </div>

        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', fontSize: 54, fontWeight: 700, textAlign: 'right' }}>
            {home}
          </div>
          <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, color: finished ? '#ffffff' : '#7d8187' }}>
            {score}
          </div>
          <div style={{ display: 'flex', flex: 1, fontSize: 54, fontWeight: 700 }}>{away}</div>
        </div>

        {total > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 26, fontSize: 28 }}>
            <div style={{ display: 'flex', color: '#3b82f6' }}>{`${h} → ${home}`}</div>
            <div style={{ display: 'flex', color: '#9aa0a6' }}>{`${d} draw`}</div>
            <div style={{ display: 'flex', color: '#ef4444' }}>{`${a} → ${away}`}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', fontSize: 28, color: '#9aa0a6' }}>
            10 AI models predict before kickoff
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36, fontSize: 24, color: '#7d8187' }}>
          predworld.fun · GPT · Claude · Gemini · Grok · DeepSeek & more
        </div>
      </div>
    ),
    { ...size }
  );
}
