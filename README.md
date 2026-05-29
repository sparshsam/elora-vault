# Elora

A personal bankroll vault and self-betting savings system.

> Every loss strengthens your vault.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS + shadcn/ui
- Prisma ORM + PostgreSQL
- Supabase Auth
- Zustand + Framer Motion + Recharts

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
3. `npm install`
4. `npx prisma db push`
5. `npm run dev`

## Features

- **Wallet System** — Deposit virtual funds, track house balance and withdrawable profit
- **Bet Entry** — Manual bet placement with live liability calculation
- **Liability Engine** — American odds math, max stake validation, vault exposure meter
- **Bet Lifecycle** — Open → Win/Loss/Push with correct settlement logic
- **Dashboard** — Animated counters, balance chart, win rate, open bets
- **History** — Filterable bet table with settlement details
- **Dark Mode** — Calm, glassmorphism UI (no casino aesthetics)

## Deploy

Designed for Vercel + Supabase.

```bash
npm run build
```

## Constraints

- No sportsbook APIs
- No peer-to-peer betting
- No gambling mechanics
- No casino visuals
- Personal financial discipline tool only
