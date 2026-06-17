// 计分规则（模型与用户完全相同）。对比 90 分钟比分。
// - 精确比分        : 5
// - 胜负对 + 净胜球对(非精确): 3
// - 仅胜负对(含平局)  : 1
// - 胜负错          : 0
// - 淘汰赛额外: pred_advance == advanced 则 +2
//
// 返回总分。淘汰赛加分通过 opts 传入。

function outcome(h, a) {
  return h > a ? 'H' : h < a ? 'A' : 'D';
}

/**
 * @param {{pred_home:number, pred_away:number, pred_advance_team_id?:string|null}} pred
 * @param {{home_score:number, away_score:number, advanced_team_id?:string|null}} result
 * @param {{knockout?:boolean}} [opts]
 */
export function scorePrediction(pred, result, opts = {}) {
  const { pred_home: ph, pred_away: pa } = pred;
  const { home_score: rh, away_score: ra } = result;

  let pts = 0;
  const res = outcome(rh, ra);
  if (ph === rh && pa === ra) {
    pts = 5; // 精确比分
  } else if (outcome(ph, pa) === res) {
    // 胜负走势对。净胜球加分只适用于决胜局——
    // 平局净胜球恒为 0，若也给 3 分会让平局比决胜局更易得分，不公平，
    // 故平局非精确只给 1 分（仅走势对）。
    if (res !== 'D' && ph - pa === rh - ra) pts = 3; // 决胜局且净胜球也对
    else pts = 1; // 仅走势对（含所有非精确平局）
  } else {
    pts = 0; // 胜负错
  }

  // 淘汰赛晋级判定 +2
  if (opts.knockout && pred.pred_advance_team_id && result.advanced_team_id) {
    if (pred.pred_advance_team_id === result.advanced_team_id) pts += 2;
  }

  return pts;
}
