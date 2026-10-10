-- VPL — Supabase schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- ───────────────────────── Tables ─────────────────────────

create table if not exists public.entries (
  id          text primary key,
  sport_id    text not null,
  kind        text not null check (kind in ('team', 'solo')),
  name        text not null,
  section     text,                              -- teams
  players     jsonb not null default '[]'::jsonb, -- teams: [{id, name, usn}]
  usn         text,                              -- solo players
  class_name  text,                              -- solo players
  created_at  timestamptz not null default now()
);
create index if not exists entries_sport_idx on public.entries (sport_id);

create table if not exists public.matches (
  id             text primary key,
  sport_id       text not null,
  format         text not null check (format in ('ROUND_ROBIN', 'KNOCKOUT', 'SINGLE')),
  stage          text not null default '',
  round          int  not null default 1,
  slot           int  not null default 0,
  a_id           text references public.entries (id) on delete set null,
  b_id           text references public.entries (id) on delete set null,
  starts_at      text,                           -- local wall-clock "YYYY-MM-DDTHH:mm", same as the app
  venue          text not null default '',
  status         text not null default 'UPCOMING' check (status in ('UPCOMING', 'LIVE', 'COMPLETED')),
  score_a        text not null default '',
  score_b        text not null default '',
  result         text check (result in ('A', 'B', 'DRAW')),
  note           text not null default '',
  bye            boolean not null default false,
  next_match_id  text,
  next_side      text check (next_side in ('A', 'B')),
  updated_at     timestamptz not null default now()
);
create index if not exists matches_sport_idx  on public.matches (sport_id);
create index if not exists matches_status_idx on public.matches (status);

create table if not exists public.sport_formats (
  sport_id    text primary key,
  format      text not null check (format in ('ROUND_ROBIN', 'KNOCKOUT', 'SINGLE')),
  updated_at  timestamptz not null default now()
);

-- Keep matches.updated_at fresh.
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists matches_touch on public.matches;
create trigger matches_touch before update on public.matches
  for each row execute function public.touch_updated_at();

-- ───────────────────────── Security (RLS) ─────────────────────────
-- Everyone (anonymous visitors included) can READ.
-- Only a signed-in user whose app_metadata.role = 'admin' can WRITE.

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

alter table public.entries       enable row level security;
alter table public.matches       enable row level security;
alter table public.sport_formats enable row level security;

do $$
declare t text;
begin
  foreach t in array array['entries', 'matches', 'sport_formats'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);

    execute format('drop policy if exists "admin insert" on public.%I', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check (public.is_admin())', t);

    execute format('drop policy if exists "admin update" on public.%I', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);

    execute format('drop policy if exists "admin delete" on public.%I', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- ───────────────────────── Realtime ─────────────────────────

do $$
declare t text;
begin
  foreach t in array array['entries', 'matches', 'sport_formats'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ───────────────────────── Make yourself an admin ─────────────────────────
-- 1. Authentication -> Users -> Add user (email + password, tick "Auto confirm").
-- 2. Run this with your email:
--
--   update auth.users
--   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
--   where email = 'you@example.com';
--
-- Sign out and back in afterwards so the new role is in your session.
