-- Dev/test data only — an obviously-fake 8-bear bracket for building and
-- testing the picking UI against. Not real Fat Bear Week data. Safe to
-- re-run: it deletes any existing "test-bracket" competition first.
--
-- Run in the Supabase SQL Editor after the migrations in supabase/migrations/.

delete from public.competitions where slug = 'test-bracket';

with new_competition as (
  insert into public.competitions (slug, name, year, bracket_size, status)
  values ('test-bracket', 'Test Bracket (dev data)', 2026, 8, 'open')
  returning id
),
new_contestants as (
  insert into public.contestants (competition_id, name, seed)
  select new_competition.id, name, seed
  from new_competition,
    (values
      ('Test Bear 1', 1),
      ('Test Bear 2', 2),
      ('Test Bear 3', 3),
      ('Test Bear 4', 4),
      ('Test Bear 5', 5),
      ('Test Bear 6', 6),
      ('Test Bear 7', 7),
      ('Test Bear 8', 8)
    ) as t(name, seed)
  returning id, competition_id, seed
)
insert into public.matchups (competition_id, round, slot_in_round, contestant_a_id, contestant_b_id)
select
  new_competition.id,
  1,
  slot,
  (select id from new_contestants where seed = seed_a),
  (select id from new_contestants where seed = seed_b)
from new_competition,
  (values (1, 1, 8), (2, 4, 5), (3, 2, 7), (4, 3, 6)) as t(slot, seed_a, seed_b)
union all
-- Round 2 and the final: slots exist so the bracket shape is known upfront,
-- but contestants stay null until either real-world results are entered
-- (admin) or, in the UI, a user's own predicted winners resolve them.
select new_competition.id, 2, slot, null, null
from new_competition, (values (1), (2)) as t(slot)
union all
select new_competition.id, 3, 1, null, null
from new_competition;
