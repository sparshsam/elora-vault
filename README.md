# Elora v0.2

> Every loss becomes saved capital. The house is virtual. The discipline is real.

Elora is a **personal betting-inspired savings vault** — NOT a real sportsbook.

The "house" is a virtual opponent with a starting balance of **$1,000,000,000**. User losses become savings in their vault. Win and your profit grows. Lose and your stake is saved.

## Core Concept

| Event | What Happens |
|-------|-------------|
| **Deposit** | User Balance increases. Total Deposited tracks the lifetime amount. |
| **Place Bet** | Stake deducted from User Balance. Total Wagered increases. |
| **Win** | User gets stake + profit back. Withdrawable Winnings and Total Profit Won increase. Virtual House Balance decreases by profit. |
| **Loss** | Stake moves to Savings Vault. Total Saved From Losses increases. Virtual House Balance gains the stake. |
| **Push** | Stake returned to User Balance. No change to vault or house. |

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- TailwindCSS v4 + shadcn/ui (Base UI React)
- Prisma ORM + PostgreSQL (Supabase)
- Supabase Auth (SSR)
- Zustand + Framer Motion + Recharts

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
3. `npm install`
4. `npx prisma db push`
5. `npm run dev`

## Database Schema

Key models:

- **Wallet** — user_balance, savings_vault, withdrawable_winnings, virtual_house_balance (default $1B), total_deposited, total_wagered, total_saved_from_losses, total_profit_won
- **Bet** — sport, league, event_name, marketType, selection, odds, stake, potentialProfit, potential_return, status, with before/after balance tracking
- **Transaction** — type (DEPOSIT, BET_PLACED, WIN_PROFIT, LOSS_TO_SAVINGS, PUSH_RETURN, WITHDRAWAL), amount, balanceBefore/After, betId

## Key UX Language

- "Every loss becomes saved capital."
- "The house is virtual. The discipline is real."
- "Your losing bets do not disappear. They move into your vault."

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Vault overview with 4 primary cards + stats |
| `/deposit` | Simulated deposit page |
| `/bets/new` | Bet entry with live preview |
| `/bets/open` | Open bets with settle actions |
| `/history` | Full bet history |
| `/transactions` | All transaction history |
| `/settings` | Account and stats |

## Features

- **Savings Vault** — Losing bets move stake into a locked vault
- **Virtual House** — $1B starting opponent balance
- **Live Preview** — See projected win/loss/vault balances before committing
- **Win/Loss/Push Settlement** — Correct balance math for all outcomes
- **Dashboard** — 4 primary cards, secondary stats, house vs user comparison
- **Dark Mode** — Glassmorphism, charcoal/black/soft white, muted red accents

## Disclaimers

- Elora is **not a sportsbook**
- The house balance is **virtual**
- This is a **personal savings tool**
- No real-money gambling occurs on this platform

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
- No real-money transactions
- Personal financial discipline tool only
