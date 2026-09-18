-- Real 2025 Fat Bear Week bracket, replacing the "test-bracket" dev fixture.
-- Structure and results from Aaron's own 2025 bracket deck + cross-checked
-- against public reporting (CBS News, Blizzard Watch). 12 contestants, 4
-- first-round byes (602, 32 Chunk, 128 Grazer, 910), seeded into a 16-slot
-- bracket shape per supabase/migrations/0001_init.sql's bye convention
-- (round-1 matchup with only one contestant filled in = a bye).
--
-- winner_id is fully populated since this tournament already happened, but
-- status stays 'open' so picks can still be exercised for UI testing.
--
-- Run in the Supabase SQL Editor. Safe to re-run (deletes 'test-bracket' first).

delete from public.competitions where slug = 'test-bracket';

with new_competition as (
  insert into public.competitions (slug, name, year, bracket_size, status)
  values ('fat-bear-week-2025', 'Fat Bear Week 2025', 2025, 16, 'open')
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
      ('128 Jr.', null),
      ('609', null),
      ('602', null),
      ('503', null),
      ('901', null),
      ('32 Chunk', 'https://media.explore.org/documents/32chunk-1758560671158.png'),
      ('26', 'https://media.explore.org/documents/26-1758557305581.png'),
      ('909', null),
      ('128 Grazer', null),
      ('99', null),
      ('856', null),
      ('910', null)
    ) as c(name, image_url)
  returning id, name
),
r1 as (
  -- Round 1: 8 slots = 4 real matchups + 4 byes, filling a 16-bracket's
  -- first round. Slot pairs (1,2) feed round 2 slot 1, (3,4) feed slot 2,
  -- etc. — matches the real bracket's Top Left / Bottom Left / Top Right /
  -- Bottom Right quadrant layout.
  insert into public.matchups (competition_id, round, slot_in_round, contestant_a_id, contestant_b_id, winner_id)
  select
    new_competition.id,
    1,
    t.slot,
    (select id from new_contestants where name = t.name_a),
    case when t.name_b is null then null else (select id from new_contestants where name = t.name_b) end,
    (select id from new_contestants where name = t.winner)
  from new_competition,
    (values
      (1, '128 Jr.', '609', '609'),
      (2, '602', null, '602'),          -- bye
      (3, '503', '901', '503'),
      (4, '32 Chunk', null, '32 Chunk'), -- bye
      (5, '26', '909', '909'),
      (6, '128 Grazer', null, '128 Grazer'), -- bye
      (7, '99', '856', '856'),
      (8, '910', null, '910')           -- bye
    ) as t(slot, name_a, name_b, winner)
  returning id, slot_in_round, winner_id
),
r2 as (
  insert into public.matchups (competition_id, round, slot_in_round, winner_id)
  select
    new_competition.id,
    2,
    t.slot,
    (select id from new_contestants where name = t.winner)
  from new_competition,
    (values
      (1, '602'),        -- winner(R1 slot1: 609) vs 602(bye) -> 602
      (2, '32 Chunk'),    -- winner(R1 slot3: 503) vs 32 Chunk(bye) -> Chunk
      (3, '128 Grazer'),  -- winner(R1 slot5: 909) vs 128 Grazer(bye) -> Grazer
      (4, '856')          -- winner(R1 slot7: 856) vs 910(bye) -> 856
    ) as t(slot, winner)
  returning id
),
r3 as (
  insert into public.matchups (competition_id, round, slot_in_round, winner_id)
  select
    new_competition.id,
    3,
    t.slot,
    (select id from new_contestants where name = t.winner)
  from new_competition,
    (values
      (1, '32 Chunk'), -- Top Left vs Bottom Left: 602 vs Chunk -> Chunk
      (2, '856')       -- Top Right vs Bottom Right: Grazer vs 856 -> 856 (ends Grazer's 3-peat bid)
    ) as t(slot, winner)
  returning id
)
insert into public.matchups (competition_id, round, slot_in_round, winner_id)
select
  new_competition.id,
  4,
  1,
  (select id from new_contestants where name = '32 Chunk') -- Chunk wins it all
from new_competition;
