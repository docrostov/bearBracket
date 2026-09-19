-- Two additions to public.profiles:
--
-- 1. display_name length/emptiness. 0002_harden_profile_privacy.sql added a
--    CHECK against '@' in display_name, but the length/emptiness limit in
--    src/app/profile/actions.ts only lives in application code. A request
--    made straight against Supabase's REST API (using a user's own valid
--    session, which RLS otherwise legitimately allows for their own row)
--    would skip that check entirely and could set display_name to an empty
--    string, all whitespace, or an arbitrarily long value. Add a matching
--    database-level constraint so the limit holds regardless of which
--    client makes the request.
--
-- 2. emoji: an optional short marker shown next to a user's name on the
--    leaderboard, chosen from a fixed picker in the UI (not freely typed).
--    The same "app code isn't the only client that can write this row"
--    reasoning applies, so the shape is constrained here too: at most a
--    handful of codepoints (real emoji can be multi-codepoint sequences —
--    skin tones, ZWJ joins, flags — so this doesn't force exactly one
--    grapheme) and no plain ASCII letters/digits/'@', which would let it be
--    used as a second, unconstrained text field instead of an emoji.
--
-- Run this in the Supabase SQL Editor after 0005_scoring.sql.

alter table public.profiles
  add constraint display_name_length check (
    char_length(trim(display_name)) between 1 and 40
  );

alter table public.profiles
  add column emoji text;

alter table public.profiles
  add constraint emoji_shape check (
    emoji is null or (
      char_length(emoji) between 1 and 8
      and emoji !~ '[A-Za-z0-9@]'
    )
  );
