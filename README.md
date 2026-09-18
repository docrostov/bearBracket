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
