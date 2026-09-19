-- Reverts 0007_official_results_entry.sql. On reflection, a synthetic
-- "results" auth account + trigger was more moving parts than needed:
-- matchups/contestants are already visible to every signed-in user with no
-- lock-status gating (unlike entries/picks), so the Results page can read
-- official results directly off matchups.winner_id instead. Nothing here
-- to keep in sync, nothing to secure beyond what already existed.
--
-- Safe to run even if you never actually created an official-results entry
-- (create_official_results_entry.sql) — this only touches the trigger,
-- function, index, and column from 0007.
--
-- Run in the Supabase SQL Editor.

drop trigger if exists sync_official_results_pick on public.matchups;
drop function if exists public.sync_official_results_pick();
drop index if exists entries_one_official_results_per_competition;

alter table public.entries
  drop column if exists is_official_results;
