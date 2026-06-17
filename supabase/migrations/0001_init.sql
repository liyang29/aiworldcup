-- ============================================================
-- 世界杯 AI 预测竞技场 · 初始 schema + RLS
-- 对应技术规格第 4 节数据模型 + 公信力铁律(1/3/5)
-- 在 Supabase SQL Editor 里整段执行即可。
-- ============================================================

-- 扩展：gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------- 球队 ----------
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  external_id text unique,
  name        text not null,
  code        text,
  flag_url    text,
  fifa_rank   int
);

-- ---------- 比赛 ----------
create table if not exists public.matches (
  id              uuid primary key default gen_random_uuid(),
  external_id     text unique,
  stage           text not null,            -- 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
  group_label     text,                     -- 'A'..'L'，淘汰赛为 null
  home_team_id    uuid references public.teams(id),
  away_team_id    uuid references public.teams(id),
  kickoff_utc     timestamptz not null,
  venue           text,
  status          text not null default 'scheduled', -- 'scheduled' | 'live' | 'finished'
  home_score      int,                      -- 90 分钟(常规时间)比分
  away_score      int,
  advanced_team_id uuid references public.teams(id), -- 淘汰赛晋级队(含加时/点球)，group 阶段 null
  settled_at      timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists matches_kickoff_idx on public.matches (kickoff_utc);
create index if not exists matches_status_idx on public.matches (status);

-- ---------- 参赛模型 ----------
create table if not exists public.models (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,             -- 展示名，如 'DeepSeek V3.2'
  provider       text,                      -- 'DeepSeek' | 'xAI' | ...
  openrouter_slug text not null unique,     -- 当前平台的调用 slug；换平台时改这里
  display_order  int default 0,
  active         bool not null default true
);

-- ---------- 模型预测(赛前锁定，不可改) ----------
create table if not exists public.model_predictions (
  id                  uuid primary key default gen_random_uuid(),
  match_id            uuid not null references public.matches(id) on delete cascade,
  model_id            uuid not null references public.models(id) on delete cascade,
  pred_home           int not null,
  pred_away           int not null,
  pred_advance_team_id uuid references public.teams(id),  -- 仅淘汰赛
  reasoning           text,                  -- 最多 2 句
  locked_at           timestamptz not null,  -- 必须 < matches.kickoff_utc
  points              int,                   -- 赛后算分填入
  created_at          timestamptz not null default now(),
  unique (match_id, model_id)
);
create index if not exists model_pred_match_idx on public.model_predictions (match_id);

-- ---------- 用户档案 ----------
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ---------- 用户预测(赛前锁定，不可改) ----------
create table if not exists public.user_predictions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  match_id            uuid not null references public.matches(id) on delete cascade,
  pred_home           int not null,
  pred_away           int not null,
  pred_advance_team_id uuid references public.teams(id),
  locked_at           timestamptz not null,  -- 必须 < kickoff
  points              int,
  created_at          timestamptz not null default now(),
  unique (user_id, match_id)
);
create index if not exists user_pred_match_idx on public.user_predictions (match_id);
create index if not exists user_pred_user_idx on public.user_predictions (user_id);

-- ============================================================
-- 公信力铁律 · 数据库层强制
-- ============================================================

-- 铁律1：预测的 locked_at 必须早于该场 kickoff，否则拒绝写入。
create or replace function public.enforce_pred_before_kickoff()
returns trigger language plpgsql as $$
declare
  k timestamptz;
begin
  select kickoff_utc into k from public.matches where id = NEW.match_id;
  if k is null then
    raise exception '比赛不存在: %', NEW.match_id;
  end if;
  if NEW.locked_at >= k then
    raise exception '拒绝写入：locked_at(%) 不早于 kickoff(%)，禁止为已/将开赛比赛补录预测', NEW.locked_at, k;
  end if;
  return NEW;
end $$;

-- 铁律3：预测锁定后不可修改(比分等核心字段)。赛后只允许写 points。
create or replace function public.block_locked_pred_update()
returns trigger language plpgsql as $$
begin
  if NEW.pred_home is distinct from OLD.pred_home
     or NEW.pred_away is distinct from OLD.pred_away
     or NEW.pred_advance_team_id is distinct from OLD.pred_advance_team_id
     or NEW.locked_at is distinct from OLD.locked_at
     or NEW.match_id is distinct from OLD.match_id
     or NEW.model_id is distinct from coalesce(OLD.model_id, NEW.model_id) then
    raise exception '预测已锁定，禁止修改核心字段(仅允许赛后写入 points)';
  end if;
  return NEW;
end $$;

create or replace function public.block_locked_user_pred_update()
returns trigger language plpgsql as $$
begin
  if NEW.pred_home is distinct from OLD.pred_home
     or NEW.pred_away is distinct from OLD.pred_away
     or NEW.pred_advance_team_id is distinct from OLD.pred_advance_team_id
     or NEW.locked_at is distinct from OLD.locked_at
     or NEW.match_id is distinct from OLD.match_id
     or NEW.user_id is distinct from OLD.user_id then
    raise exception '预测已锁定，禁止修改核心字段(仅允许赛后写入 points)';
  end if;
  return NEW;
end $$;

drop trigger if exists trg_model_pred_before_kickoff on public.model_predictions;
create trigger trg_model_pred_before_kickoff
  before insert on public.model_predictions
  for each row execute function public.enforce_pred_before_kickoff();

drop trigger if exists trg_model_pred_block_update on public.model_predictions;
create trigger trg_model_pred_block_update
  before update on public.model_predictions
  for each row execute function public.block_locked_pred_update();

drop trigger if exists trg_user_pred_before_kickoff on public.user_predictions;
create trigger trg_user_pred_before_kickoff
  before insert on public.user_predictions
  for each row execute function public.enforce_pred_before_kickoff();

drop trigger if exists trg_user_pred_block_update on public.user_predictions;
create trigger trg_user_pred_block_update
  before update on public.user_predictions
  for each row execute function public.block_locked_user_pred_update();

-- ============================================================
-- RLS
-- ============================================================
alter table public.teams              enable row level security;
alter table public.matches            enable row level security;
alter table public.models             enable row level security;
alter table public.model_predictions  enable row level security;
alter table public.user_predictions   enable row level security;
alter table public.profiles           enable row level security;

-- 公开只读：teams / matches / models / model_predictions
create policy "public read teams"   on public.teams              for select using (true);
create policy "public read matches" on public.matches            for select using (true);
create policy "public read models"  on public.models             for select using (true);
create policy "public read mpred"   on public.model_predictions  for select using (true);
-- 注：写入 teams/matches/models/model_predictions 只走 service_role(绕过 RLS)，
--     不给 anon 任何 insert/update/delete 策略 = 前端无法写(铁律4)。

-- 用户预测：公开可读(人类榜/比赛页对比需要)，
-- 用户只能 insert 自己的、且该场未开赛；不允许 update/delete(铁律5)。
create policy "public read upred" on public.user_predictions
  for select using (true);
create policy "user insert own upred before kickoff" on public.user_predictions
  for insert with check (
    auth.uid() = user_id
    and (select kickoff_utc from public.matches m where m.id = match_id) > now()
  );
-- 故意不建 update/delete 策略 = 已存在的用户预测不可改不可删。

-- profiles：公开可读 display_name；用户可建/改自己的。
create policy "public read profiles" on public.profiles
  for select using (true);
create policy "user upsert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "user update own profile" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
