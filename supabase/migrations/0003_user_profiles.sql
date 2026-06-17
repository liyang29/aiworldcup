-- 用户参与：给 profiles 加头像，新用户自动建档。
-- profiles / user_predictions / RLS 在 0001 已建好，这里只做增量。

alter table public.profiles
  add column if not exists avatar_url text;

-- 新用户注册时（匿名或 OAuth）自动建 profile 行。
-- OAuth 的昵称/头像在元数据里；匿名用户给个 Player-xxxx 占位。
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      'Player ' || substr(new.id::text, 1, 4)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
