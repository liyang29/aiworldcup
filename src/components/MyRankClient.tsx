'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// 缓存页面里展示"你的排名"：登录态与排名在客户端取，不影响页面缓存。
export default function MyRankClient({
  t,
}: {
  t: { yourRank: string; rankFmt: string; ptsUnit: string };
}) {
  const [rank, setRank] = useState<{ rank: number; points: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data: mine } = await supabase
        .from('user_scores')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!mine || !active) return;
      const { count } = await supabase
        .from('user_scores')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', mine.total_points);
      if (!active) return;
      setRank({ rank: (count ?? 0) + 1, points: mine.total_points });
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!rank) return null;
  return (
    <div className="mt-2 flex items-center gap-3 rounded-card border border-sunset/30 bg-sunset/10 px-3 py-2.5">
      <span className="text-xs text-sunset">{t.yourRank}</span>
      <span className="flex-1 text-sm font-medium text-ink">{t.rankFmt.replace('{n}', String(rank.rank))}</span>
      <span className="font-mono text-sm text-body">
        {rank.points} {t.ptsUnit}
      </span>
    </div>
  );
}
