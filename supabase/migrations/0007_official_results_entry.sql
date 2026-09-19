-- Backs the new "Results" page: a single, special entry per competition
-- (entries.is_official_results = true) whose picks always exactly mirror
-- the official matchups.winner_id, kept in sync automatically by a
-- trigger. Reuses the exact same read-only bracket rendering as any
-- individual entry's page (src/components/ReadOnlyBracket.tsx) — since
-- this entry's "picks" are always the real outcome, every decided matchup
-- naturally renders as correct.
--
-- Run in the Supabase SQL Editor after 0006_profile_display_constraints.sql.
-- Afterward, see supabase/seed/create_official_results_entry.sql to
-- actually create the special entry for a given competition.

alter table public.entries
  add column is_official_results boolean not null default false;

-- At most one official-results entry per competition.
create unique index entries_one_official_results_per_competition
  on public.entries (competition_id)
  where is_official_results;

-- Keep the official-results entry's picks in lockstep with matchups.winner_id
-- whenever a result is entered, changed, or cleared (e.g. during testing —
-- see supabase/seed/test_in_progress_results.sql).
create or replace function public.sync_official_results_pick()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  results_entry_id uuid;
begin
  -- Byes have nothing to pick — the lone contestant advances automatically,
  -- matching isBye()'s handling in the app (src/lib/bracket.ts).
  if (new.contestant_a_id is not null) != (new.contestant_b_id is not null) then
    return new;
  end if;

  select id into results_entry_id
  from public.entries
  where competition_id = new.competition_id
    and is_official_results = true;

  if results_entry_id is null then
    return new;
  end if;

  if new.winner_id is null then
    delete from public.picks
    where entry_id = results_entry_id and matchup_id = new.id;
  else
    insert into public.picks (entry_id, matchup_id, picked_contestant_id)
    values (results_entry_id, new.id, new.winner_id)
    on conflict (entry_id, matchup_id)
    do update set picked_contestant_id = excluded.picked_contestant_id;
  end if;

  return new;
end;
$$;

create trigger sync_official_results_pick
  after insert or update of winner_id on public.matchups
  for each row
  execute function public.sync_official_results_pick();
