// 统一上下文简报 + 统一提示词（铁律2：所有模型完全相同的输入）
// 对应技术规格第 5 节模板。

const KNOCKOUT_STAGES = new Set(['r32', 'r16', 'qf', 'sf', 'final']);

/**
 * 构造给某场比赛的统一 system/user 提示词。
 * @param {object} ctx
 * @param {string} ctx.home   主队名
 * @param {string} ctx.away   客队名
 * @param {string} ctx.stage  阶段 'group'|'r32'|...
 * @param {string} [ctx.group] 小组标签
 * @param {string} [ctx.venue] 球场
 * @param {number} [ctx.homeRank] 主队 FIFA 排名
 * @param {number} [ctx.awayRank] 客队 FIFA 排名
 * @param {string} [ctx.homeForm] 主队近 5 场
 * @param {string} [ctx.awayForm] 客队近 5 场
 * @param {string} [ctx.standings] 小组积分情况
 */
export function buildPrompt(ctx) {
  const isKnockout = KNOCKOUT_STAGES.has(ctx.stage);

  const system =
    'You are predicting a football (soccer) match at the 2026 FIFA World Cup.\n' +
    'Predict the final scoreline after 90 minutes (regulation time only).\n' +
    (isKnockout
      ? 'Also predict which team advances (after extra time/penalties if needed).\n'
      : '') +
    'Consider the venue: altitude, climate/heat, and travel can affect the teams ' +
    '(e.g. high-altitude venues favor acclimatized sides and tire visitors).\n' +
    'You MAY use up-to-date web information (injuries, suspensions, recent form, confirmed lineups, team news) ' +
    'to inform your prediction. Weigh the actual available players (key stars, depth, absences).\n' +
    'This is a pre-match prediction: commit to a final scoreline now, before kickoff.\n' +
    'Respond with STRICT JSON only, no markdown:\n' +
    '{"home_score": int, "away_score": int, "advance_team": "<team name or null>", "reasoning": "<max 2 sentences>"}';

  // 名单格式化：按位置精简列出（控制长度，公平性：两队同样处理）
  const fmtSquad = (sq) => {
    if (!sq || !sq.length) return 'N/A';
    return sq.map((p) => p.name).join(', ');
  };

  const user =
    `Match: ${ctx.home} vs ${ctx.away}\n` +
    `Stage: ${ctx.stage}${ctx.group ? ' ' + ctx.group : ''}\n` +
    `Venue: ${ctx.venue || 'N/A'}\n` +
    `FIFA rank: ${ctx.home} #${ctx.homeRank ?? 'N/A'}, ${ctx.away} #${ctx.awayRank ?? 'N/A'}\n` +
    `Recent form (last 5): ${ctx.home}: ${ctx.homeForm || 'N/A'} | ${ctx.away}: ${ctx.awayForm || 'N/A'}\n` +
    `Group standings: ${ctx.standings || 'N/A'}\n` +
    `${ctx.home} squad: ${fmtSquad(ctx.homeSquad)}\n` +
    `${ctx.away} squad: ${fmtSquad(ctx.awaySquad)}`;

  return { system, user, isKnockout };
}
