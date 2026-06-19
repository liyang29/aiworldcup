// 与 scripts/lib/scoring.mjs 同规则的前端副本（用于分享战绩页计算）。
// 精确5 / 胜负+净胜球3 / 仅走势1 / 错0。这里只算"90分钟比分"部分（不含淘汰赛晋级+2）。
function outcome(h: number, a: number): 'H' | 'A' | 'D' {
  return h > a ? 'H' : h < a ? 'A' : 'D';
}

export function scoreLine(ph: number, pa: number, rh: number, ra: number): number {
  const res = outcome(rh, ra);
  if (ph === rh && pa === ra) return 5;
  if (outcome(ph, pa) === res) {
    if (res !== 'D' && ph - pa === rh - ra) return 3;
    return 1;
  }
  return 0;
}
