# Security Notes — Elora Vault

> **Review date:** 2026-06-01
> **Phase:** 6.3E — Production Readiness & Security Review
> **Reviewer:** Nexus

---

## How to read this document

This is not a vulnerability tracker. It is a living document of known risks,
roadmap concerns, and future audit needs for Elora Vault. Each section covers
what was found, what the current posture is, and what should change before
the product handles meaningful real capital.

**Severity levels:**

| Level | Meaning |
|---|---|
| 🔴 Critical | Immediate action required. Active risk to funds or secrets. |
| 🟠 High | Should be addressed before mainnet / real-capital launch. |
| 🟡 Medium | Important but not blocking. Schedule for next release cycle. |
| 🔵 Low | Architectural recommendation. Track for roadmap items. |

---

## 1. 🔴 Secrets committed to version control

### 🔴 Private key in `.env.production` and `.env.vercel`

The file `.env.production` contains a raw deployer private key:

```
PRIVATE_KEY="e599a5a823c3b0bcbfe8f93ca7f62b3254ef7a8d7fb7be1e2361cdf5207c2f11"
```

This exact key appears in both `.env.production` and `.env.vercel`. Both files
are tracked in git history and publicly visible.

**Risk:** Anyone with access to the repo can:
- Derive the corresponding wallet address
- Deploy contracts from that account (if the key is still active)
- Sign messages as that account

**Action:** 
1. Rotate this key immediately. Assume it is compromised.
2. Generate a new deployer key for any future Base deployment.
3. Remove both `.env.production` and `.env.vercel` from git history.
4. Add them to `.gitignore`.
5. Verify no other commits contain the key (use `git log -p | grep e599a5a`).

### 🔴 Alchemy API key exposed

The Alchemy RPC URL contains an API key:
```
ALCHEMY_RPC_URL="https://polygon-amoy.g.alchemy.com/v2/mJeNalyxWmI_7azEYtjWaF3sVRN9PFRV"
```

**Risk:** API key abuse — anyone can use it to make RPC calls against Polygon Amoy
(testnet). Minimal risk since it's a testnet, but should still be rotated.

**Action:** Rotate the Alchemy key, remove from git, add to `.gitignore`.

### 🔴 Vercel OIDC token exposed

A Vercel OIDC JWT token is committed in both `.env.production` and `.env.vercel`.

**Risk:** This token could allow impersonation of the Vercel deployment environment
to downstream services trusting Vercel OIDC. Rotate it.

### 🟠 Database credentials in `.env.vercel`

Supabase connection strings with plaintext password:
```
DATABASE_URL="postgresql://postgres.qoxmibmbyjmkntzrckyr:35Highpark*@..."
DIRECT_URL="postgresql://postgres.qoxmibmbyjmkntzrckyr:35Highpark*@..."
```

**Risk:** Database credentials publicly accessible.

**Action:** Rotate Supabase database password immediately.

### 🟡 SUPABASE_SERVICE_ROLE_KEY partially exposed

Redacted in the review copy but check actual git history for completeness.

---

## 2. 🟠 .gitignore gaps

The current `.gitignore` only excludes `.env*.local` and `.env`. It does not
exclude:

- `.env.production`
- `.env.vercel`
- `vercel-env.txt`
- `force-deploy.txt`

**Action:** Add all of the above to `.gitignore`. Use `.env.example` as the
single committed env reference file.

---

## 3. 🟠 API safety

### 🟠 No input validation library (Zod)

All API routes do manual validation:

```typescript
if (!odds || !stake || stake <= 0) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}
```

**Risk:** Inconsistent validation coverage, potential type confusion, missing
edge cases (e.g., `NaN`, `Infinity`, negative zero).

**Recommendation:** Add Zod schemas for every request body and search param.
Central validation would catch malformed input at the route boundary.

### 🟠 No idempotency / replay protection

The `/api/onchain/event` route accepts `txHash` but does not check for
duplicates:

```typescript
// No check: is this txHash already logged?
await tx.transaction.create({ ... tx_hash: txHash, ... });
```

**Risk:** If the frontend retries or a user replays the request, the same
onchain event gets double-logged, inflating balances.

**Recommendation:** Add a unique constraint on `(userId, tx_hash)` in the
Transaction model. Skip creation if already exists.

### 🟠 No rate limiting

All API routes lack rate limiting. An authenticated user could:
- Spam prediction creation
- Rapid-fire settlement requests
- Flood the database with transactions

**Recommendation:** Add Vercel or in-app rate limiting before mainnet launch.

### 🟠 Race conditions in settlement

The settlement route (`/api/bets/[id]/settle`) has a read-then-write pattern:

```typescript
const wallet = await prisma.wallet.findUnique(...)
// ... compute new balances ...
await prisma.wallet.update(...)
await prisma.bet.update(...)
```

The bet update is inside a separate operation from the wallet update. If two
settlements arrive concurrently for different bets of the same user, the
second read could see stale balances.

**Recommendation:** Use `$transaction` with Prisma's interactive transactions
for all balance mutations.

### 🟡 No CSRF protection

The app relies on Supabase SSR cookie-based auth for API routes but has no
CSRF tokens. While SameSite cookies provide some protection, this is worth
noting for a financial app.

### 🔵 Wallet address trust

`/api/wallet/connect` accepts any address the client provides (validated for
format via `viem.getAddress` but not verified via signature). A user could
register any address as their "connected wallet."

**Risk level:** Low — the backend does not use `wallet_address` for
permission checks or contract writes. It's purely metadata for the user.

---

## 4. 🟠 Database consistency

### 🟠 Float for financial amounts

All monetary values use Prisma `Float` (JavaScript `number`):

```prisma
amount        Float
stake         Float
available_vault_balance Float @default(0)
```

**Risk:** IEEE 754 floating-point precision loss with large values or
repeated arithmetic. Example: `0.1 + 0.2 !== 0.3` in floating point.

**Recommendation:** For production-capital handling, migrate to PostgreSQL
`DECIMAL(20, 6)` or store amounts as integers (cents/smallest unit). This is
an architecture-level change.

### 🟠 No compound unique constraint on tx_hash

`tx_hash` on the `Transaction` model is nullable and has no uniqueness
constraint. See replay risk above.

### 🟠 ZCash (autoReleaseLocks) concurrency

The `autoReleaseLocks` function reads expired locks, then iterates and
processes them. If two requests hit this concurrently, both could process
the same lock.

**Recommendation:** Use `SELECT ... FOR UPDATE SKIP LOCKED` or process
locks inside a serializable transaction.

### 🟡 Virtual house balance not used

The `virtual_house_balance` field starts at 1,000,000,000 but is never
decremented or used in any API route's logic. The liability engine in
`src/lib/liability.ts` references it but the actual API routes don't use it.

This is dead weight in the schema and could confuse future developers.

---

## 5. 🔵 Contract interaction

### 🟠 Addresses hardcoded with fallback to zero address

```typescript
vaultAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`,
```

The mainnet vault address is set to the zero address. If `CURRENT_CHAIN` is
ever switched to `baseMainnet` without updating this, all contract reads will
return zero/empty and writes will throw.

**Recommendation:** Guard against zero-address vault on mainnet at
application startup with a clear error message.

### 🔵 USDC decimals hardcoded to 6

```typescript
const USDC_DECIMALS = 6;
```

This is correct for USDC on Base but fragile. If the vault ever supports a
different stablecoin, this would silently produce wrong amounts.

**Recommendation:** Read `decimals()` from the USDC contract at init time,
or make it a config parameter.

### 🔵 Approval flow allows over-approval

The approval hook calls `approve(vaultAddress, amount)` where `amount` is
exactly what the user wants to deposit. While this is safer than infinite
approval, it means each new deposit may need a fresh approval transaction.

This is a UX concern, not a security one.

---

## 6. 🟠 Frontend safety

### 🟠 No React error boundaries

If any component throws during render, the entire page will unmount.
For a financial app, this could leave users in an indeterminate state.

**Recommendation:** Add a top-level error boundary component wrapping each
page, with a clear message and a "refresh" action.

### 🟠 Stale zustand state

The wallet store is synced only on initial mount (via `useEffect` in the
vault page) and after specific actions (deposit, protect). If a user opens
two tabs, the second tab's state will be stale.

**Recommendation:** Add periodic polling (30-60s) or use Supabase Realtime
for live balance updates. At minimum, add a manual refresh button.

### 🟡 Optimistic updates after transaction

The deposit flow logs the onchain event via `/api/onchain/event` after
`deposit.isConfirmed`. If this logging request fails, the wallet store is
never updated and the deposit appears to never have happened (phantom loss).

**Recommendation:** Implement a reconciliation mechanism that periodically
compares onchain balances against the backend state.

### 🟡 No balance NaN guard in some display paths

`walletBalance.toLocaleString(...)` can throw if `walletBalance` is `NaN`,
`Infinity`, or negative. The `formatUSD` helper in capital-state.ts uses
`Math.max(0, ...)` but the vault page directly calls
`walletBalance.toLocaleString(...)` without a guard.

---

## 7. 🟡 Build & CI

### 🟡 Build requires env vars for static generation

The `next build` fails without setting `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`,
`NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Current CI/CD (Vercel) provides these automatically, but:
- Local development builds break without them
- The error messages are cryptic (prerender errors, not config errors)

**Recommendation:** Document required env vars for local builds. Consider
making the RainbowKit provider gracefully degrade when project ID is missing
(in dev mode only).

### 🟡 24 moderate npm vulnerabilities

```
24 moderate severity vulnerabilities
```

Run `npm audit fix` and review the changelog for each fix.

---

## 8. 🔵 Productive protection — roadmap caution

The **Productive Protection** layer (currently "Research-built") describes
future yield on protected capital. This must be carefully designed:

**Risks to consider before implementation:**
- Yield source risk: any DeFi integration introduces smart contract risk
- Lock interaction: if protected capital can earn yield, can it still be
  released on time? What if the yield protocol is frozen?
- Tax implications: yield may create taxable events
- Complexity: a simple timed vault is easy to reason about. Adding yield
  layers complicates the mental model significantly

**Recommendation:** Keep productive protection as a separate, opt-in feature
with clear risk disclosures. Never auto-enroll users.

---

## 9. 🔵 Base Account migration caution

The planned migration to Base Account infrastructure (future) introduces:

- **SDK dependency:** `@base-org/account` is currently imported but unused
  in production flows. The SDK could introduce breaking changes or bugs.
- **Account model change:** Moving from external-wallet-owns-capital to
  Base-Account-owns-capital is a fundamental shift. Smart contracts will
  need updates.
- **Migration state:** Users with locked capital during the migration must
  not lose access or have locks reset.

**Recommendation:** Plan for a phased migration with a pause on new deposits
during the transition period. Test thoroughly on Sepolia first.

---

## 10. 🟠 Audit readiness checklist

Before engaging a professional audit:

- [ ] Remove all secrets from git history
- [ ] Add `.env.production` and `.env.vercel` to `.gitignore`
- [ ] Rotate all exposed keys (deployer, Alchemy, Supabase DB, Vercel OIDC)
- [ ] Add Zod validation to all API routes
- [ ] Add idempotency keys to onchain event logging
- [ ] Add rate limiting to all API routes
- [ ] Migrate all monetary values to `DECIMAL(20,6)` in PostgreSQL
- [ ] Wrap all balance mutations in Prisma `$transaction`
- [ ] Add unique constraint on `(userId, tx_hash)` in Transaction model
- [ ] Add React error boundaries
- [ ] Implement periodic wallet balance reconciliation
- [ ] Add frontend balance NaN/negative guards
- [ ] Add compound unique index on `VaultLock` for `(userId, onchain_lock_id)`
- [ ] Review and fix `npm audit` warnings
- [ ] Add CSRF protection
- [ ] Implement wallet address verification via EIP-712 signature or
  `personal_sign` before connecting

---

## Summary

| Severity | Count | Key items |
|---|---|---|
| 🔴 Critical | 4 | Exposed private key, Alchemy API key, Vercel OIDC token, DB credentials |
| 🟠 High | 10 | No Zod, no idempotency, no rate limiting, Float amounts, race conditions, React error boundaries, stale state, .gitignore gaps, no unique tx_hash constraint |
| 🟡 Medium | 5 | Virtual house dead field, zero-address guard, local build friction, npm audit, approval UX |
| 🔵 Low | 4 | Wallet trust, hardcoded decimals, yield strategy caution, Base Account migration |

**Bottom line:** The app is well-architected with proper auth and ownership
checks, and works correctly for testnet usage. Before handling real capital
on mainnet, the critical secret exposure must be addressed and the high-
severity items should be resolved.
