@AGENTS.md

# Pact — Accountability App

## What This Is
Accountability app where users make commitments with real dollar stakes. Fail a pact, you owe your partners via Venmo. Built for a small friend group.

## Tech Stack
- **Next.js 16** (App Router) on **Vercel** (free tier)
- **Supabase** (Postgres + Auth + Realtime + Storage)
- **Tailwind CSS** + **shadcn/ui** (base-ui variant, NOT radix)
- Google OAuth only

## Critical: Next.js 16 Differences
This is NOT Next.js 14/15. Read `node_modules/next/dist/docs/` before writing code.
- `params` and `searchParams` are **Promises** — must `await` them
- `cookies()` and `headers()` are **async** — must `await` them
- File is `proxy.ts` not `middleware.ts`, function is `export function proxy()` not `middleware()`
- shadcn components use `render={}` prop (base-ui pattern), NOT `asChild`
- Button has `size="xs"` variant — it's valid here

## Project Structure
```
proxy.ts                           # Auth guard (was middleware.ts in older Next.js)
src/app/
  page.tsx                         # Landing page (server component)
  auth/login/page.tsx              # Google OAuth login
  auth/callback/route.ts           # OAuth code exchange
  onboarding/page.tsx              # First-login profile setup
  dashboard/
    layout.tsx                     # Auth guard + header
    page.tsx                       # Main dashboard with tabs (My Pacts / Feed / Leaderboard)
    settings/page.tsx              # Profile settings
  commitments/[id]/page.tsx        # Pact detail, proof submission, verification
  api/
    commitments/                   # CRUD for pacts
    commitments/[id]/proof/        # Proof submission
    commitments/[id]/verify/       # Partner approval/rejection
    notifications/                 # In-app notifications
    users/                         # User search for partner picker
    leaderboard/                   # Aggregated stats
    cron/deadlines/                # Daily deadline checker
src/components/
  commitments/                     # Pact cards, create dialog, proof forms, partner picker
  dashboard/                       # Left panel, social feed, leaderboard, activity feed
  notifications/                   # Bell with realtime subscription
  layout/                          # Header with avatar dropdown
src/lib/
  supabase/client.ts               # Browser client (use in "use client" components)
  supabase/server.ts               # Server client (use in server components + route handlers)
  supabase/middleware.ts            # Session refresh logic for proxy.ts
  types/database.ts                # All TypeScript types
  constants.ts                     # Status config, deadline presets
  utils.ts                         # Venmo links, date formatting, currency
```

## Database Schema
- `profiles` — extends auth.users (display_name, venmo_username, onboarded)
- `commitments` — pacts with status enum (active → pending_proof → awaiting_verification → completed/failed)
- `commitment_partners` — junction table for multi-partner pacts
- `notifications` — in-app notifications with realtime
- `feed_events` — social feed events (auto-populated by DB trigger for public pacts)
- Storage bucket `proofs` — screenshot uploads

## Supabase Client Usage
```typescript
// Server components + route handlers:
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient(); // ASYNC

// Client components:
import { createClient } from "@/lib/supabase/client";
const supabase = createClient(); // SYNC
```

## Route Handler Pattern
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // MUST await
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // ...
}
```

## Key Design Decisions
- **Multi-partner pacts**: Creator puts money down. Multiple partners can be assigned. Any ONE partner can verify (first to act wins). On failure, amount splits evenly between partners.
- **Only creator stats are affected**: Leaderboard tracks creator's completion rate, streak, money lost. Partners are just verifiers.
- **Public/private pacts**: Public pacts appear on the social feed. Private pacts are only visible to creator and partners.
- **Deadline transitions**: Since Vercel free tier only supports daily crons, expired pacts also transition to `pending_proof` on page load (GET endpoint + left panel fetch).
- **Onboarding uses upsert**: Profile row might not exist yet (race condition with DB trigger), so we upsert instead of update.

## Development Commands
```bash
# Start dev server
NODE_EXTRA_CA_CERTS=/tmp/node-ca-certs.pem npm run dev

# Typecheck
NODE_EXTRA_CA_CERTS=/tmp/node-ca-certs.pem npx tsc --noEmit

# Deploy (connect GitHub to Vercel for auto-deploy instead)
NODE_EXTRA_CA_CERTS=/tmp/node-ca-certs.pem npx vercel --prod --yes

# Run SQL on remote DB
supabase db query --linked "SELECT * FROM profiles;"
```

## Environment Variables
Required in `.env.local` (never commit):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These are also set in Vercel project settings.

## Git Workflow
- `main` branch is protected — requires 1 PR approval
- Create feature branches, open PRs
- Vercel auto-deploys preview for PRs, production for main merges

## Known Pitfalls
- `NODE_EXTRA_CA_CERTS=/tmp/node-ca-certs.pem` is needed for npm/node commands on this machine (SSL cert issue)
- Vercel free tier: cron jobs limited to daily, deployment protection must be disabled for public access
- The `pactlnl.vercel.app` domain is set as a project domain (auto-updates on deploy)
- Supabase free tier pauses after 1 week of inactivity
- `commitment_partners` table is the source of truth for partners on new pacts. Legacy `partner_id` column on `commitments` is kept for backwards compat with old pacts only.
