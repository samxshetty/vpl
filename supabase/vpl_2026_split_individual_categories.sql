-- VPL 2026: split the previously combined individual sports into separate categories.
-- IMPORTANT: This migration maps existing legacy `badminton` records to men's singles
-- and existing legacy `chess` records to men's chess. Review existing rows first if
-- either category already has women/unknown-gender entries or matches.
-- This does not create fake individual registrations; players are added only when entered.

begin;

-- Preserve existing men's-category entries and match history under their new category IDs.
update public.entries set sport_id = 'badminton-mens-singles' where sport_id = 'badminton';
update public.matches set sport_id = 'badminton-mens-singles' where sport_id = 'badminton';

update public.entries set sport_id = 'chess-men' where sport_id = 'chess';
update public.matches set sport_id = 'chess-men' where sport_id = 'chess';

-- Move format configuration while preserving any target configuration already present.
insert into public.sport_formats (sport_id, format, updated_at)
select 'badminton-mens-singles', format, updated_at
from public.sport_formats where sport_id = 'badminton'
on conflict (sport_id) do nothing;
delete from public.sport_formats where sport_id = 'badminton';

insert into public.sport_formats (sport_id, format, updated_at)
select 'chess-men', format, updated_at
from public.sport_formats where sport_id = 'chess'
on conflict (sport_id) do nothing;
delete from public.sport_formats where sport_id = 'chess';

commit;

-- Verify event IDs in use after migration.
select sport_id, kind, count(*) as entry_count
from public.entries
group by sport_id, kind
order by sport_id, kind;
