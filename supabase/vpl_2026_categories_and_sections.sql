-- VPL 2026: seed the 13 section teams into every TEAM category.
-- Safe to re-run: it skips a section that already exists for that category.
-- Run in Supabase SQL Editor after deploying the matching frontend code.

with team_categories(sport_id) as (
  values
    ('cricket'),
    ('cricket-women'),
    ('football'),
    ('volleyball'),
    ('badminton-mixed-doubles'),
    ('carrom'),
    ('carrom-women'),
    ('tug-of-war'),
    ('tug-of-war-women'),
    ('basketball'),
    ('throwball'),
    ('mixed-relay'),
    ('mixed-relay-women'),
    ('dodgeball')
),
sections(section) as (
  values ('3A'), ('3B'), ('3C'), ('3D'), ('3E'),
         ('5A'), ('5B'), ('5C'), ('5D'),
         ('7A'), ('7B'), ('7C'), ('7D')
)
insert into public.entries (id, sport_id, kind, name, section, players, usn, class_name)
select
  'vpl26-' || tc.sport_id || '-' || s.section,
  tc.sport_id,
  'team',
  s.section,
  s.section,
  '[]'::jsonb,
  null,
  null
from team_categories tc
cross join sections s
where not exists (
  select 1
  from public.entries existing
  where existing.sport_id = tc.sport_id
    and existing.kind = 'team'
    and upper(trim(coalesce(existing.section, ''))) = s.section
);

-- Verify: expected 13 team entries for each team category.
select sport_id, count(*) as section_teams
from public.entries
where kind = 'team'
  and sport_id in (
    'cricket', 'cricket-women', 'football', 'volleyball',
    'badminton-mixed-doubles', 'carrom', 'carrom-women',
    'tug-of-war', 'tug-of-war-women', 'basketball', 'throwball',
    'mixed-relay', 'mixed-relay-women', 'dodgeball'
  )
group by sport_id
order by sport_id;
