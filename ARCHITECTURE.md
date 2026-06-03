# Elora Vault — Architecture

This is the **canonical architectural memory** for Elora Vault. It is not exhaustive documentation. It is compression — enough to re-understand the system after weeks away and to resist architectural drift.

---

## 1. Product Philosophy

Elora is a **self-custodied behavioral capital vault on Base**. It helps users separate capital that feels available from capital that should stay protected.

- **Behavioral infrastructure** — rules defined before emotion arrives
- **Self-custodied** — your keys, your USDC, no third-party control
- **Calm UX** — quiet by default, present when needed, invisible when not
- **Policy-confirmed execution** — suggestions require explicit confirmation. Nothing moves automatically.
- **Non-speculative** — not a sportsbook, casino, DeFi dashboard, or trading terminal

### What Elora Avoids

- Hype UX, gamification, dopamine loops
- Hidden automation or auto-capital movement
- Overengineering and speculative abstractions
- Enterprise architecture theater
- Framework worship and unnecessary orchestration layers
- DeFi dashboard features (charts, APY, PnL, ROI)

---

## 2. Core System Overview

```
                      ┌──────────────┐
                      │   Auth (SB)  │
                      │Middleware SSR│
                      └──────┬───────┘
                             │ session
              ┌──────────────┼──────────────────┐
              │              │                  │
       ┌──────▼──────┐ ┌────▼─────┐   ┌────────▼────────┐
       │ Wallet (W3) │ │ Vault (W3│   │  Capital State   │
       │  RainbowKit  │ │   + SB)  │   │  useCapitalState │
       │  wagmi/viem │ │Contracts │   │  (merge layer)    │
       └──────┬──────┘ └────┬─────┘   └────────┬────────┘
              │             │                  │
              └──────┬──────┘                  │
                     │                         │
              ┌──────▼─────────────────────────▼──┐
              │        Policy Runtime v1           │
              │  state-based evaluator + engine    │
              │  suggestions, no auto-execution     │
              └────────────────┬───────────────────┘
                               │ suggestions
                        ┌──────▼──────┐
                        │  Intent     │
                        │  Decision   │
                        │  Cockpit    │
                        └──────┬──────┘
                               │ confirmed action
                        ┌──────▼──────┐
                        │  Activity   │
                        │  Memory     │
                        │  (events)   │
                        └─────────────┘
```

### Vault System

**Purpose:** Onchain USDC locking with timed protection horizons.

**Canonical source:** `contracts/src/ProtectedVault.sol` — immutable, no-owner contract on Base Sepolia.

**Key files:**
- `src/lib/web3/hooks.ts` — read hooks (vault summary, locks, USDC balance)
- `src/lib/web3/tx-hooks.ts` — write hooks (deposit, protect, release, withdraw)

**Characteristics:**
- No admin. No upgradability. Permissionless by design.
- O(n) view functions (gas-free). Locks are iterated linearly.
- SafeERC20, reentrancy-guarded, comprehensive NatSpec.
- 22 passing Forge tests.

### Capital State

**Purpose:** Merge three data sources (onchain, Supabase DB, wallet balance) into one canonical view.

**Canonical source:** `useCapitalState()` in `src/lib/capital/capital-state.ts`.

**Vocabulary (only these names):**
- `walletBalance` — USDC in connected wallet (outside Elora)
- `available` / `protected` / `releasing` / `committed` — the four capital states
- `totalEloraCapital` = available + protected + releasing + committed (wallet excluded)

**Dependencies:** `useWalletStore` (Zustand), `useVaultSummary`, `useVaultLocks`, `useUSDCBalance`.

**Boundaries:**
- `src/lib/capital-state.ts` is a re-export barrel. New code should import from `@/lib/capital/capital-state` directly.
- Canonical capital state is singular. No other hook recomputes capital. If it needs capital, it calls `useCapitalState()`.

### Activity System

**Purpose:** Unified event ledger combining onchain transactions, policy lifecycle events, and local suggestion activity.

**Canonical source:** The client-side merge in `src/app/(authenticated)/activity/page.tsx`.

**Data sources (3):**
1. Supabase DB transactions (`/api/wallet/transactions`)
2. Policy lifecycle events (`/api/policies/activity`)
3. LocalStorage suggestion activity

**Key:**
- Activity is assembled client-side from 3 fetches, deduplicated by prefix IDs (`tx:`, `policy:`, `suggestion:`)
- No server-side cache — full history loaded into browser on page visit

### Policy System

**Purpose:** User-defined behavioral rules that evaluate capital state and produce suggestions.

**Live files (only these 4):**
- `policy-engine.ts` — validation, normalization, status transitions (API routes)
- `policy-runtime-evaluator.ts` — state-based evaluation (the single active evaluation engine)
- `policy-suggestions.ts` — client-side suggestion engine, localStorage activity tracking
- `events.ts` — CapitalEvent types

**Safety invariants (type-level):**
- `requiresConfirmation` is always `true`
- No transaction execution in policy code
- 30-minute cooldown per policy (session lifetime)

**Two evaluation modes (only state-based is live):**
1. **State-based** (live) — `policy-runtime-evaluator.ts`, triggered by page visit to `/api/policies/evaluate`
2. **Event-driven** (future) — not wired. Previous implementation was deleted during stabilization.

**What was removed (~~dead modules pruned 2026-06-03~~):**
- ~~policy-evaluator.ts~~ (orphaned)
- ~~policy-timeline.ts~~ (in-memory store, 0 consumers)
- ~~policy-state-machine.ts~~ (7-state engine, 6/7 exports dead)
- ~~behavioral-suggestions.ts~~ (0 consumers)
- ~~reflection-layer.ts~~ (0 consumers)

### Wallet Infrastructure

**Purpose:** Wallet connection, network switching, transaction lifecycle management.

**Key files:**
- `src/lib/web3/config.ts` — wagmi + RainbowKit configuration. Connectors: MetaMask, Coinbase Wallet, Rainbow, WalletConnect.
- `src/lib/web3/providers.tsx` — Web3Provider wrapping WagmiProvider + QueryClientProvider + RainbowKitProvider
- `src/lib/web3/tx-hooks.ts` — 5 write hooks (approve, deposit, createLock, releaseLock, withdrawUnlocked), each with lifecycle + `getBuilderDataSuffix()` fallthrough

**Wallet scope:** RainbowKit provider is only in `(authenticated)/layout.tsx`. Landing and auth pages have no wallet context.

### Auth System

**Purpose:** Supabase-based authentication with middleware-gated routes and SSR session management.

**Key files:**
- `src/middleware.ts` — route protection (9 authenticated paths), session refresh via Supabase SSR
- `src/lib/supabase/client.ts` — browser client (lazy singleton, not created during prerender)
- `src/lib/supabase/server.ts` — server/API client (edge-compatible)

**Protected routes (all 9):** `/dashboard`, `/settings`, `/vault`, `/activity`, `/intent`, `/policies`, `/sessions`, `/insights`, `/research`.

**Auth pages:** Login and signup create the Supabase client lazily inside event handlers — safe for static prerendering.

### Environment System

**Purpose:** Centralized environment variable validation with clear error messages.

**Key files:**
- `src/lib/env.ts` — public env accessors (`NEXT_PUBLIC_*`), safe for client bundles
- `src/lib/env-server.ts` — server-only env accessors (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`)

**Required variables (6):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`.

**Behavior:** Missing required vars throw descriptive errors with fix instructions. Build fails intentionally — the app truly needs these to function.

### Contract Layer

**Purpose:** Self-custodied USDC vault with timed protection horizons.

**Location:** `contracts/src/ProtectedVault.sol` (Base Sepolia, verified).

**Dependencies:** forge-std (testing), OpenZeppelin (SafeERC20). Installed via `forge install`.

**State:** 22 passing tests. No owner, immutable, custom errors, SafeERC20.

### Research / Labs Isolation

**Purpose:** Contain experimental systems so they never affect production.

**Rules:**
- Labs live in `src/lib/account/` and are surfaced through `/settings/base-account-lab`
- Research concepts live in `src/types/productive-protection.ts` — no contract integration exists
- Archived research artifacts go to `docs/research/`
- No lab code is imported by production routes without explicit `@base-org/account` SDK isolation

---

## 3. Canonical Ownership Map

| System | Canonical Source | Key File |
|--------|-----------------|----------|
| **Capital state** | `useCapitalState()` | `src/lib/capital/capital-state.ts` |
| **Capital release logic** | `getAvailableReleaseWindows()` / `getProductionReleaseWindows()` | `src/lib/capital/release-windows.ts` |
| **Policy runtime** | `evaluatePoliciesForState()` | `src/lib/policies/policy-runtime-evaluator.ts` |
| **Policy validation** | `validatePolicy()` + `canTransitionTo()` | `src/lib/policies/policy-engine.ts` |
| **Client-side suggestions** | `evaluatePolicySuggestions()` | `src/lib/policies/policy-suggestions.ts` |
| **Activity persistence** | 3-way client merge | `activity/page.tsx` + `/api/onchain/event` |
| **Transaction lifecycle** | `getTransactionLifecycle()` | `src/lib/tx/transaction-state.ts` |
| **Auth state** | Supabase SSR session + middleware | `src/middleware.ts` + `src/lib/supabase/server.ts` |
| **Wallet connection** | RainbowKit via wagmi | `src/lib/web3/config.ts` + `src/lib/web3/providers.tsx` |
| **Wallet state (DB)** | Zustand store | `src/store/useWalletStore.ts` |
| **Environment validation** | `supabaseUrl()`, `supabaseAnonKey()`, etc. | `src/lib/env.ts` / `src/lib/env-server.ts` |
| **Smart contract** | ProtectedVault.sol | `contracts/src/ProtectedVault.sol` |
| **Builder Code** | `getBuilderDataSuffix()` | `src/lib/account/builder-code.ts` |

---

## 4. Repository Boundaries

| Layer | Rules |
|-------|-------|
| **Production runtime** | All code in `src/` that is not under `labs` or explicitly marked `research`. Imports must be traceable to a production page or API route. |
| **Labs** | Code in `src/lib/account/` related to Base Account infrastructure. Only accessible via `/settings/base-account-lab`. No production wallet flow depends on lab code. |
| **Research** | Code in `src/types/productive-protection.ts` and research page at `/research`. No contract integration, no yield execution, no production behavior. |
| **Docs/research/** | Archived research artifacts (design docs, conceptual types) that were formerly in production paths. Recoverable but not bundled. Must not be imported by production code. |

### Experimental Isolation Rules

- Base Account experiments stay under `src/lib/account/` and are only consumed by `/settings/base-account-lab`
- Research systems (`productive-protection.ts`, mocks archive) must not silently enter runtime
- Moving something from labs → production requires explicit architectural review, a new canonical source, and removal of the lab-only path
- Speculative systems should never enter production — they belong in `docs/research/` until validated

---

## 5. Architectural Invariants

These must never break:

1. **No hidden auto-execution.** All policy suggestions require explicit user confirmation. `requiresConfirmation: true` is enforced at the type level.
2. **No custodial flows.** The contract has no owner, no upgradeability, no admin functions. Users control their capital directly.
3. **EOA compatibility preserved.** No production code path assumes Base Account, batching, or smart wallets.
4. **Explicit user confirmations required.** Release modals include countdown timers. Capital never moves without deliberate action.
5. **Server secrets never exposed client-side.** `process.env.*` (without `NEXT_PUBLIC_` prefix) must never appear in client bundles. Server-only env vars are separated into `env-server.ts`.
6. **Canonical capital state must remain singular.** `useCapitalState()` is the only source. No component should recompute capital state independently.
7. **Transaction flows must remain understandable.** 5 write hooks follow identical patterns. Lifecycle states (idle/pending/confirming/confirmed/reverted/error) are explicit.
8. **Research code must not masquerade as production code.** No research code path may affect capital movement, transaction execution, or wallet behavior.
9. **The policy evaluation pathway must remain singular.** One live evaluation engine (`policy-runtime-evaluator.ts`). Dead evaluation modules have been removed.

---

## 6. System Flow Diagrams

### Capital State Flow
```
Wallet USDC → Deposit → Available → Protect → Protected (onchain lock)
                                               ↓
                      Released ← release tx ← ──┤
                      ↓
                      Available → Withdraw → Wallet USDC

Available → Commit → Committed (prediction) → Settle Won → Available
                                             → Settle Lost → (decreases)
```

### Policy Evaluation Flow
```
User visits /intent
  → Capital state snapshot + recent activity
  → GET /api/policies/evaluate
  → policy-runtime-evaluator.ts checks each active policy
  → Returns PolicyRuntimeSuggestion[] (requiresConfirmation: true)
  → Suggestion cards rendered on /intent
  → User accepts/snoozes/dismisses
  → No transaction execution at any point
```

### Auth Flow
```
GET /protected-page
  → Middleware checks Supabase SSR session
  → No session → redirect /auth/login
  → User submits email/password (lazy Supabase client created in handler)
  → Supabase auth → session cookie set
  → Redirect to /vault
```

### Transaction Lifecycle
```
User clicks "Deposit" → handleDeposit()
  → useVaultDeposit hooks into wagmi useWriteContract
  → Wallet popup → user confirms in MetaMask/RainbowKit
  → isPending → isConfirming → isConfirmed (or reverted / error)
  → On confirmation: invalidate wagmi query cache + syncFromServer()
  → POST /api/onchain/event to record in DB
  → Activity timeline updates
```

### Build Validation Flow
```
npm run lint        → ESLint (0 errors)
npm run typecheck   → tsc --noEmit (clean)
npm run build       → Next.js production build (requires .env.local)
npm run contracts:test → cd contracts && forge test (22 tests)
```

---

## 7. Repository Rules

1. **No abstraction without pressure.** Every wrapper, provider, and abstraction must justify its existence. Single-consumer wrappers should be inlined.
2. **Prefer directness over orchestration.** Direct function calls are better than event buses, provider chains, and lifecycle hooks.
3. **One canonical source per critical system.** Capital state, policy evaluation, activity — each has exactly one canonical owner.
4. **Experimental systems must be removable.** Labs and research should be deletable without affecting production flows.
5. **Avoid speculative scalability patterns.** Don't build for millions of users until there are hundreds. Premature scalability is the most common form of overengineering.
6. **Simplicity outranks cleverness.** A straightforward `if/else` is better than a polymorphic dispatch hierarchy.
7. **Every critical system should fit in a maintainer's head.** If a system can't be explained in 60 seconds, it should be simplified.
8. **Dead code must be removed, not commented out.** If a module has zero consumers, delete it (git history has the original).
9. **Build failures should be clear and actionable.** Environment validation throws specific variable names with fix instructions — not opaque library errors.

---

## 8. Operational Commands

```bash
# Validation (run before every push)
npm run lint              # ESLint — must be 0 errors
npm run typecheck         # tsc — must be clean
npm run build             # Next.js build — requires .env.local
npm run contracts:test    # Forge tests — 22 tests, all pass

# Contract development
cd contracts
forge build              # Solc 0.8.28
forge test               # Fast (6ms)
forge fmt                # Format Solidity

# Development
npm run dev              # Local dev server (localhost:3000)
npx prisma db push       # Push schema changes to Supabase
npx prisma studio        # Database UI

# Environment setup (first time)
cp .env.example .env.local  # Then fill in 6 required vars
```

**Pre-push checklist:**
- [ ] `git pull --rebase origin main` (remote moves fast)
- [ ] `npm run lint` (0 errors)
- [ ] `npm run typecheck` (clean)
- [ ] `npm run build` or verify the failure is env-only
- [ ] `cd contracts && forge test` if contracts touched
- [ ] `git status --short` — check for other agents' untracked files
- [ ] Use explicit `git add <files>` — don't stage other agents' WIP

---

## 9. Future Evolution Guidance

### Adding a New System

1. Define the canonical source before writing implementation code.
2. Add it to the ownership map in this document.
3. Start in labs or docs/research if speculative.
4. Ensure it does not break any architectural invariant (section 5).
5. Ensure it is removable — a single directory or import chain.
6. Add the operation to the commands section.

### Promoting Research → Production

1. Remove the lab-only path. Production flows must not depend on lab infrastructure.
2. Create a canonical source (section 3) with clear ownership.
3. Update the ownership map.
4. Remove any dead experimentation code from production paths.
5. Add tests covering the new production path.
6. Verify invariants (section 5) still hold.

### Preventing Drift

- If you discover a system that no longer matches its description in this document, update the document.
- If you add a dependency between systems, document it in section 2.
- If you remove a system, update the ownership map and boundary rules.
- This document is anti-drift infrastructure — keep it honest.
