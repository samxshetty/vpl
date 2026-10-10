-- VPL 2026 category ID standardization.
-- IMPORTANT: This updates only entries, matches, and sport_formats.
-- Parent sport_schedule IDs and their dates are deliberately untouched.
-- Safe for the current reset state (entries and matches are empty); transaction
-- and temporary IDs also avoid collisions if legacy rows still exist.

begin;

-- Move legacy IDs to temporary IDs first, avoiding primary-key collisions.
with id_map(old_id, new_id) as (values
  ('cricket', 'cricket-men'),
  ('football', 'football-men'),
  ('volleyball', 'volleyball-men'),
  ('badminton-mens-singles', 'badminton-men-singles'),
  ('badminton-womens-singles', 'badminton-women-singles'),
  ('carrom', 'carrom-men'),
  ('basketball', 'basketball-men'),
  ('throwball', 'throwball-women'),
  ('tug-of-war', 'tug-of-war-men'),
  ('mixed-relay', 'relay-men'),
  ('mixed-relay-women', 'relay-women'),
  ('dodgeball', 'dodgeball-women')
)
update public.entries e
set sport_id = '__vpl_category_migration__' || m.new_id
from id_map m where e.sport_id = m.old_id;

with id_map(old_id, new_id) as (values
  ('cricket', 'cricket-men'), ('football', 'football-men'), ('volleyball', 'volleyball-men'),
  ('badminton-mens-singles', 'badminton-men-singles'), ('badminton-womens-singles', 'badminton-women-singles'),
  ('carrom', 'carrom-men'), ('basketball', 'basketball-men'), ('throwball', 'throwball-women'),
  ('tug-of-war', 'tug-of-war-men'), ('mixed-relay', 'relay-men'),
  ('mixed-relay-women', 'relay-women'), ('dodgeball', 'dodgeball-women')
)
update public.matches m
set sport_id = '__vpl_category_migration__' || x.new_id
from id_map x where m.sport_id = x.old_id;

with id_map(old_id, new_id) as (values
  ('cricket', 'cricket-men'), ('football', 'football-men'), ('volleyball', 'volleyball-men'),
  ('badminton-mens-singles', 'badminton-men-singles'), ('badminton-womens-singles', 'badminton-women-singles'),
  ('carrom', 'carrom-men'), ('basketball', 'basketball-men'), ('throwball', 'throwball-women'),
  ('tug-of-war', 'tug-of-war-men'), ('mixed-relay', 'relay-men'),
  ('mixed-relay-women', 'relay-women'), ('dodgeball', 'dodgeball-women')
)
update public.sport_formats f
set sport_id = '__vpl_category_migration__' || x.new_id
from id_map x where f.sport_id = x.old_id;

update public.entries set sport_id = replace(sport_id, '__vpl_category_migration__', '')
where left(sport_id, length('__vpl_category_migration__')) = '__vpl_category_migration__';
update public.matches set sport_id = replace(sport_id, '__vpl_category_migration__', '')
where left(sport_id, length('__vpl_category_migration__')) = '__vpl_category_migration__';
update public.sport_formats set sport_id = replace(sport_id, '__vpl_category_migration__', '')
where left(sport_id, length('__vpl_category_migration__')) = '__vpl_category_migration__';

-- Handle the old generic chess/badminton format keys, without changing schedule IDs.
-- If a target format already exists, keep it and remove the legacy key.
insert into public.sport_formats (sport_id, format, updated_at)
select 'chess-men', format, updated_at from public.sport_formats where sport_id = 'chess'
on conflict (sport_id) do nothing;
delete from public.sport_formats where sport_id = 'chess';

insert into public.sport_formats (sport_id, format, updated_at)
select 'badminton-men-singles', format, updated_at from public.sport_formats where sport_id = 'badminton'
on conflict (sport_id) do nothing;
delete from public.sport_formats where sport_id = 'badminton';

commit;

-- Verify category IDs. These queries do not touch sport_schedule.
select sport_id, count(*) as entries from public.entries group by sport_id order by sport_id;
select sport_id, count(*) as matches from public.matches group by sport_id order by sport_id;
select sport_id, format from public.sport_formats order by sport_id;
