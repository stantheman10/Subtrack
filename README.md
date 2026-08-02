# Budget Tracker

Minimal personal finance tracker built with Next.js 15, Supabase, and Tailwind CSS v4.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase (Postgres + Row Level Security)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your values from the Supabase dashboard → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

> **Note**: Use the **Publishable key** (not the anon key or service role key).
> As of 2025, Supabase projects use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### 4. Run the database migration

In the Supabase dashboard → SQL Editor, paste and run the contents of:

```
supabase/migrations/20260802153000_initial_schema.sql
```

This creates all tables, RLS policies, indexes, and a trigger to auto-create
settings for new users plus a function to seed default categories.

### 5. Configure Auth redirect URL

In Supabase dashboard → Auth → URL Configuration:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/callback`

For production, update these to your deployed URL.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  (auth)/           # Login, signup, OAuth callback
  (app)/            # Protected pages (dashboard, expenses, subscriptions, goals)
components/
  ui/               # Modal, EmptyState, PageHeader, StatCard
  charts/           # Recharts wrappers, GoalProgressRing
  layout/           # AppShell (sidebar + bottom nav)
lib/
  supabase/         # client.ts, server.ts, proxy.ts
  utils.ts          # formatCurrency, getDailyTarget, date helpers
  subscription-processor.ts  # auto-generates subscription transactions
types/
  index.ts          # All TypeScript interfaces
supabase/
  migrations/       # SQL schema file
```

## Key Decisions

- **Subscription auto-generation**: runs client-side on every app load via `processDueSubscriptions()`. Checks subscriptions where `next_billing_date <= today`, inserts transactions, advances the date. Easy to upgrade to a Supabase Edge Function + pg_cron later.
- **Auth**: Cookie-based SSR auth using `@supabase/ssr`. Middleware uses `getClaims()` (JWT verification, no network round-trip) per latest Supabase docs.
- **Currency**: Indian Rupees (₹). To change, update `formatCurrency()` in `lib/utils.ts`.
- **RLS**: Every table has `user_id = auth.uid()` policies. Data is fully isolated per user.
