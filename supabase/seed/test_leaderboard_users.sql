-- Run this AFTER signing in 3 extra times via the login form, using Gmail's
-- "+tag" trick (e.g. dr.roffles+test1@gmail.com, +test2, +test3 — all
-- distinct accounts to Supabase Auth, all landing in your real inbox).
-- Each sign-in creates a new profile defaulted to "New Bear Fan". This
-- renames the 3 most-recently-created profiles to Test User 1/2/3 so the
-- companion seed script (test_leaderboard_entries.sql) can reference them
-- by name instead of needing their ids pasted in by hand.
--
-- Safe to re-run, but only meaningful right after 3 fresh sign-ins — if you
-- run it again later it'll just rename whatever 3 profiles are newest.

with newest as (
  select id, row_number() over (order by created_at desc) as rn
  from public.profiles
  where display_name = 'New Bear Fan'
  order by created_at desc
  limit 3
)
update public.profiles
set display_name = 'Test User ' || rn
from newest
where public.profiles.id = newest.id;

-- Sanity check: should show exactly 3 rows.
select id, display_name, created_at
from public.profiles
where display_name in ('Test User 1', 'Test User 2', 'Test User 3');
