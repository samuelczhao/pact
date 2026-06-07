# Pact

Accountability app where users make commitments with real dollar stakes. Fail a pact and you owe your partners via Venmo. Built for a small friend group.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-org/pact.git
cd pact

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in values (see Environment Variables below)

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with these values (never commit this file):

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key for client-side auth | Supabase Dashboard → Settings → API → Project API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for server-side operations (keep secret) | Supabase Dashboard → Settings → API → Project API keys → click "Reveal" |

## Git Workflow

- `main` is protected — requires 1 PR approval
- Create feature branches off `main`
- Open a PR when ready for review
- Vercel auto-deploys preview environments for every PR
- Merging to `main` triggers production deployment

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (Postgres, Auth, Realtime, Storage)
- **Tailwind CSS** + **shadcn/ui**
- **TypeScript**
- **Vercel** (hosting + deployments)

## Project Structure

```
src/app/              → Pages and API routes (App Router)
src/components/       → React components (ui/, commitments/, dashboard/, etc.)
src/lib/              → Utilities, Supabase clients, types, constants
supabase/             → Database migrations and config
proxy.ts              → Auth guard (Next.js 16 replaces middleware.ts)
```
