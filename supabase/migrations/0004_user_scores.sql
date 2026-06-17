-- 用户积分聚合视图：人类榜"前 100 + 自己排名"用，避免把全表拉进内存。
-- security_invoker=on：按调用者权限走（user_predictions 本就公开可读）。
create or replace view public.user_scores
with (security_invoker = on) as
select
  up.user_id,
  coalesce(sum(up.points), 0)::int as total_points,
  count(*)::int as predictions
from public.user_predictions up
group by up.user_id;

grant select on public.user_scores to anon, authenticated;
