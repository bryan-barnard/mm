# March Madness Stock Market Pool

Secure multiplayer web app where NCAA teams are tradable assets. Players start with a bank, trade between rounds, earn payouts for wins, and compete on net worth.

## Tech Stack
- Next.js 14 + TypeScript + Tailwind
- Supabase Auth + Postgres + RLS
- Server actions calling Postgres RPCs for secure mutations
- Zod input validation
- Vitest rule tests

## Core Architecture Decisions
1. **Authoritative server logic**: buy/sell/game-result/round advancement run in `SECURITY DEFINER` Postgres functions for atomicity and anti-tamper.
2. **RLS isolation**: users only read league data where they are members; sensitive writes are blocked from direct client table updates.
3. **Audit-first design**: all economic actions write `transactions` entries with round + metadata.
4. **Race safety**: critical rows are locked with `FOR UPDATE` in RPCs.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env.local` from `.env.example`.
3. Apply Supabase migration:
   ```bash
   supabase db push
   ```
4. Seed 64-team placeholders:
   ```bash
   psql "$SUPABASE_DB_URL" -f supabase/seed/seed.sql
   ```
5. Run app:
   ```bash
   npm run dev
   ```

## Deploying with AWS Amplify
This repository includes an `amplify.yml` optimized for Next.js SSR builds on Node 20.

1. Connect the Git repository in Amplify and select the branch.
2. Keep the default buildspec or use repo `amplify.yml`.
3. Add environment variables in Amplify app settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase Auth settings, add your Amplify domain(s) to allowed redirect URLs/site URLs.
5. Trigger a build and deploy.

Notes:
- Amplify executes `npm ci` and `npm run build` from `amplify.yml`.
- Node engine is pinned in `package.json` (`>=20 <23`) to avoid runtime drift.

## Required Deliverables Included
- Full Next.js project structure (`app/*`, `lib/*`)
- Database schema + RPC logic (`supabase/migrations/0001_init.sql`)
- RLS policies (same migration)
- Seed script (`supabase/seed/seed.sql`)
- Secure auth flow (`app/auth/*`, `lib/actions/auth.ts`)
- Core pages (`dashboard`, `market`, `portfolio`, `leaderboard`, `activity`, `admin`)
- Server mutation logic (`lib/actions/league.ts` + RPC)
- Environment variable example (`.env.example`)
- Game rule test coverage (`tests/game-engine.test.ts`)

## Testing
```bash
npm test
```

## Notes
- Commissioner creates league and members, then loads or edits teams.
- Trading windows are controlled on admin page and enforced server-side.
- Net worth formula is bank + alive owned team market value.
