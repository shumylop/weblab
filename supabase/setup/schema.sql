-- Apply only to the dedicated WEB LAB project.
create table public.weblab_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  nickname text not null check (char_length(nickname) between 1 and 40),
  role text not null check (role in ('teacher', 'student')),
  enabled boolean not null default true,
  valid_after bigint not null default 0,
  created_at timestamptz not null default now()
);
create table public.weblab_progress (
  user_id uuid primary key references public.weblab_accounts(id) on delete cascade,
  payload jsonb,
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  check (octet_length(payload::text) <= 2000000)
);
alter table public.weblab_accounts enable row level security;
alter table public.weblab_progress enable row level security;
revoke all on public.weblab_accounts, public.weblab_progress from anon, authenticated;
grant select on public.weblab_accounts to authenticated;
grant select, insert, update on public.weblab_progress to authenticated;
grant all on public.weblab_accounts, public.weblab_progress to service_role;
create policy own_account on public.weblab_accounts for select to authenticated using (id = (select auth.uid()) and coalesce((select (auth.jwt()->>'iat')::bigint),0) >= valid_after);
create policy own_progress_read on public.weblab_progress for select to authenticated using (
 user_id = (select auth.uid()) and exists (select 1 from public.weblab_accounts a where a.id = (select auth.uid()) and a.enabled)
);
create policy own_progress_insert on public.weblab_progress for insert to authenticated with check (
 user_id = (select auth.uid()) and revision = 0 and exists (select 1 from public.weblab_accounts a where a.id = (select auth.uid()) and a.enabled)
);
create policy own_progress_update on public.weblab_progress for update to authenticated using (
 user_id = (select auth.uid()) and exists (select 1 from public.weblab_accounts a where a.id = (select auth.uid()) and a.enabled)
) with check (
 user_id = (select auth.uid()) and exists (select 1 from public.weblab_accounts a where a.id = (select auth.uid()) and a.enabled)
);
