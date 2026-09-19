-- Simulates the real workflow: a locked competition with results entered
-- round-by-round as they're announced, rather than all at once. Uses the
-- already-seeded fat-bear-week-2025 bracket (real 2025 results), which lets
-- us "rewind" Round 3/4 to null and "replay" them one round at a time
-- without touching contestants/matchups ids, so existing Test User
-- entries/picks (from test_leaderboard_entries.sql) stay intact throughout.
--
-- Run each numbered step in the Supabase SQL Editor ONE AT A TIME, checking
-- the leaderboard (/competitions/fat-bear-week-2025/leaderboard) and an
-- entry page between steps. Do not run the whole file at once.

-- ============================================================
-- STEP 1 — lock the competition and rewind Round 3 & 4 to "not yet played".
-- Check after running: leaderboard scores should drop (only Rounds 1-2
-- count), Test User entry pages should show Round 3/4 picks with no ✓/✗
-- marker, and the bracket page should refuse new/changed picks (locked).
-- ============================================================

update public.competitions
set status = 'locked'
where slug = 'fat-bear-week-2025';

update public.matchups
set winner_id = null
where competition_id = (select id from public.competitions where slug = 'fat-bear-week-2025')
  and round in (3, 4);

-- ============================================================
-- STEP 2 — "announce" Round 3 results (semifinals decided, final still
-- pending). Check after running: leaderboard scores go back up to include
-- Round 3, Round 4 picks still show no marker.
-- ============================================================

with comp as (
  select id from public.competitions where slug = 'fat-bear-week-2025'
),
c as (
  select id, name from public.contestants where competition_id = (select id from comp)
)
update public.matchups m
set winner_id = c.id
from c,
  (values (1, '32 Chunk'), (2, '856')) as t(slot, name)
where m.competition_id = (select id from comp)
  and m.round = 3
  and m.slot_in_round = t.slot
  and c.name = t.name;

-- ============================================================
-- STEP 3 — "announce" the Round 4 champion, restoring the fully-resolved
-- 2025 bracket. Sets status to 'complete' since the real event is over.
-- Check after running: leaderboard/entry pages match what they showed
-- before this test (Test User 1 back to 11/11, etc).
-- ============================================================

with comp as (
  select id from public.competitions where slug = 'fat-bear-week-2025'
),
c as (
  select id from public.contestants
  where competition_id = (select id from comp) and name = '32 Chunk'
)
update public.matchups
set winner_id = (select id from c)
where competition_id = (select id from comp)
  and round = 4
  and slot_in_round = 1;

update public.competitions
set status = 'complete'
where slug = 'fat-bear-week-2025';
