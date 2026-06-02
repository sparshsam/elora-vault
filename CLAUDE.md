# Elora Vault v0.9 — Self-Custodied Protocol on Base

## Core Concept
Elora Vault is a **self-custodied behavioral capital vault** on Base. NOT a sportsbook, casino, or gambling protocol.

### Philosophy
- "Protect your capital from yourself."
- "Not every dollar should feel equally available."
- "Quiet by default. Present when needed. Invisible when not."

## Layer Maturity (Single Source of Truth)

This table defines what's safe to rely on vs what's architecture-only:

| Layer | Status | Meaning |
|---|---|---|
| Vault mechanics | **Production-built** | ProtectedVault contract verified on Base Sepolia. wagmi hooks, tx hooks, vault UI all live. |
| Behavioral separation | **Production-built** | Capital state model (available/protected/releasing/committed), Zustand store, wallet–vault boundary all wired. |
| Prediction routing | **Production-built** | Sessions page, modal, API route, and at_risk_balance tracking live. |
| Intent/release flows | **Production-built** | Intent page, release-windows.ts (5 types), release confirmation UI live. |
| Policy engine | **Foundation-built** | Types, engine, components, CRUD APIs, state-based runtime evaluator, /api/policies/evaluate endpoint, Intent page integration — produces structured suggestions with requiresConfirmation: true. Execution wiring remains future. |
| Base-native infra | **Foundation-built** | EIP-5792 capability detection, account architecture files, Base Account Lab page — SDK wrapper exists but no production wallet flow replacement. |
| Builder attribution | **Infrastructure-built** | builder-code.ts utility done, env var set in Vercel, meta tag in layout — not wired into production transactions yet. |
| Productive protection | **Research-built** | Conceptual protection modes defined, yield strategy research done, research page — no protocol integrations or execution logic. |
| Delayed liquidity | **UX/model-built** | Interactive mock UX flows in delayed-release-mocks.tsx, previews on Intent page — not wired to onchain release logic. |

## Capital State Model
```
totalEloraCapital = available + protected + releasing + committed
```

| State | Source | Meaning |
|---|---|---|
| Connected Wallet | useUSDCBalance() | External USDC in connected wallet (outside Elora) |
| Available | derived from contract + wallet | Capital ready to use inside Elora |
| Protected | vaultSummary.totalLocked | Capital in active horizons |
| Releasing | vault unlocked balance | Protected capital returning to availability |
| Committed | walletStore.at_risk_balance | Capital in active predictions |

## Architecture

### Onchain (Smart Contracts)
- **ProtectedVault** (`contracts/src/ProtectedVault.sol`) — Base Sepolia
- Address: `0x7876A2fa21BAfD40F7b61F49390d0FED556Db1fd`
- USDC (Base Sepolia): `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- VERIFIED on BaseScan
- Base.dev verification: base:app_id meta tag in root layout

### Frontend
- Next.js 16 App Router, TypeScript, TailwindCSS v4
- wagmi + viem + RainbowKit for wallet connection
- `@base-org/account` SDK installed (isolated lab only, not production)
- Zustand for client state

### Backend
- Supabase + PostgreSQL via Prisma
- Backend tracks: wallet state, predictions, vault locks, transactions, sessions, policies

## Complete Route Tree (27 routes)

### Pages (authenticated)
```
○ /vault                     — Capital state home (wallet strip + 4 capital cards)
○ /activity                  — Transaction timeline
○ /intent                    — Release confirmations + protection opportunities + policy runtime suggestions + delayed release previews
○ /policies                  — Behavioral protection policy engine
○ /sessions                  — Prediction logging + settlement
○ /settings                  — Account, Base Account, Productive Protection cards
○ /settings/base-account-lab — Base Account prototype (hidden lab)
○ /settings/productive-protection — Research surface (yield architecture)
```

### Pages (unauthenticated)
```
○ /            — Landing
○ /auth/login  — Login
○ /auth/signup — Signup
○ /dashboard   — Redirects to /vault
```

### API Routes
```
ƒ /api/bets                       — Prediction CRUD
ƒ /api/bets/[id]/settle           — Prediction settlement
ƒ /api/bets/[id]/protect          — Post-win protection
ƒ /api/onchain/event              — Onchain event ingestion
ƒ /api/policies                   — Policy CRUD
ƒ /api/policies/[id]              — Policy update/delete
ƒ /api/policies/activity          — Policy lifecycle events
ƒ /api/policies/evaluate          — Policy Runtime v1 evaluation (state-based)
ƒ /api/sessions                   — Session persistence
ƒ /api/vault/locks                — Vault lock queries
ƒ /api/vault/locks/[id]           — Individual lock
ƒ /api/wallet                     — Wallet state + deposit
ƒ /api/wallet/connect             — Wallet connection
ƒ /api/wallet/transactions        — Transaction history
ƒ /auth/callback                  — Supabase auth callback
```

## Complete File Map by Layer

### Layout & Navigation
- `src/app/layout.tsx` — Root layout (base:app_id meta tag, Builder Code env)
- `src/app/(authenticated)/layout.tsx` — TopHeader + PageFooter + MobileNav + Web3Provider
- `src/components/layout/top-header.tsx` — Desktop top nav
- `src/components/layout/page-shell.tsx` — Page wrapper
- `src/middleware.ts` — Auth protection

### Capital System
- `src/lib/capital-state.ts` — Re-export from canonical module
- `src/lib/capital/capital-state.ts` — Canonical capital state model + hooks (useCapitalState)
- `src/lib/capital/release-windows.ts` — 5 release window types (immediate, delayed, scheduled, staged, reviewed)
- `src/lib/web3/hooks.ts` — Read hooks (useVaultSummary, useVaultLocks)
- `src/lib/web3/tx-hooks.ts` — Write hooks (deposit, protect, release, withdraw)
- `src/lib/web3/config.ts` — wagmi + RainbowKit config
- `src/lib/web3/providers.tsx` — Web3 provider wrapper
- `src/store/useWalletStore.ts` — Zustand store

### Policy System (6 files, 4 API routes)
**Types:**
- `src/types/policy.ts` — ProtectionPolicy, PolicyCondition, PolicyAction, PolicyStatus, POLICY_TYPE_META
- `src/types/policy-orchestration.ts` — EvaluationContext, EventEvaluationResult, PolicySuggestion, PolicyRuntimeSuggestion, RuntimeEvaluationInput, ReflectionState, TimelineEntry, PolicySchedule

**Engine:**
- `src/lib/policies/policy-engine.ts` — validatePolicy(), normalizePolicyRequest(), status transitions
- `src/lib/policies/policy-evaluator.ts` — Event-driven evaluation (evaluatePolicies, evaluateSinglePolicy, condition checkers)
- `src/lib/policies/policy-runtime-evaluator.ts` — State-based evaluation (evaluatePoliciesForState, per-type checkers, 30-min cooldown)
- `src/lib/policies/policy-state-machine.ts` — Lifecycle state machine, schedule/cooldown management
- `src/lib/policies/policy-suggestions.ts` — Client-side generic suggestion engine + localStorage activity tracking
- `src/lib/policies/policy-timeline.ts` — In-memory timeline store
- `src/lib/policies/events.ts` — CapitalEvent types (8 event types)

**API routes:**
- `src/app/api/policies/route.ts` — GET list, POST create
- `src/app/api/policies/[id]/route.ts` — PATCH update, DELETE
- `src/app/api/policies/activity/route.ts` — Policy lifecycle events for Activity page
- `src/app/api/policies/evaluate/route.ts` — GET: state-based evaluation, returns PolicyRuntimeSuggestion[]

**Components:**
- `src/components/policies/summary-card.tsx` — Metric card
- `src/components/policies/policy-card.tsx` — Policy display + status menu + delete
- `src/components/policies/create-policy-modal.tsx` — 3-step creation form

### Account / Capability Architecture (Phase 5.2B)
- `src/hooks/use-wallet-capabilities.ts` — EIP-5792 capability detection
- `src/components/account/account-capability-panel.tsx` — Infrastructure diagnostics panel
- `src/lib/account/account-strategy.ts` — Strategy types
- `src/lib/account/base-account-client.ts` — Isolated Base Account SDK wrapper
- `src/lib/account/transaction-modes.ts` — Research execution modes
- `src/lib/account/builder-code.ts` — Builder Code utility (getBuilderDataSuffix, hasBuilderCode)

### Yield / Protection Architecture (Phase 6.1B — research only)
- `src/types/productive-protection.ts` — Conceptual protection modes
- `src/lib/yield/yield-strategies.ts` — Research strategy definitions
- `src/components/capital/delayed-release-mocks.tsx` — Interactive mock UX flows

### Shared Components
- `src/components/vault/vault-state-card.tsx` — Premium capital card
- `src/components/capital/capital-operations.tsx` — Deposit/Withdraw/Protect modals
- `src/components/capital/session-modal.tsx` — End Session modal
- `src/components/wallet/wallet-control.tsx` — Connect/disconnect/network control

### Backend
- `prisma/schema.prisma` — Models: User, Wallet, Bet, Transaction, VaultLock, Session, Policy
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/supabase/server.ts` — Supabase server client (for auth in API routes)

## Policy Runtime v1 — Architecture Detail

### Two evaluation modes

| Mode | Module | When | Trigger |
|---|---|---|---|
| State-based | policy-runtime-evaluator.ts | Page load / manual refresh | GET /api/policies/evaluate |
| Event-driven | policy-evaluator.ts | On capital events (future wiring) | Called from event handlers |

### State-based evaluation logic

| Policy Type | State Check | Produces |
|---|---|---|
| protect-profit-percentage | Recent won predictions with profits in available capital | protection-prompt with amount |
| prediction-profit-protection | Same, framed as timed horizon | protection-prompt with amount |
| release-reflection-required | Capital releasing or frequent releases detected | reflection-prompt |
| delayed-withdrawal | **Skipped** — event-activated, not state-evaluable | — |
| large-transfer-cooling | **Skipped** — event-activated, not state-evaluable | — |

### Design invariants (enforced at the type level)
- `requiresConfirmation` is always `true` — **do not change this**
- No transaction execution
- No automatic locking, releasing, withdrawing, or protecting
- All suggestions expire after 1 hour

### Cooldown
- 30-minute in-memory cooldown per policy (session lifetime)
- Pass `?skipCooldown=true` to bypass

## Design Tokens
- Warm stone surfaces (`#fafaf8`)
- Botanical green accents (`#4d8537`)
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
6. All policy suggestions require explicit user confirmation — no auto-execution

## Recently Completed (so no one redoes this)

### Policy Runtime v1 (2026-06-02)
- policy-runtime-evaluator.ts (state-based evaluation engine)
- /api/policies/evaluate API endpoint
- PolicyRuntimeSuggestion + RuntimeEvaluationInput types
- Intent page fetches and displays policy-based suggestions

### Before (2026-06-01)
- Phase 6.1B — Delayed release & productive protection architecture
- Phase 5.2B — Base-native capability architecture
- Phase 5.2A — Builder Code + Base.dev verification
- Phase 5.1 — Base Account Lab prototype
- Phase 6.1A — Behavioral protection policy engine
- Phases 3.9–4.9A — Capital state, onchain, sessions, predictions, UI, language

## Remaining Items (Roadmap)
1. **Policy execution wiring** — Wire accepted suggestions (protect-profit, delayed-withdrawal) to vault operations
2. **Loss→onchain lock creation** — Call createLock on ProtectedVault when prediction loses
3. **Base Account → production** — Move from lab to real wallet option
4. **Prediction terminology migration** — "Bet" → "Prediction" in API and DB
5. **Horizon detail surfaces** — Individual horizon cards
6. **Stronger empty states** — New user onboarding
7. **Delayed release → production** — Wire release windows to onchain
8. **Yield strategy evaluation** — Aave/Morpho (future)

## CI Status
- **ESLint:** ✅ 0 errors, 0 warnings
- **TypeScript:** ✅ clean
- **Next.js build:** ✅ 27 routes, 0 errors
