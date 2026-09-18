-- Requires test_leaderboard_users.sql to have run first (needs the "Test
-- User 1/2/3" profiles to exist). Gives each one a full entry against
-- fat-bear-week-2025 with deliberately different outcomes, to verify the
-- leaderboard sorts correctly:
--
--   Test User 1: every pick correct                    -> top of the board
--   Test User 2: Round 1 correct, then a mixed Round 2  -> middle
--                (including a wrong pick that correctly cascades into
--                wrong Round 3 options — exercises resolveLegalOptions)
--   Test User 3: only Round 1 picked, mostly wrong      -> bottom, and an
--                incomplete entry (Rounds 2-4 never picked)
--
-- Safe to re-run: deletes these 3 users' existing entries for this
-- competition first (cascades to their picks automatically).
--
-- NOTE: the leaderboard only shows entries other than your own once the
-- competition is 'locked' or 'complete' (existing RLS, working as
-- intended). Temporarily run:
--   update public.competitions set status = 'locked' where slug = 'fat-bear-week-2025';
-- to see the full sorted leaderboard, then flip it back to 'open' if you
-- want to keep testing picks afterward.

with comp as (
  select id from public.competitions where slug = 'fat-bear-week-2025'
),
c as (
  select id, name from public.contestants where competition_id = (select id from comp)
),
m as (
  select id, round, slot_in_round from public.matchups where competition_id = (select id from comp)
),
test_users as (
  select id, display_name
  from public.profiles
  where display_name in ('Test User 1', 'Test User 2', 'Test User 3')
),
deleted as (
  delete from public.entries
  where competition_id = (select id from comp)
    and user_id in (select id from test_users)
  returning id
),
new_entries as (
  insert into public.entries (competition_id, user_id)
  select (select id from comp), tu.id
  from test_users tu
  returning id, user_id
)
insert into public.picks (entry_id, matchup_id, picked_contestant_id)
select
  ne.id,
  (select id from m where round = p.round and slot_in_round = p.slot),
  (select id from c where name = p.bear)
from new_entries ne
join test_users tu on tu.id = ne.user_id
join (values
  -- Test User 1: every pick correct.
  ('Test User 1', 1, 1, '609'),
  ('Test User 1', 1, 3, '503'),
  ('Test User 1', 1, 5, '909'),
  ('Test User 1', 1, 7, '856'),
  ('Test User 1', 2, 1, '602'),
  ('Test User 1', 2, 2, '32 Chunk'),
  ('Test User 1', 2, 3, '128 Grazer'),
  ('Test User 1', 2, 4, '856'),
  ('Test User 1', 3, 1, '32 Chunk'),
  ('Test User 1', 3, 2, '856'),
  ('Test User 1', 4, 1, '32 Chunk'),
  -- Test User 2: Round 1 correct; Round 2 has two wrong picks, which
  -- legally (and correctly) changes their own Round 3 options.
  ('Test User 2', 1, 1, '609'),
  ('Test User 2', 1, 3, '503'),
  ('Test User 2', 1, 5, '909'),
  ('Test User 2', 1, 7, '856'),
  ('Test User 2', 2, 1, '609'),
  ('Test User 2', 2, 2, '32 Chunk'),
  ('Test User 2', 2, 3, '128 Grazer'),
  ('Test User 2', 2, 4, '910'),
  ('Test User 2', 3, 1, '32 Chunk'),
  ('Test User 2', 3, 2, '128 Grazer'),
  ('Test User 2', 4, 1, '32 Chunk'),
  -- Test User 3: only Round 1 picked, mostly wrong. Rounds 2-4 left
  -- untouched on purpose, to test an incomplete entry on the leaderboard.
  ('Test User 3', 1, 1, '609'),
  ('Test User 3', 1, 3, '901'),
  ('Test User 3', 1, 5, '26'),
  ('Test User 3', 1, 7, '99')
) as p(user_label, round, slot, bear)
  on p.user_label = tu.display_name;
