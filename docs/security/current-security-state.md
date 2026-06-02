# Current Security Posture

> **Date:** 2026-06-02  
> **Commit:** (current — see git log for latest)  
> **Status:** Living document — updated with each security-relevant change.

---

## 1. Security Philosophy

Elora Vault is built on a set of operational security principles that flow from its product philosophy:

- **Self-custodied.** Users retain full ownership of their USDC. Elora never holds private keys, cannot move funds independently, and has no custodial control over user wallets. Smart contracts enforce protection horizons, but only the user can initiate deposits, withdrawals, locks, or releases.
- **Behavior-first.** Security is not just about preventing unauthorized access — it is about preventing impulsive actions by the authorized user. The product's security model includes behavioral friction (confirmation countdowns, reflection periods, release windows) as a first-class protection.
- **Calm infrastructure.** No alerts, no urgency timers, no "act now" pressure. Security measures are quiet and structural — they shape what is possible rather than demanding attention.
- **Explicit-confirmation oriented.** Every capital-moving action requires deliberate user confirmation through the wallet provider (RainbowKit / wagmi). No action is inferred, batched silently, or executed in the background.
- **Non-custodial.** Elora has no access to user funds beyond what the smart contract permits. The ProtectedVault contract enforces time-locked withdrawals; Elora's backend cannot bypass these constraints.
- **Non-gamified.** No streak rewards, no achievement badges, no leaderboards. Security and behavioral hygiene are structural, not incentivized through gamification.

### Explicit no-automation guarantees

- Policy Runtime evaluates conditions and produces **suggestions only**. It does NOT execute capital movement.
- Every suggestion carries `requiresConfirmation: true` at the type level. No execution path bypasses this constraint.
- No hidden automation, background jobs, cron-based execution, or autonomous agents move funds.
- No AI-driven capital management exists. The Policy Runtime is deterministic, rules-based, and synchronous.

---

## 2. Authentication & Identity Model

### Authentication Provider

Elora uses **Supabase Auth** for all authentication. The auth flow is SSR-based:

- `src/middleware.ts` — Checks session on every request to protected routes; redirects unauthenticated users to `/auth/login`.
- `src/lib/supabase/server.ts` — Server-side Supabase client using cookie-based session management.
- `src/lib/supabase/client.ts` — Browser client for client-side auth operations.
- `src/app/auth/callback/route.ts` — Handles OAuth and email-link callbacks.

### User Identity Mapping

| System | Identifier | Notes |
|---|---|---|
| Supabase Auth | `auth.uid()` | UUID assigned by Supabase on user creation |
| Prisma / Postgres | `User.id` | Mirrors the Supabase Auth UUID |

The relationship assumes **UUID parity**: the Prisma `User.id` is set to match the Supabase Auth user's UUID. This happens in two places:

1. **Server-side upsert** — Every authenticated API route calls `prisma.user.upsert({ where: { id: user.id } })` before performing operations, using the Supabase Auth UUID directly.
2. **`handle_new_user()` trigger** — A Supabase Database Function (if configured) automatically creates the Prisma User row on signup.

### Authentication Assumptions

- All API routes assume the caller is authenticated. Routes return `401 Unauthorized` if `supabase.auth.getUser()` returns no user.
- The middleware protects all authenticated pages (vault, settings, dashboard, activity, intent) and redirects to login.
- Auth pages (login, signup) redirect authenticated users to `/vault`.
- There is no anonymous or public access to authenticated surfaces.
- RLS policies assume UUID parity between Supabase Auth and Prisma user rows.

---

## 3. Database Security

### Row Level Security

Supabase Row Level Security (RLS) is enabled on all user-data tables. RLS policies restrict access to owner-only rows, keyed on the Supabase Auth UUID.

### Protected Tables

| Table | Access Model | Notes |
|---|---|---|
| `User` | Owner-only | Created via auth trigger or upsert |
| `Wallet` | Owner-only | One-to-one with User |
| `Bet` / Prediction | Owner-only | Filtered on `userId` |
| `Transaction` | Owner-only | Linked to User |
| `VaultLock` | Owner-only | Linked to User |
| `Policy` | Owner-only | Linked to User |
| `Session` | Owner-only | Linked to User |

### Access Policies

- **No public anon access.** The Supabase anon key is used for authenticated client operations only; RLS enforces that unauthenticated requests see no data.
- **Owner-only reads and writes.** Every row-level policy restricts access to `auth.uid()` matching the row's `userId`.
- **Backend privileged flows** (e.g., onchain event ingestion, server-triggered state updates) use `SUPABASE_SERVICE_ROLE_KEY` via Prisma, bypassing RLS intentionally. These flows are server-side only and never exposed to the client.

### Hardening Completed

- `SECURITY DEFINER` functions reviewed and scoped to minimum required permissions.
- `handle_new_user()` trigger configured to safely create User rows without exposing internals.
- Mutable `search_path` fixed to prevent privilege escalation via schema manipulation.

### Known Limitations

| Issue | Status | Risk |
|---|---|---|
| FORCE RLS on service-role queries | Not currently enabled | Low — service-role is server-side only |
| Leaked password protection | Unavailable on current plan tier | Low — Elora uses OAuth / magic-link as primary auth paths; password auth is secondary |

---

## 4. Transaction Safety Model

### Wallet Confirmation Requirements

Every onchain transaction follows a strict confirmation flow:

1. **User initiates action** (deposit, protect, release, withdraw, approve) via UI button.
2. **wallet provider (RainbowKit)** opens the user's wallet interface for signature.
3. **User reviews and confirms** the transaction in their wallet.
4. **Transaction is submitted** to the network.
5. **Transaction lifecycle** is tracked through states: `idle → awaiting-signature → submitted → confirming → completed`.

### Transaction Lifecycle States

```
idle → awaiting-signature → submitted → confirming → completed
                                                ↘ failed / reverted
```

Each hook (`useVaultDeposit`, `useCreateLock`, `useReleaseLock`, `useWithdrawUnlocked`, `useUSDCApprove`) returns a `lifecycle` object with:

- `status` — Current state in the lifecycle
- `isActive` — Whether the transaction is in-flight (submitted/confirming)
- `isTerminal` — Whether the transaction has reached a final state
- `calmError` — User-readable error message on failure

### Wrong-Network Handling

- Every write hook targets `CURRENT_CHAIN.chainId` (currently Base Sepolia: 84532).
- wagmi's `useWriteContract` enforces chain ID matching; switching networks is handled by the wallet provider's native network-switching UI.
- No silent cross-chain execution — transactions fail with a clear error if the wallet is on the wrong network.

### Timeout and Recovery

- Wallet rejection (user declines in wallet) produces a calm error: "Authorization was not completed."
- Transaction replacement (speeding up / cancelling in wallet) is handled by the wallet provider natively.
- Failed submissions return a terminal error state; the user can retry from the UI.
- No automatic retry — user must explicitly re-initiate failed transactions.

### Builder Code Attribution Safety

The Builder Code dataSuffix (`getBuilderDataSuffix()`) is appended to all five production write hooks:

- `approve` (USDC approval)
- `deposit` (USDC → vault)
- `createLock` (protect capital)
- `releaseLock` (release horizon)
- `withdrawUnlocked` (withdraw from vault)

Safety guarantees:

| Property | Guarantee |
|---|---|
| Execution impact | None — attribution is informational calldata metadata only |
| Gas cost impact | Negligible (few bytes appended to calldata) |
| Fallback when unset | Returns `"0x"` — zero-length hex; viem treats as no-op |
| Client exposure | Raw builder code value is never exposed to client UI |
| ABI changes | None required — suffix is appended to existing calldata |
| Contract changes | None — ERC-8021 is a calldata convention, not a contract modification |

### EOA Fallback Guarantees

- All production write hooks use `writeContract` (EOA-compatible path).
- No forced batching — all transactions are single-call.
- No automatic smart-wallet migration — Base Account remains lab-scoped.
- If a wallet does not support `eth_sendCalls` (EIP-5792), the app falls back to standard `eth_sendTransaction` through wagmi's standard write path.

---

## 5. Base Account / Smart Wallet Safety

### Current Status

Base Account infrastructure is **lab/research scoped**. The production wallet flow remains the external-wallet path through RainbowKit.

### Capability Detection

- `use-wallet-capabilities.ts` detects EIP-5792 capabilities (batching, paymaster, sub-accounts) before any advanced execution path.
- No code path assumes EIP-5792 support — every execution path has a sequential fallback.
- Capability detection is informational/diagnostic only; no production flow branches on it.

### Safety Guarantees

| Guarantee | Status |
|---|---|
| Capability detection before advanced execution | ✅ Implemented |
| Sequential fallback always preserved | ✅ Enforced |
| No EIP-5792 assumption in production flows | ✅ Guaranteed |
| Smart wallet orchestration active in production | ❌ Not active — lab only |
| Base Account SDK wired to production wallets | ❌ Not wired — lab only |

### Lab Boundaries

The Base Account Lab (`/settings/base-account-lab`) provides:

- EIP-5792 capability diagnostics panel
- Base Account SDK wrapper (read-only)
- Sub-account detection tests
- Account relationship diagrams

None of these surfaces execute transactions or modify wallet behavior. They are observation and experimentation surfaces only.

---

## 6. Secret Handling Rules

### Operational Rules

The repository enforces the following rules for all contributors:

| Rule | Enforcement |
|---|---|
| Never commit `.env` files | Pre-commit hook blocks `.env`, `.env.*` patterns |
| Never commit private keys | Pre-commit hook scans for `PRIVATE_KEY=` and `0x`-prefixed 64-char hex values |
| Never expose RPC credentials | Pre-commit hook blocks `ALCHEMY_RPC_URL=` patterns |
| Never expose Supabase service-role keys | Pre-commit hook blocks `SUPABASE_SERVICE_ROLE_KEY=` |
| Never expose WalletConnect secrets | Standard pre-commit scanning |
| Never expose deployment credentials | Pre-commit hook blocks `VERCEL_OIDC_TOKEN=` |

### Pre-Commit Hook

A repository pre-commit hook is installed at `.githooks/pre-commit`. It blocks commits containing:

```bash
# File patterns
.env, .env.production, .env.vercel, vercel-env.txt, SECURITY_NOTES.md

# Content patterns
PRIVATE_KEY=, SUPABASE_SERVICE_ROLE_KEY=, DATABASE_URL=postgresql://,
DIRECT_URL=postgresql://, VERCEL_OIDC_TOKEN=, ALCHEMY_RPC_URL=.*alchemy\.com/v2/,
0x-prefixed 64-char hex, GitHub tokens, OpenAI/Anthropic keys
```

To activate locally:

```bash
git config core.hooksPath .githooks
```

### Remediation History

| Action | Status |
|---|---|
| Git history purge of `.env.production`, `.env.vercel`, `vercel-env.txt`, `SECURITY_NOTES.md` | ✅ Completed |
| Force push of cleaned history to `main` | ✅ Completed |
| Branch protections restored | ✅ Completed |
| CI pipeline hardened (placeholder-only env values, Node 22) | ✅ Completed |
| GitHub secret scanning + push protection | ✅ Enabled |
| Dependabot security updates | ✅ Enabled |

### Remaining Rotation Requirements

The following credentials were exposed in git history and should be rotated via provider dashboards. Rotation is outside git — update in Vercel/GitHub Secrets/ provider dashboards:

- Deployer private key (testnet only — Polygon Amoy)
- Supabase database password
- Supabase service role key
- Alchemy API key (testnet only — Polygon Amoy)
- Vercel OIDC token

See `docs/security/rotation-checklist.md` for the full rotation procedure.

---

## 7. Policy Runtime Safety

### Architecture

The Policy Runtime is a **suggestions-only evaluation layer**. It does not execute transactions, move funds, or modify onchain state.

### Safety Invariants

| Invariant | Enforcement |
|---|---|
| `requiresConfirmation` is always `true` | Enforced at the type level — `PolicyRuntimeSuggestion.requiresConfirmation` is a literal `true` |
| No automatic locking | Policy Runtime has no write access to vault contracts |
| No automatic releasing | Policy Runtime has no write access to vault contracts |
| No automatic protecting | Policy Runtime has no write access to vault contracts |
| No automatic withdrawing | Policy Runtime has no write access to vault contracts |
| No background execution | Evaluation is synchronous — triggered by user page visits, not cron or event queues |
| No autonomous AI capital management | Evaluation is deterministic, rules-based, and fully transparent |

### Two Evaluation Paths

| Path | Trigger | Safety |
|---|---|---|
| **State-based** (`policy-runtime-evaluator.ts`) | User visits Intent page → `GET /api/policies/evaluate` | Read-only API call; produces suggestions, no side effects |
| **Event-driven** (`policy-evaluator.ts`) | Capital events (future wiring) | Not yet wired to real-time handlers — when wired, will produce suggestions only |

### Output Safety

```typescript
interface PolicyRuntimeSuggestion {
  // ... metadata ...
  requiresConfirmation: true;  // Always true — type-level guarantee
  // No "execute" or "auto" field exists on this type
}
```

Every suggestion flows into the Intent page where the user must explicitly accept, snooze, or dismiss it. No suggestion bypasses this confirmation surface.

---

## 8. Infrastructure Maturity Snapshot

| Layer | Status | Notes |
|---|---|---|
| RLS | ✅ Enabled | Owner-only policies on all user-data tables |
| Builder Code attribution | ✅ Production-wired | Appended to 5 write hooks; no-op fallback when unset |
| Policy Runtime | ✅ Suggestions-only | No auto-execution; type-level `requiresConfirmation` guarantee |
| Activity Ledger | ✅ Production-built | Transaction and policy event history |
| Transaction Lifecycle UX | ✅ Hardened | Full lifecycle tracking, calm errors, wrong-network handling |
| Authentication | ✅ Production-built | Supabase Auth SSR, middleware-gated, UUID-based user mapping |
| Git history security | ✅ Remediated | History purge completed, pre-commit hook active, secret scanning enabled |
| Base Account infrastructure | 🔬 Lab/research | Capability detection exists; no production smart-wallet orchestration |
| Smart Wallet batching | 🔬 Not active | EIP-5792 detection is informational only |
| Productive Protection | 🔬 Research-only | No yield strategies, lending integrations, or capital deployment active |
| Formal security audit | ❌ Not yet performed | No third-party audit has been conducted |

---

## References

- `docs/security/secret-remediation-report.md` — Full secret exposure remediation details
- `docs/security/final-security-state.md` — Post-remediation verification
- `docs/security/rotation-checklist.md` — Credential rotation procedures
- `docs/security/github-security-config.md` — GitHub-level security settings
- `.githooks/pre-commit` — Pre-commit secret scanning hook
- `.env.example` — Placeholder-only environment template
- `README.md` — Product-level documentation
- `CLAUDE.md` — Project architecture reference
