-- Deleting a competition cascades to both its contestants and its matchups
-- independently (both reference competitions directly). But matchups'
-- contestant_a_id/contestant_b_id/winner_id and picks' picked_contestant_id
-- referenced contestants with no ON DELETE action, so the contestants side
-- of that cascade could get blocked by a still-live reference from the
-- other side — exactly what happened re-running a seed script:
--
--   ERROR: update or delete on table "contestants" violates foreign key
--   constraint "picks_picked_contestant_id_fkey" on table "picks"
--
-- Fix: these are all "this pick/result mentions that contestant" references
-- scoped to one competition's lifecycle — when the contestant goes away,
-- these should go with it, not block the delete.
--
-- Run in the Supabase SQL Editor after 0002_harden_profile_privacy.sql.

alter table public.matchups
  drop constraint matchups_contestant_a_id_fkey,
  add constraint matchups_contestant_a_id_fkey
    foreign key (contestant_a_id) references public.contestants (id) on delete cascade;

alter table public.matchups
  drop constraint matchups_contestant_b_id_fkey,
  add constraint matchups_contestant_b_id_fkey
    foreign key (contestant_b_id) references public.contestants (id) on delete cascade;

alter table public.matchups
  drop constraint matchups_winner_id_fkey,
  add constraint matchups_winner_id_fkey
    foreign key (winner_id) references public.contestants (id) on delete cascade;

alter table public.picks
  drop constraint picks_picked_contestant_id_fkey,
  add constraint picks_picked_contestant_id_fkey
    foreign key (picked_contestant_id) references public.contestants (id) on delete cascade;
