-- Real 2026 Fat Bear Week bracket, sourced from Explore.org's official
-- bracket poster (transcribed to fat_bear_week_2026_bracket.json, verified
-- slot-by-slot against the poster image) plus Aaron's own expanded bear
-- names/numbers. Unlike 2025 (12 contestants + 4 byes), this year is a
-- clean 16-bear field with no byes.
--
-- Photos are self-hosted under public/contestants/2026/ (downloaded once
-- from media.explore.org and resized) rather than hotlinked, to avoid
-- putting any load on Explore.org's servers as this app's traffic grows.
--
-- The tournament hasn't started yet (Round 1 begins Sept 22), so nothing
-- is decided — this just seeds the structure. Results get filled in
-- round-by-round via SQL as the real competition plays out, the same way
-- 2025's did (see supabase/seed/test_in_progress_results.sql for how that
-- was exercised).
--
-- Run in the Supabase SQL Editor. Safe to re-run (deletes this slug first).

delete from public.competitions where slug = 'fat-bear-week-2026';

with new_competition as (
  insert into public.competitions (slug, name, year, bracket_size, status)
  values ('fat-bear-week-2026', 'Fat Bear Week 2026', 2026, 16, 'open')
  returning id
),
new_contestants as (
  insert into public.contestants (competition_id, name, image_url)
  select
    new_competition.id,
    c.name,
    c.image_url
  from new_competition,
    (values
      ('132 and three Spring Cubs', '/contestants/2026/132.webp'),
      ('284 and two Spring Cubs', '/contestants/2026/284.webp'),
      ('806 and her biological + adopted cubs', '/contestants/2026/806.webp'),
      ('901 and her Spring Cub', '/contestants/2026/901.webp'),
      ('909', '/contestants/2026/909.webp'),
      ('428 Studious', '/contestants/2026/428.webp'),
      ('131', '/contestants/2026/131.webp'),
      ('910', '/contestants/2026/910.webp'),
      ('694', '/contestants/2026/694.webp'),
      ('620', '/contestants/2026/620.webp'),
      ('610 and two Spring Cubs', '/contestants/2026/610.webp'),
      ('89 Backpack', '/contestants/2026/89.webp'),
      ('32 Chunk', '/contestants/2026/32.webp'),
      ('164 Bucky', '/contestants/2026/164.webp'),
      ('151 Walker', '/contestants/2026/151.webp'),
      ('903 Gully', '/contestants/2026/903.webp')
    ) as c(name, image_url)
  returning id, name
),
r1 as (
  -- Round 1: 8 matchups, no byes. Slot pairs (1,2) feed round 2 slot 1,
  -- (3,4) feed slot 2, etc. — matches the poster's left-top / left-bottom /
  -- right-top / right-bottom quadrant layout.
  insert into public.matchups (competition_id, round, slot_in_round, contestant_a_id, contestant_b_id, winner_id)
  select
    new_competition.id,
    1,
    t.slot,
    (select id from new_contestants where name = t.name_a),
    (select id from new_contestants where name = t.name_b),
    null
  from new_competition,
    (values
      (1, '132 and three Spring Cubs', '284 and two Spring Cubs'),
      (2, '806 and her biological + adopted cubs', '901 and her Spring Cub'),
      (3, '909', '428 Studious'),
      (4, '131', '910'),
      (5, '694', '620'),
      (6, '610 and two Spring Cubs', '89 Backpack'),
      (7, '32 Chunk', '164 Bucky'),
      (8, '151 Walker', '903 Gully')
    ) as t(slot, name_a, name_b)
  returning id
),
r2 as (
  insert into public.matchups (competition_id, round, slot_in_round, winner_id)
  select new_competition.id, 2, s, null
  from new_competition, (values (1), (2), (3), (4)) as t(s)
  returning id
),
r3 as (
  insert into public.matchups (competition_id, round, slot_in_round, winner_id)
  select new_competition.id, 3, s, null
  from new_competition, (values (1), (2)) as t(s)
  returning id
)
insert into public.matchups (competition_id, round, slot_in_round, winner_id)
select new_competition.id, 4, 1, null
from new_competition;
