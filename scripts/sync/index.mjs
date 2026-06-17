// 赛程同步（赛后也用它更新比分/状态）。
// 数据源：football-data.org v4，competition WC（FIFA World Cup）。
// 用法：
//   node scripts/sync/index.mjs          正式同步进数据库
//   node scripts/sync/index.mjs --dry     干跑，只打印转换结果，不写库
import { supabaseAdmin } from '../lib/supabase-admin.mjs';

const DRY = process.argv.includes('--dry');
const FOOTBALL_KEY = process.env.FOOTBALL_API_KEY;
if (!FOOTBALL_KEY) throw new Error('缺少 FOOTBALL_API_KEY');

// football-data 阶段 → 本项目 stage
const STAGE_MAP = {
  GROUP_STAGE: 'group',
  LAST_32: 'r32',
  ROUND_OF_32: 'r32',
  LAST_16: 'r16',
  ROUND_OF_16: 'r16',
  QUARTER_FINALS: 'qf',
  SEMI_FINALS: 'sf',
  THIRD_PLACE: 'third',
  PLAY_OFF_FOR_THIRD_PLACE: 'third',
  FINAL: 'final',
};

const statusMap = (s) =>
  s === 'FINISHED' ? 'finished' : s === 'IN_PLAY' || s === 'PAUSED' ? 'live' : 'scheduled';

async function fetchMatches() {
  const r = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': FOOTBALL_KEY },
  });
  if (!r.ok) throw new Error(`football API HTTP ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.matches || [];
}

function collectTeams(matches) {
  const map = new Map();
  for (const m of matches) {
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (t?.id && !map.has(t.id)) {
        map.set(t.id, {
          external_id: String(t.id),
          name: t.name || t.shortName || t.tla || `Team ${t.id}`,
          code: t.tla || null,
          flag_url: t.crest || null,
        });
      }
    }
  }
  return [...map.values()];
}

async function main() {
  const matches = await fetchMatches();
  console.log(`拉取到 ${matches.length} 场比赛`);

  const teams = collectTeams(matches);
  console.log(`涉及 ${teams.length} 支球队`);

  if (DRY) {
    console.log('\n--- 干跑：阶段分布 ---');
    const byStage = {};
    for (const m of matches) {
      const s = STAGE_MAP[m.stage] || `?${m.stage}`;
      byStage[s] = (byStage[s] || 0) + 1;
    }
    console.log(byStage);
    const sample = matches[0];
    console.log('\n--- 示例首场（原始字段）---');
    console.log(JSON.stringify(
      { stage: sample.stage, group: sample.group, status: sample.status,
        utcDate: sample.utcDate, home: sample.homeTeam?.name, away: sample.awayTeam?.name,
        score: sample.score }, null, 2));
    return;
  }

  // 1) upsert teams
  const { data: teamRows, error: teamErr } = await supabaseAdmin
    .from('teams')
    .upsert(teams, { onConflict: 'external_id' })
    .select('id, external_id');
  if (teamErr) throw new Error('写 teams 失败: ' + teamErr.message);
  const teamIdByExt = new Map(teamRows.map((t) => [t.external_id, t.id]));
  console.log(`✓ teams 同步 ${teamRows.length}`);

  // 2) upsert matches
  const rows = matches.map((m) => {
    const finished = m.status === 'FINISHED';
    const stage = STAGE_MAP[m.stage] || 'group';
    const isKnockout = stage !== 'group';

    // 90 分钟比分：优先用 regularTime（若平台提供），否则 REGULAR 时长用 fullTime。
    // 淘汰赛进加时/点球时 fullTime 含加时，此时若无 regularTime 则置 null，待人工/后续校正。
    const reg = m.score?.regularTime;
    let hs = null,
      as = null;
    if (finished) {
      if (reg && reg.home != null) {
        hs = reg.home;
        as = reg.away;
      } else if (m.score?.duration === 'REGULAR') {
        hs = m.score?.fullTime?.home ?? null;
        as = m.score?.fullTime?.away ?? null;
      }
    }

    // 淘汰赛晋级队（含加时/点球后最终结果）：用 score.winner
    let advancedId = null;
    if (finished && isKnockout) {
      if (m.score?.winner === 'HOME_TEAM') advancedId = teamIdByExt.get(String(m.homeTeam?.id)) || null;
      else if (m.score?.winner === 'AWAY_TEAM') advancedId = teamIdByExt.get(String(m.awayTeam?.id)) || null;
    }

    return {
      external_id: String(m.id),
      stage,
      group_label: m.group ? m.group.replace(/^GROUP_/, '') : null,
      home_team_id: teamIdByExt.get(String(m.homeTeam?.id)) || null,
      away_team_id: teamIdByExt.get(String(m.awayTeam?.id)) || null,
      kickoff_utc: m.utcDate,
      venue: m.venue || null,
      status: statusMap(m.status),
      home_score: hs,
      away_score: as,
      advanced_team_id: advancedId,
    };
  });

  const { data: matchRows, error: matchErr } = await supabaseAdmin
    .from('matches')
    .upsert(rows, { onConflict: 'external_id' })
    .select('id');
  if (matchErr) throw new Error('写 matches 失败: ' + matchErr.message);
  console.log(`✓ matches 同步 ${matchRows.length}`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
