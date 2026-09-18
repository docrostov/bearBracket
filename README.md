# bearBracket
Creating a Fat Bear Week bracket submission website with React.

Built to support any single-elimination bracket competition (Fat Bear Week first, more later), not just one hardcoded bracket.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript) — frontend + backend in one app, deployed on Vercel
- [Supabase](https://supabase.com) — Postgres database + auth (email magic link), enforced with Row Level Security

## Local development

1. Copy `.env.example` to `.env.local` and fill in your Supabase project's URL and publishable key (Project Settings → API).
2. `npm install`
3. `npm run dev` — app runs at http://localhost:3000

## Database setup

Schema and Row Level Security policies live in [`supabase/migrations/`](supabase/migrations/). Run each file in order via the Supabase dashboard's SQL Editor (Project → SQL Editor → New query, paste, Run). There's no Supabase CLI link set up yet, so this is manual for now.

## Privacy & security notes

Signup is open (anyone with the link can create an account), so these matter:

- Real emails live only in Supabase's internal `auth.users` table, which is never exposed through the public API (verified — see commit history). Application tables never store a user's email.
- `profiles.display_name` is visible to every signed-in user by design (so people can see who's entered a bracket). It can never contain `@` (DB constraint) and never defaults to part of a user's email.
- Auth must go through `supabase.auth.signInWithOtp({ email })` only. Don't add a "does this email already have an account?" check anywhere — Supabase's magic-link flow intentionally behaves identically for new and existing emails, and a custom check would reintroduce email enumeration.
- Row Level Security denies all reads to signed-out requests (every table's SELECT policy is scoped `to authenticated`) — confirmed empty results, not errors, when queried anonymously.
