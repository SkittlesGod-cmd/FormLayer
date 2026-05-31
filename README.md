# FormLayer

AI-powered supplement formulation platform for brands and agencies. Evidence-backed formulations in minutes — RAG-powered ingredient research, FDA compliance checking, and direct manufacturer connections.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/formlayer&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_SITE_URL)

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS v4**
- **shadcn/ui** (via `@base-ui/react`)
- **Supabase** (auth, profiles, formulation workspace, sharing, collaboration)
- **OpenRouter-compatible AI** (formulation builder, research, compliance, agent runs)
- **Paddle** (subscription billing)
- **Resend** (transactional email)
- **Sentry / Vercel Analytics** (observability)
- **Framer Motion** (scroll animations)
- **next-sitemap** (sitemap + robots.txt)

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/formlayer.git
cd formlayer
npm install

# 2. Environment variables
cp .env.local.example .env.local
# Fill in Supabase, AI, billing, email, and analytics keys as needed.

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

Run the schema and migration files in `lib/` against your Supabase project:

- `lib/supabase-auth-schema.sql`
- `lib/supabase-formulations-schema.sql`
- `lib/migrations/002_versioning_and_sharing.sql`
- `lib/migrations/003_subscriptions.sql`
- `lib/migrations/004_collaborators.sql`
- `lib/migrations/005_accuracy_fields.sql`
- `lib/migrations/006_agents.sql`

Then copy your **Project URL**, anon/publishable key, and service role key from Dashboard → Project Settings → API into `.env.local`.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase browser-safe key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase admin key for webhooks, public share reads, and account deletion |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (e.g. `https://formlayer.co`) |
| `NEXT_PUBLIC_APP_URL` | App origin used by server-to-server callbacks |
| `OPENROUTER_API_KEY` | Server-only AI provider key |
| `PADDLE_API_KEY` / `PADDLE_WEBHOOK_SECRET` | Paddle billing API and webhook verification |
| `NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID` / `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID` | Paddle price IDs used by checkout |
| `RESEND_API_KEY` / `FROM_EMAIL` | Transactional email |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional AI rate limiting |
| `NCBI_API_KEY` | Optional PubMed higher rate limit |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional Sentry reporting |

## Build & Deploy

```bash
npm run build    # builds Next.js + generates sitemap.xml + robots.txt via postbuild
npm run start    # serves production build locally
```

### Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com/new](https://vercel.com/new)
3. Add the three environment variables in the Vercel dashboard
4. Vercel will auto-detect Next.js and deploy

The `vercel.json` targets region `iad1` (US East) for lowest latency.

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, features, how it works, testimonials, pricing preview, CTA |
| `/features` | Full feature breakdown |
| `/pricing` | Pricing tiers |
| `/for-agencies` | Agency-focused landing |
| `/sign-in`, `/sign-up` | Auth flows |
| `/dashboard` | Authenticated product workspace |
| `/dashboard/formulations/new` | Guided AI formulation builder |
| `/dashboard/formulations/[id]` | Formulation detail, compliance, research, handoff, sharing |
| `/dashboard/agents` | Pro agent builder |
| `/f/[token]` | Public read-only formulation share |
