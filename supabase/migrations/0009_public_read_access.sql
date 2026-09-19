-- Signed-out visitors should be able to see the leaderboard and official
-- results without an account — most people who set a bracket won't want to
-- keep signing back in just to check scores as results come in. Submitting
-- or editing a bracket still requires an account; nothing here touches any
-- insert/update/delete policy.
--
-- Widens the read-only SELECT policies these pages depend on from
-- `authenticated` to `public` (covers signed-out `anon` requests too).
-- `auth.uid()`-scoped policies ("own entries/picks") are left untouched —
-- they're meaningless for anon (auth.uid() is null) and stay authenticated.
--
-- Run in the Supabase SQL Editor after 0008_revert_official_results_entry.sql.

drop policy "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by anyone"
  on public.profiles for select
  to public
  using (true);

drop policy "Competitions are viewable by authenticated users" on public.competitions;
create policy "Competitions are viewable by anyone"
  on public.competitions for select
  to public
  using (true);

drop policy "Contestants are viewable by authenticated users" on public.contestants;
create policy "Contestants are viewable by anyone"
  on public.contestants for select
  to public
  using (true);

drop policy "Matchups are viewable by authenticated users" on public.matchups;
create policy "Matchups are viewable by anyone"
  on public.matchups for select
  to public
  using (true);

drop policy "Everyone can view entries once a competition is locked" on public.entries;
create policy "Entries are viewable by anyone once a competition is locked"
  on public.entries for select
  to public
  using (
    exists (
      select 1 from public.competitions c
      where c.id = entries.competition_id
        and c.status in ('locked', 'complete')
    )
  );

drop policy "Everyone can view picks once a competition is locked" on public.picks;
create policy "Picks are viewable by anyone once a competition is locked"
  on public.picks for select
  to public
  using (
    exists (
      select 1
      from public.entries e
      join public.competitions c on c.id = e.competition_id
      where e.id = picks.entry_id
        and c.status in ('locked', 'complete')
    )
  );
