# Elora Vault v0.2 — Project Context

## Core Concept
Elora Vault is a personal betting-inspired savings vault. NOT a real sportsbook.
The "house" is a virtual opponent with a starting balance of $1,000,000,000. User losses become savings in their vault.

## Key Rules
- Stake cannot exceed User Balance (user_balance)
- No house liability cap — the virtual house has $1B
- Wins: user gets stake + profit, profit deducted from virtual house
- Losses: stake moves to Savings Vault, added to virtual house
- All before/after balances tracked on Bet records

## Wallet Fields
user_balance | savings_vault | withdrawable_winnings | virtual_house_balance (default 1B)
total_deposited | total_wagered | total_saved_from_losses | total_profit_won

## Transaction Types
DEPOSIT | BET_PLACED | WIN_PROFIT | LOSS_TO_SAVINGS | PUSH_RETURN | WITHDRAWAL

## UX Language
"Every loss becomes saved capital." / "The house is virtual. The discipline is real."

## Deployment
Vercel + Supabase. Push schema: `npx prisma db push --accept-data-loss`

## Key Files
- prisma/schema.prisma — database schema
- src/lib/liability.ts — profit/return/settlement calculations
- src/store/useWalletStore.ts — Zustand client store
- src/app/api/wallet/route.ts — wallet GET + deposit POST
- src/app/api/bets/route.ts — bet CRUD
- src/app/api/bets/[id]/settle/route.ts — bet settlement
- src/app/api/wallet/transactions/route.ts — transaction history
