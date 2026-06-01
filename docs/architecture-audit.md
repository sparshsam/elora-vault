# Elora Vault — Architecture Audit Report

> **Cadence:** Weekly | **Auditor:** Nexus | **Phase:** 6.4G
> **Date:** 2026-06-01 | **Commit:** 96e75c4

---

## Current Health

| Dimension | Score | Key Issue |
|---|---|---|
| Product philosophy | ✅ Solid | Not a sportsbook, not DeFi, not fintech — well-defended |
| Naming consistency | 🟠 Drifting | Bet/Prediction/Session triple; DB vs UI field gaps |
| Code organization | 🟡 Some drift | Duplicate builder-code, research code in lib/ |
| State architecture | 🟡 Fragile | Triple-source balance truth |
| Dead code | 🟡 Moderate | 1 unused module, 3 research-only files in lib/ |
| Component reuse | 🟡 Reasonable | Base modal exists but not reused across all modals |
| Type hygiene | 🟠 Needs cleanup | 6 alias types, re-export-only files |

---

## Priority Backlog

### 🔴 This week

1. **Delete `src/lib/base/builder-code.ts`** — it's a duplicate of
   `src/lib/account/builder-code.ts` with fewer features. The `account/`
   version is newer and more complete. Neither is imported in production
   yet, so the deletion is safe.

### 🟠 Next two weeks

2. **Rename Prisma model `Bet` → `Prediction`** — the word "bet" is
   sportsbook language. Elora doesn't do that. This requires a DB
   migration but the schema is small enough that it's manageable.
   Cascading changes: `/api/bets` routes, `types/prediction.ts` aliases.

3. **Consolidate balance sources** — `useCapitalState()` merges zustand,
   wagmi contract reads, and wagmi USDC reads with a fallback chain.
   Pick one source of truth and make the others explicit metadata caches.

4. **Move research files to `docs/research/`** — `yield-strategies.ts`,
   `productive-protection.ts`, and `release-windows.ts` are architecture
   research, not library code. They belong in docs.

### 🟡 This month

5. **Wire or deprecate `liability.ts`** — 8 exported functions, zero
   imports. The settlement routes have inline equivalents.
6. **Normalize `/api/bets` → `/api/predictions`** with a compat redirect.
7. **Reuse `capital-modal.tsx`** in the session and policy modals.

### 🔵 Nice to have

8. **Remove `types/bet.ts`** — it's a re-export-only file.
9. **Clean up DB schema** — drop `virtual_house_balance` (dead field),
   rename `savings_vault` → `releasing_capital`, drop `user_balance`
   if unused.

---

## Drift Warnings

### Elora still feels behavioral? ✅ Yes

The product surfaces (Vault → Session → Activity → Intent) are
coherent and capital-state-oriented. The policy engine is correctly
framed as "behavioral commitments, not automated execution." The
insight system avoids gamification.

### Not turning into a sportsbook? ✅ Yes for product, 🟠 No for code

The UI and product docs are clean. But the codebase still uses
"bet" everywhere (DB model, API routes, variable names). This is
a terminology debt from v0.1 that hasn't been fully cleaned up.

### Not turning into a fintech dashboard? ✅ Yes

The calm, modal-driven interactions and absence of charts/grids
says "behavioral tool," not "financial dashboard."

### Not turning into a DeFi yield product? ✅ For now

The `yield-strategies.ts` and `productive-protection.ts` files
are clearly marked "research-only" and not wired into production.
The philosophy documentation explicitly says yield is not the goal.
**Warning signal:** these files exist in `src/lib/` which gives
them the same structural weight as production code. Moving them
to `docs/research/` would remove the ambiguity.

---

## Observations

- The policy engine was added by upstream and the `Policy` Prisma
  model exists. The TS errors I saw earlier were stale client;
  after `prisma generate` they resolve cleanly.
- The `orchestration-flows.ts` and `transaction-modes.ts` in
  `lib/account/` are legitimate architecture research for the
  Base Account migration. Unlike the yield docs, they have a
  clear product dependency path. Keep them.
- The Zod validation module I added in 6.4E is being used by all
  API routes — good adoption.
- No new secrets have been committed. The `.gitignore` protections
  from 6.4F are holding.
- The builder-code duplication is the most actionable finding
  this week — it's a simple file deletion with zero risk.

---

## Next audit: 2026-06-08

### Pruning actions taken this cycle

- ✅ Deleted `src/lib/base/builder-code.ts` (duplicate of `src/lib/account/builder-code.ts`)
- 🔲 `api/place-bet.js` still in 11 historical commits — needs additional filter-repo pass

### Philosophy health check

| Criterion | Verdict | Evidence |
|---|---|---|
| Sportsbook drift? | ✅ No | UI calls them "predictions," model still says "Bet" (code debt, not product intent) |
| Fintech dashboard? | ✅ No | Calm modal-driven UX, no grid/chart-heavy dashboards |
| DeFi yield product? | ✅ No | Yield files are research-only, tagged as such, not wired into production |
| Gamification creep? | ✅ No | No scores, no streaks, no leaderboards. Observations are quiet and non-judgmental |
| Automation overreach? | ✅ No | Policies are commitments, not automated execution. Capital moves only with user intent |

**Area to watch:** The policy engine could drift into automation if future PRs
add execution triggers to policy conditions. The type definitions deliberately
separate "condition" from "action" to resist this, but code review must remain
vigilant.
