// 抓取各参赛队的 26 人名单（API-Football，免费档 squads 接口，不按赛季计费）。
// 断点续传：已抓过(teams.squad 非空)的队跳过，省请求额度（100/天）。
// 用法：
//   node scripts/sync/squads.mjs            正常抓取（跳过已抓的）
//   node scripts/sync/squads.mjs --force    重抓全部（刷新名单）
//   node scripts/sync/squads.mjs --only=France,Brazil   只抓指定队
import { supabaseAdmin } from '../lib/supabase-admin.mjs';

const KEY = process.env.API_FOOTBALL_KEY;
if (!KEY) throw new Error('缺少 API_FOOTBALL_KEY');
const BASE = 'https://v3.football.api-sports.io';

const FORCE = process.argv.includes('--force');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1].split(',') : null;

// football-data 队名 → API-Football 搜索词的别名修正（仅少数不一致的）
const ALIAS = {
  'Korea Republic': 'South Korea',
  'IR Iran': 'Iran',
  'United States': 'USA',
  'Cape Verde Islands': 'Cape Verde',
  'Bosnia-Herzegovina': 'Bosnia',
  'Côte d’Ivoire': 'Ivory Coast',
  'Cote d’Ivoire': 'Ivory Coast',
};

// 青年队/女队/B 队也常被标 national:true，需排除，只要成年男队
const NON_SENIOR = /\b(U-?\d{2}|W|Women|Olympic|Amateur|B)\b/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 免费档：每天 100 次 + 每分钟 10 次。
// 撞到“每分钟限速”→ 等 60 秒重试；撞到“每日限额”→ 抛 daily（终止）。
async function api(path, perMinRetries = 4) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(BASE + path, { headers: { 'x-apisports-key': KEY } });
    const j = await r.json().catch(() => ({}));
    const errs = j.errors;
    const hasErr = errs && !Array.isArray(errs) && Object.keys(errs).length;
    const msg = hasErr ? JSON.stringify(errs) : '';

    if (r.status === 429 || /per minute|rate limit|too many/i.test(msg)) {
      if (attempt >= perMinRetries) throw new Error('每分钟限速重试多次仍失败: ' + msg);
      console.log(`    …每分钟限速，等 60 秒后重试`);
      await sleep(61000);
      continue;
    }
    if (/for the day|daily|request limit for the day/i.test(msg)) {
      throw Object.assign(new Error('达到每日限额: ' + msg), { daily: true });
    }
    if (hasErr) throw new Error('API 错误: ' + msg);
    return j;
  }
}

// 搜索接口只允许字母数字+空格：去音标、去特殊字符
const normalizeTerm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function findNationalTeamId(name) {
  const term = normalizeTerm(ALIAS[name] || name);
  const j = await api('/teams?search=' + encodeURIComponent(term));
  const list = j.response || [];
  // 成年国家队候选（排除青年/女队）
  const cands = list.filter((x) => x.team?.national && !NON_SENIOR.test(x.team.name));
  const target = normalizeTerm(name).toLowerCase();
  const aliasT = term.toLowerCase();
  const eq = (x) => x.team.name.toLowerCase();
  const pick =
    cands.find((x) => eq(x) === target) || // 原始队名精确匹配（如 "Congo DR"）
    cands.find((x) => eq(x) === aliasT) || // 别名精确匹配
    cands.find((x) => eq(x).includes(target) || target.includes(eq(x))) ||
    cands[0];
  return pick?.team?.id || null;
}

async function fetchSquad(teamId) {
  const j = await api('/players/squads?team=' + teamId);
  const sq = j.response?.[0];
  if (!sq?.players) return null;
  return sq.players.map((p) => ({ name: p.name, position: p.position, number: p.number }));
}

async function main() {
  let q = supabaseAdmin.from('teams').select('id, name, apifootball_id, squad');
  const { data: teams, error } = await q;
  if (error) throw new Error('读 teams 失败: ' + error.message);

  let targets = teams;
  if (ONLY) targets = targets.filter((t) => ONLY.includes(t.name));
  if (!FORCE) targets = targets.filter((t) => !t.squad);

  console.log(`待抓取 ${targets.length} 队（总 ${teams.length}，已抓 ${teams.filter((t) => t.squad).length}）`);

  let ok = 0,
    failed = 0;
  const unmatched = [];

  for (const t of targets) {
    try {
      let teamId = t.apifootball_id;
      if (!teamId) {
        teamId = await findNationalTeamId(t.name);
        await sleep(7000); // 间隔 ~7s，稳在每分钟 10 次限速内
        if (!teamId) {
          unmatched.push(t.name);
          console.warn(`  ✗ 未匹配到国家队: ${t.name}`);
          failed++;
          continue;
        }
      }
      const squad = await fetchSquad(teamId);
      await sleep(7000);
      if (!squad) {
        console.warn(`  ✗ ${t.name} 名单为空`);
        failed++;
        continue;
      }
      const { error: upErr } = await supabaseAdmin
        .from('teams')
        .update({ apifootball_id: teamId, squad, squad_synced_at: new Date().toISOString() })
        .eq('id', t.id);
      if (upErr) throw new Error(upErr.message);
      console.log(`  ✓ ${t.name} → ${squad.length} 人 (apifootball_id ${teamId})`);
      ok++;
    } catch (e) {
      if (e.daily) {
        console.warn(`\n⚠ 触达每日 100 次限额，已抓 ${ok} 队，明日 UTC0点重置后重跑即可（断点续传）`);
        break;
      }
      console.warn(`  ✗ ${t.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n完成：成功 ${ok}，失败 ${failed}`);
  if (unmatched.length) console.log('未匹配（需手动处理）:', unmatched.join(', '));
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
