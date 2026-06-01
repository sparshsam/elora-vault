# Elora Vault v0.9 — Self-Custodied Protocol on Base

## Core Concept
Elora Vault is a **self-custodied behavioral capital vault** on Base. NOT a sportsbook, casino, or gambling protocol.

### Philosophy
- "Protect your capital from yourself."
- "Not every dollar should feel equally available."
- "Quiet by default. Present when needed. Invisible when not."

## Capital State Model
```
totalEloraCapital = available + protected + releasing + committed
```

| State | Meaning |
|---|---|
| Connected Wallet | External USDC in wallet (outside Elora) |
| Available | Capital ready to use inside Elora |
| Protected | Capital in active horizons |
| Releasing | Protected capital returning to availability |
| Committed | Capital in active predictions |

## Architecture

### Onchain (Smart Contracts)
- **ProtectedVault** (`contracts/src/ProtectedVault.sol`) — Base Sepolia
- Address: `0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd`
- USDC (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Frontend
- Next.js 16 App Router, TypeScript, TailwindCSS v4
- wagmi + viem + RainbowKit for wallet connection
- `@base-org/account` SDK installed (isolated lab only, not production)
- Zustand for client state

### Backend
- Supabase + PostgreSQL via Prisma
- Backend tracks: wallet state, predictions, vault locks, transactions

## Route Tree (21 routes)
```
○ /                          (Landing)
○ /auth/login                (Login)
○ /auth/signup               (Signup)
○ /vault                     (Capital state home)
○ /activity                  (Live event timeline)
○ /intent                    (Horizon release + protection opportunities)
○ /sessions                  (Prediction logging + settlement)
○ /settings                  (Account + Base Account card)
○ /settings/base-account-lab (Hidden — Base Account prototype)
○ /dashboard                 (Redirects to /vault)
ƒ /api/*                     (bets, sessions, wallet, vault/locks, onchain)
```

## Key Files

### Capital System
- `src/lib/capital-state.ts` — Canonical capital state model
- `src/lib/web3/hooks.ts` — Read hooks (useVaultSummary, useVaultLocks)
- `src/lib/web3/tx-hooks.ts` — Write hooks (useVaultDeposit, useCreateLock, useReleaseLock, useUSDCApprove, etc.)
- `src/store/useWalletStore.ts` — Zustand store

### Pages
- `src/app/(authenticated)/vault/page.tsx` — Wallet strip + 4 capital cards + modals
- `src/app/(authenticated)/activity/page.tsx` — Transaction timeline
- `src/app/(authenticated)/intent/page.tsx` — Release confirmations + protection opportunities
- `src/app/(authenticated)/sessions/page.tsx` — Prediction logging, settlement, post-win protection

### Components
- `src/components/vault/vault-state-card.tsx` — Premium card with left-border accent
- `src/components/capital/capital-operations.tsx` — Deposit/Withdraw/Protect modals
- `src/components/capital/session-modal.tsx` — End Session modal
- `src/components/wallet/wallet-control.tsx` — Connect/disconnect/network control
- `src/components/layout/top-header.tsx` — Top navigation bar

### Base Account (Lab only)
- `src/lib/account/account-strategy.ts` — Strategy types
- `src/lib/account/base-account-client.ts` — Isolated SDK wrapper
- `src/app/(authenticated)/settings/base-account-lab/page.tsx` — Lab test page

### Backend
- `prisma/schema.prisma` — Database schema (User, Wallet, Bet, VaultLock, Session, Transaction)
- `src/app/api/bets/route.ts` — Prediction CRUD
- `src/app/api/bets/[id]/settle/route.ts` — Settlement
- `src/app/api/bets/[id]/protect/route.ts` — Post-win protection
- `src/app/api/wallet/route.ts` — Wallet state
- `src/app/api/wallet/transactions/route.ts` — Transaction history
- `src/app/api/sessions/route.ts` — Session persistence

### Design Tokens
- Warm stone surfaces (#fafaf8)
- Botanical green accents (#4d8537)
- Restrained amber for releasing/committed states
- Soft borders, no pills, no decorative icons on capital cards

## Deployment
- **Frontend**: `npx vercel --prod` → https://elora-bet-api.vercel.app
- **Database**: `npx prisma db push --accept-data-loss`
- **Contracts**: Foundry → Base Sepolia

## Binding Design Constraints
1. No backend rewrites — UI wraps existing flows
2. No dashboard density — information goes down, not up
3. Restraint = sophistication — remove one thing before shipping
4. Intent is the signature experience
5. No charts, graphs, ROI, APY, PnL, or gamification
