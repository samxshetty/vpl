-- VPL 2026 official schedule data migration.
-- Run in Supabase SQL Editor after schema.sql. Safe to re-run: records are upserted.
-- This contains event windows only; it intentionally does not invent fixtures or brackets.

create table if not exists public.sport_schedule (
  sport_id text primary key,
  sport_name text not null,
  icon text not null default '',
  start_date date not null,
  end_date date not null,
  categories text not null,
  sport_kind text not null check (sport_kind in ('TEAM', 'INDIVIDUAL')),
  updated_at timestamptz not null default now(),
  constraint sport_schedule_dates_valid check (end_date >= start_date)
);

alter table public.sport_schedule enable row level security;
drop policy if exists "public read" on public.sport_schedule;
create policy "public read" on public.sport_schedule for select using (true);
drop policy if exists "admin insert" on public.sport_schedule;
create policy "admin insert" on public.sport_schedule for insert to authenticated with check (public.is_admin());
drop policy if exists "admin update" on public.sport_schedule;
create policy "admin update" on public.sport_schedule for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete" on public.sport_schedule;
create policy "admin delete" on public.sport_schedule for delete to authenticated using (public.is_admin());

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sport_schedule') then
    alter publication supabase_realtime add table public.sport_schedule;
  end if;
end $$;

insert into public.sport_schedule (sport_id, sport_name, icon, start_date, end_date, categories, sport_kind) values
('chess', 'Chess', '♟️', '2026-10-12', '2026-10-13', 'Men’s and women’s', 'INDIVIDUAL'),
('carrom', 'Carrom', '🎯', '2026-10-14', '2026-10-15', 'Men’s and women’s', 'TEAM'),
('volleyball', 'Volleyball', '🏐', '2026-10-16', '2026-10-20', 'Men’s', 'TEAM'),
('throwball', 'Throw Ball', '🥎', '2026-10-16', '2026-10-20', 'Women’s', 'TEAM'),
('football', 'Football', '⚽', '2026-10-22', '2026-10-24', 'Men’s', 'TEAM'),
('badminton', 'Badminton', '🏸', '2026-10-26', '2026-10-28', 'Men’s singles, women’s singles, mixed doubles', 'INDIVIDUAL'),
('dodgeball', 'Dodgeball', '🤾', '2026-11-05', '2026-11-06', 'Women’s', 'TEAM'),
('basketball', 'Basketball', '🏀', '2026-11-05', '2026-11-06', 'Men’s', 'TEAM'),
('cricket', 'Cricket', '🏏', '2026-11-07', '2026-11-07', 'Men’s and women’s', 'TEAM'),
('mixed-relay', '4×100 m Relay', '🏃', '2026-11-09', '2026-11-09', 'Men’s and women’s', 'TEAM'),
('tug-of-war', 'Tug of War', '🪢', '2026-11-09', '2026-11-11', 'Men’s and women’s', 'TEAM')
on conflict (sport_id) do update set
  sport_name = excluded.sport_name,
  icon = excluded.icon,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  categories = excluded.categories,
  sport_kind = excluded.sport_kind,
  updated_at = now();
