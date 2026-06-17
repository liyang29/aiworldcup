-- 给 teams 增加 API-Football 映射 + 名单缓存。
-- squad 用 jsonb 存 26 人数组：[{name, position, number}]
alter table public.teams
  add column if not exists apifootball_id int,
  add column if not exists squad jsonb,
  add column if not exists squad_synced_at timestamptz;
