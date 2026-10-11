-- VPL 2026: official championship placement points only.
-- Run in Supabase SQL Editor. Existing match results are not converted into points.

create table if not exists public.sport_awards (
  sport_id text primary key,
  winner_entry_id text,
  runner_up_entry_id text,
  semifinalist_a_entry_id text,
  semifinalist_b_entry_id text,
  updated_at timestamptz not null default now()
);

alter table public.sport_awards enable row level security;
drop policy if exists "public read" on public.sport_awards;
create policy "public read" on public.sport_awards for select using (true);
drop policy if exists "admin insert" on public.sport_awards;
create policy "admin insert" on public.sport_awards for insert to authenticated with check (public.is_admin());
drop policy if exists "admin update" on public.sport_awards;
create policy "admin update" on public.sport_awards for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete" on public.sport_awards;
create policy "admin delete" on public.sport_awards for delete to authenticated using (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sport_awards'
  ) then
    alter publication supabase_realtime add table public.sport_awards;
  end if;
end $$;
