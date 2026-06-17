// 预测引擎（赛前任务）。
// 只处理：status='scheduled' 且 kickoff_utc > now() 且该模型尚无预测的比赛。
// 对每个 active 模型用统一上下文+统一提示词调用，锁定写入 model_predictions。
// 公信力铁律：locked_at = now() 且必断言 < kickoff（数据库层也有触发器兜底）。
import { supabaseAdmin } from '../lib/supabase-admin.mjs';
import { callModelJSON } from '../lib/llm.mjs';
import { buildPrompt } from '../lib/prompt.mjs';

const DRY = process.argv.includes('--dry');
// --limit N：只处理最近的 N 场（验证/控制成本用）
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

async function getActiveModels() {
  const { data, error } = await supabaseAdmin
    .from('models')
    .select('id, name, openrouter_slug')
    .eq('active', true);
  if (error) throw new Error('读 models 失败: ' + error.message);
  return data;
}

async function getUpcomingMatches() {
  const { data, error } = await supabaseAdmin
    .from('matches')
    .select(
      'id, stage, group_label, venue, kickoff_utc, home_team_id, away_team_id, ' +
        'home:home_team_id(name, fifa_rank, squad), away:away_team_id(name, fifa_rank, squad)'
    )
    .eq('status', 'scheduled')
    .gt('kickoff_utc', new Date().toISOString())
    .order('kickoff_utc', { ascending: true });
  if (error) throw new Error('读 matches 失败: ' + error.message);
  return data;
}

async function existingPairs(matchIds) {
  if (matchIds.length === 0) return new Set();
  const { data, error } = await supabaseAdmin
    .from('model_predictions')
    .select('match_id, model_id')
    .in('match_id', matchIds);
  if (error) throw new Error('读 model_predictions 失败: ' + error.message);
  return new Set(data.map((r) => `${r.match_id}:${r.model_id}`));
}

function validatePred(obj) {
  const h = Number(obj.home_score);
  const a = Number(obj.away_score);
  if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
    throw new Error('比分非法: ' + JSON.stringify(obj));
  }
  return {
    pred_home: h,
    pred_away: a,
    advance_team: obj.advance_team ?? null,
    reasoning: typeof obj.reasoning === 'string' ? obj.reasoning.slice(0, 500) : null,
  };
}

async function main() {
  const [models, allMatches] = await Promise.all([getActiveModels(), getUpcomingMatches()]);
  const matches = Number.isFinite(LIMIT) ? allMatches.slice(0, LIMIT) : allMatches;
  console.log(
    `active 模型 ${models.length} 个 | 待预测比赛 ${allMatches.length} 场` +
      (Number.isFinite(LIMIT) ? `（本次只处理前 ${matches.length} 场）` : '')
  );
  if (models.length === 0 || matches.length === 0) return;

  const done = await existingPairs(matches.map((m) => m.id));

  // 淘汰赛晋级队名 → team_id 映射（按本场两队名）
  let inserted = 0,
    skipped = 0,
    failed = 0;

  for (const match of matches) {
    const kickoff = new Date(match.kickoff_utc);
    const { system, user, isKnockout } = buildPrompt({
      home: match.home?.name,
      away: match.away?.name,
      stage: match.stage,
      group: match.group_label,
      venue: match.venue,
      homeRank: match.home?.fifa_rank,
      awayRank: match.away?.fifa_rank,
      homeSquad: match.home?.squad,
      awaySquad: match.away?.squad,
    });

    for (const model of models) {
      const key = `${match.id}:${model.id}`;
      if (done.has(key)) {
        skipped++;
        continue;
      }
      try {
        const raw = await callModelJSON(model.openrouter_slug, { system, user });
        const v = validatePred(raw);

        const lockedAt = new Date();
        if (lockedAt >= kickoff) {
          // 临开赛，放弃（铁律1）
          console.warn(`  ⏭ ${match.home?.name} vs ${match.away?.name} 已临近开赛，跳过`);
          skipped++;
          continue;
        }

        // 淘汰赛：把模型给的队名映射回本场某一队
        let advanceId = null;
        if (isKnockout && v.advance_team) {
          const nm = String(v.advance_team).toLowerCase();
          if (match.home?.name?.toLowerCase() === nm) advanceId = match.home_team_id;
          else if (match.away?.name?.toLowerCase() === nm) advanceId = match.away_team_id;
        }

        const row = {
          match_id: match.id,
          model_id: model.id,
          pred_home: v.pred_home,
          pred_away: v.pred_away,
          pred_advance_team_id: advanceId,
          reasoning: v.reasoning,
          locked_at: lockedAt.toISOString(),
        };

        if (DRY) {
          console.log(`  [dry] ${model.name} → ${match.home?.name} ${v.pred_home}-${v.pred_away} ${match.away?.name}`);
          inserted++;
          continue;
        }

        const { error } = await supabaseAdmin.from('model_predictions').insert(row);
        if (error) throw new Error(error.message);
        inserted++;
      } catch (e) {
        failed++;
        console.warn(`  ⚠ ${model.name} @ ${match.home?.name} vs ${match.away?.name}: ${e.message}`);
      }
    }
  }

  console.log(`\n完成：写入 ${inserted}，跳过 ${skipped}，失败 ${failed}${DRY ? '（dry，未实际写库）' : ''}`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
