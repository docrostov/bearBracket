-- Core schema for bearBracket: competitions, contestants, matchups, and
-- entries/picks submitted by users. Designed so a single Supabase project
-- can host multiple bracket competitions (Fat Bear Week 2026, some other
-- competition later, etc.), not just one hardcoded bracket.
--
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- competitions: one per bracket event (e.g. "Fat Bear Week 2026")
-- ---------------------------------------------------------------------------

create type public.competition_status as enum ('draft', 'open', 'locked', 'complete');

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  year int not null,
  -- bracket_size must be a power of two (8, 16, 32, ...) for a clean single-elimination bracket.
  bracket_size int not null check (bracket_size > 0 and (bracket_size & (bracket_size - 1)) = 0),
  status public.competition_status not null default 'draft',
  -- After this time (or once status is 'locked'/'complete'), picks become read-only.
  picks_lock_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.competitions enable row level security;

create policy "Competitions are viewable by authenticated users"
  on public.competitions for select
  to authenticated
  using (true);

-- No insert/update/delete policies for regular users: competitions,
-- contestants, and matchup results are managed by the project owner via the
-- Supabase SQL Editor / dashboard, not through the app itself, for v1.

-- ---------------------------------------------------------------------------
-- contestants: entrants within a competition (e.g. individual bears)
-- ---------------------------------------------------------------------------

create table public.contestants (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  name text not null,
  seed int,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index contestants_competition_id_idx on public.contestants (competition_id);

alter table public.contestants enable row level security;

create policy "Contestants are viewable by authenticated users"
  on public.contestants for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- matchups: the bracket structure itself, one row per round/slot
-- ---------------------------------------------------------------------------

create table public.matchups (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  round int not null,
  slot_in_round int not null,
  contestant_a_id uuid references public.contestants (id),
  contestant_b_id uuid references public.contestants (id),
  -- The official real-world result, set by the admin as rounds resolve.
  winner_id uuid references public.contestants (id),
  created_at timestamptz not null default now(),
  unique (competition_id, round, slot_in_round)
);

create index matchups_competition_id_idx on public.matchups (competition_id);

alter table public.matchups enable row level security;

create policy "Matchups are viewable by authenticated users"
  on public.matchups for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- entries: one bracket submission per user per competition
-- ---------------------------------------------------------------------------

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (competition_id, user_id)
);

create index entries_competition_id_idx on public.entries (competition_id);
create index entries_user_id_idx on public.entries (user_id);

alter table public.entries enable row level security;

create policy "Users can view their own entries"
  on public.entries for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Everyone can view entries once a competition is locked"
  on public.entries for select
  to authenticated
  using (
    exists (
      select 1 from public.competitions c
      where c.id = entries.competition_id
        and c.status in ('locked', 'complete')
    )
  );

create policy "Users can create their own entry while a competition is open"
  on public.entries for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.competitions c
      where c.id = competition_id and c.status = 'open'
    )
  );

-- ---------------------------------------------------------------------------
-- picks: a user's chosen winner for each matchup, within their entry
-- ---------------------------------------------------------------------------

create table public.picks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  matchup_id uuid not null references public.matchups (id) on delete cascade,
  picked_contestant_id uuid not null references public.contestants (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_id, matchup_id)
);

create index picks_entry_id_idx on public.picks (entry_id);
create index picks_matchup_id_idx on public.picks (matchup_id);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_picks_updated_at
  before update on public.picks
  for each row execute function public.set_updated_at();

alter table public.picks enable row level security;

create policy "Users can view their own picks"
  on public.picks for select
  to authenticated
  using (
    exists (
      select 1 from public.entries e
      where e.id = picks.entry_id and e.user_id = auth.uid()
    )
  );

create policy "Everyone can view picks once a competition is locked"
  on public.picks for select
  to authenticated
  using (
    exists (
      select 1
      from public.entries e
      join public.competitions c on c.id = e.competition_id
      where e.id = picks.entry_id
        and c.status in ('locked', 'complete')
    )
  );

create policy "Users can add picks to their own entry while open"
  on public.picks for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.entries e
      join public.competitions c on c.id = e.competition_id
      where e.id = entry_id
        and e.user_id = auth.uid()
        and c.status = 'open'
    )
  );

create policy "Users can change their own picks while open"
  on public.picks for update
  to authenticated
  using (
    exists (
      select 1 from public.entries e
      where e.id = picks.entry_id and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.entries e
      join public.competitions c on c.id = e.competition_id
      where e.id = entry_id
        and e.user_id = auth.uid()
        and c.status = 'open'
    )
  );
