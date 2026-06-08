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
    page.tsx                       # Main dashboard with tabs (Active / Watching / History / Challenges / Feed / Board)
    settings/page.tsx              # Profile settings
  commitments/[id]/page.tsx        # Pact detail, proof submission, verification
  challenges/[id]/page.tsx         # Challenge detail, check-in, participants
  share/[id]/page.tsx              # Public share page with OG meta tags (no auth required)
  api/
    commitments/                   # CRUD for pacts
    commitments/[id]/proof/        # Proof submission + AI verification
    commitments/[id]/verify/       # Partner approval/rejection (creator blocked from self-verify)
    commitments/[id]/checkin/      # Daily check-in for pacts with daily_checkin=true
    challenges/                    # Challenge CRUD + join + check-in
    notifications/                 # In-app notifications (GET + bulk PATCH mark-read)
    users/                         # User search for partner picker
    leaderboard/                   # Aggregated stats + pact score
    og/[id]/                       # OG image generation for shareable cards
    cron/deadlines/                # Daily: deadline transitions + daily checkin strikes
src/components/
  commitments/                     # Pact cards, create dialog, proof forms, partner picker, share button, checkin button
  challenges/                      # Challenge cards, create dialog, join dialog
  dashboard/                       # Left panel, social feed, leaderboard, activity feed
  notifications/                   # Bell with realtime subscription + auto mark-read
  layout/                          # Header with avatar dropdown
src/lib/
  supabase/client.ts               # Browser client (use in "use client" components)
  supabase/server.ts               # Server client + service role client (bypasses RLS)
  supabase/middleware.ts            # Session refresh logic for proxy.ts
  types/database.ts                # All TypeScript types
  pact-score.ts                    # Pact Score (0-1000) computation from commitment history
  ai-verify.ts                     # Gemini Flash proof verification
  constants.ts                     # Status config, deadline presets
  utils.ts                         # Venmo links, date formatting, currency
```

## Database Schema
- `profiles` — extends auth.users (display_name, venmo_username, onboarded)
- `commitments` — pacts with status enum, ai_verdict fields, daily_checkin/strikes fields
- `commitment_partners` — junction table for multi-partner pacts
- `challenges` — pool challenges with join_code, stake, proof_frequency, max_participants
- `challenge_participants` — junction table for challenge members (status, proof_count)
- `challenge_checkins` — daily/weekly check-ins for both challenges AND daily-checkin pacts (shared table, one of challenge_id/commitment_id must be non-null)
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
- **Multi-partner pacts**: Creator puts money down. At least one partner required. Any ONE partner can verify (first to act wins). On failure, amount splits evenly between partners.
- **Only creator stats are affected**: Leaderboard tracks creator's completion rate, streak, money lost, and Pact Score. Partners are just verifiers.
- **Pact Score (0-1000)**: Computed on-read from commitment history. +50/completed (scaled by stake up to 3x), -75/failed, +10/streak day (cap 200), -5/week decay. Displayed on leaderboard.
- **AI proof verification**: Gemini Flash evaluates proof against requirements. Advisory only — partner still decides. Handles markdown code fences in response.
- **Pool challenges**: Group accountability with join codes. Participants check in daily/weekly. Settlement at end: 50%+ proof count = completed, else failed. Stakes split among winners.
- **Daily check-ins**: Individual pacts can require daily check-ins. 3 strikes (missed days) = auto-fail. First day exempt from strikes.
- **Shareable cards**: OG images generated at /api/og/[id]. Public share pages at /share/[id] (no auth required).
- **Public/private pacts**: Public pacts appear on the social feed. Private pacts are only visible to creator and partners.
- **Deadline transitions**: Since Vercel free tier only supports daily crons, expired pacts also transition to `pending_proof` on page load (GET endpoint + left panel fetch).
- **Onboarding uses upsert**: Profile row might not exist yet (race condition with DB trigger), so we upsert instead of update.
- **Self-verification blocked**: Creator cannot verify their own pact (403 error).

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
- `GEMINI_API_KEY` — for AI roasts and proof verification (Gemini 2.0 Flash, free tier)

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
