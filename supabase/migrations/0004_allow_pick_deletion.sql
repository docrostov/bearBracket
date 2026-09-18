-- Lets a user clear their own picks while a competition is still open (e.g.
-- to redo a bracket before the deadline). picks had no DELETE policy at
-- all yet, so this was previously impossible even for the picks' own owner.
--
-- Run in the Supabase SQL Editor after 0003_cascade_contestant_references.sql.

create policy "Users can delete their own picks while open"
  on public.picks for delete
  to authenticated
  using (
    exists (
      select 1
      from public.entries e
      join public.competitions c on c.id = e.competition_id
      where e.id = picks.entry_id
        and e.user_id = auth.uid()
        and c.status = 'open'
    )
  );
