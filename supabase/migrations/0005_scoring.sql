-- Configurable per-competition scoring: points_per_round[0] is how much a
-- correct Round 1 pick is worth, points_per_round[1] is Round 2, etc.
-- Defaults to "a pick is worth its round number" (1, 2, 3, 4, ...) for any
-- newly created competition, but is adjustable per competition afterward
-- the same way everything else admin-side is: a plain UPDATE.
--
-- No leaderboard/score table — score is computed live from picks vs.
-- matchups.winner_id, so there's nothing to keep in sync.
--
-- Run in the Supabase SQL Editor after 0004_allow_pick_deletion.sql.

alter table public.competitions
  add column points_per_round integer[] not null default array[1, 2, 3, 4];

update public.competitions
set points_per_round = array[1, 2, 3, 4]
where slug = 'fat-bear-week-2025';
