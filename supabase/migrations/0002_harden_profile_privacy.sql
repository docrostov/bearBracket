-- profiles.display_name is visible to every authenticated user by design
-- (so people can see who's submitted a bracket), which means it must never
-- be derived from, or allowed to contain, an email address.
--
-- 0001_init.sql's handle_new_user() defaulted display_name to the local
-- part of the signup email (e.g. "dr.roffles" from dr.roffles@gmail.com)
-- when no display_name was supplied at signup. That leaks part of a user's
-- real email to every other signed-in user. Fix the default, and add a
-- constraint so a display name can never contain '@' at all (belt and
-- suspenders against this happening again, by accident or otherwise).
--
-- Run this in the Supabase SQL Editor after 0001_init.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New Bear Fan')
  );
  return new;
end;
$$;

alter table public.profiles
  add constraint display_name_not_email check (display_name !~ '@');
