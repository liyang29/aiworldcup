// 算分任务（赛后）。先确保已 sync 过最新比分/状态，再对已结束但未结算的比赛算分。
// 给该场所有模型预测 + 用户预测算分，写 points，并标记 matches.settled_at。
import { supabaseAdmin } from '../lib/supabase-admin.mjs';
import { scorePrediction } from '../lib/scoring.mjs';

const DRY = process.argv.includes('--dry');

async function finishedUnsettled() {
  const { data, error } = await supabaseAdmin
    .from('matches')
    .select('id, stage, home_score, away_score, advanced_team_id')
    .eq('status', 'finished')
    .is('settled_at', null)
    .not('home_score', 'is', null)
    .not('away_score', 'is', null);
  if (error) throw new Error('读 matches 失败: ' + error.message);
  return data;
}

async function settleMatch(match) {
  const knockout = match.stage !== 'group';
  const result = {
    home_score: match.home_score,
    away_score: match.away_score,
    advanced_team_id: match.advanced_team_id,
  };

  let count = 0;
  for (const table of ['model_predictions', 'user_predictions']) {
    const { data: preds, error } = await supabaseAdmin
      .from(table)
      .select('id, pred_home, pred_away, pred_advance_team_id')
      .eq('match_id', match.id);
    if (error) throw new Error(`读 ${table} 失败: ` + error.message);

    for (const p of preds) {
      const pts = scorePrediction(p, result, { knockout });
      if (DRY) {
        count++;
        continue;
      }
      const { error: upErr } = await supabaseAdmin
        .from(table)
        .update({ points: pts })
        .eq('id', p.id);
      if (upErr) throw new Error(`更新 ${table} points 失败: ` + upErr.message);
      count++;
    }
  }

  if (!DRY) {
    const { error } = await supabaseAdmin
      .from('matches')
      .update({ settled_at: new Date().toISOString() })
      .eq('id', match.id);
    if (error) throw new Error('标记 settled_at 失败: ' + error.message);
  }
  return count;
}

async function main() {
  const matches = await finishedUnsettled();
  console.log(`待结算比赛 ${matches.length} 场`);
  let total = 0;
  for (const m of matches) {
    const n = await settleMatch(m);
    total += n;
    console.log(`  ✓ 比赛 ${m.id.slice(0, 8)} (${m.stage}) ${m.home_score}-${m.away_score} → 结算 ${n} 条预测`);
  }
  console.log(`\n完成：共结算 ${total} 条预测${DRY ? '（dry，未写库）' : ''}`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
