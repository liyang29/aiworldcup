// 人类榜数据查询（首页 Top5 与预测页 Top100 共用）。
// user_scores 是聚合视图；档案在 profiles。我的排名 = 比我分高的人数 + 1（即使掉出榜单也显示）。

export type HumanRow = { name: string; avatar: string | null; points: number; isMe: boolean };
export type MyRank = { rank: number; points: number } | null;

export async function fetchHumanBoard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  limit: number,
  userId: string | null
): Promise<{ rows: HumanRow[]; myRank: MyRank }> {
  const { data: topScores } = await supabase
    .from('user_scores')
    .select('user_id, total_points')
    .order('total_points', { ascending: false })
    .limit(limit);

  const topIds = (topScores ?? []).map((r: { user_id: string }) => r.user_id);
  const profiles = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  if (topIds.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', topIds);
    for (const p of profs ?? []) profiles.set(p.user_id, p);
  }

  const rows: HumanRow[] = (topScores ?? []).map(
    (r: { user_id: string; total_points: number }) => ({
      name: profiles.get(r.user_id)?.display_name ?? 'Player',
      avatar: profiles.get(r.user_id)?.avatar_url ?? null,
      points: r.total_points,
      isMe: r.user_id === userId,
    })
  );

  let myRank: MyRank = null;
  if (userId) {
    const { data: mine } = await supabase
      .from('user_scores')
      .select('total_points')
      .eq('user_id', userId)
      .maybeSingle();
    if (mine) {
      const { count } = await supabase
        .from('user_scores')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', mine.total_points);
      myRank = { rank: (count ?? 0) + 1, points: mine.total_points };
    }
  }

  return { rows, myRank };
}
