# Terminology Migration Proposal

> **Phase:** 6.6 — Repository Stabilization & Security Completion
> **Status:** Proposal — no destructive actions taken

---

## Current State: Three Words, One Concept

| Layer | Current term | Where it lives |
|---|---|---|
| Prisma model | `Bet` | `prisma/schema.prisma` |
| API routes | `bets` | `/api/bets`, `/api/bets/[id]/settle`, `/api/bets/[id]/protect` |
| Frontend types | `Prediction` | `types/prediction.ts` — `PredictionRecord`, `CreatePredictionRequest` |
| Re-export shim | `Bet` as alias | `types/bet.ts` — re-exports prediction types as `BetType`, `BetStatus`, etc. |
| UI page | `Session` | Page title "Sessions", route `/sessions` |
| DB field | `total_wagered` | Prisma `Wallet` model — "wagered" is sportsbook language |

### Canonical term recommendation

**"Prediction"** is the intended term. The product calls it "Log a Prediction"
in the UI. The Prisma model and API routes should reflect this.

**"Session"** is the page/container grouping predictions. A session has a
title, category, outcome, and PnL. Predictions are individual records
within or outside sessions. These are related but distinct concepts.

---

## Phase 1: Schema Migration (DB)

No destructive changes — additive + rename only.

### Step 1a: Rename Prisma model `Bet` → `Prediction`

```prisma
/// A prediction record — log of a capital commitment with expected outcome.
model Prediction {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  description   String   @default("")
  sport         String   @default("Other")
  league        String?
  event_name    String?
  marketType    MarketType @default(MONEYLINE)
  selection     String   @default("")
  odds          Int      @default(0)
  stake         Float    @default(0)
  potentialProfit Float  @default(0)
  potential_return Float @default(0)
  status        BetStatus @default(OPEN)
  settledAt     DateTime?

  at_risk_before  Float?
  at_risk_after   Float?
  user_balance_before Float?
  user_balance_after  Float?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Migration command:** `prisma migrate dev --name rename-bet-to-prediction`

**Data preservation:** The underlying PostgreSQL table can be renamed:
```sql
ALTER TABLE "Bet" RENAME TO "Prediction";
```

### Step 1b: Remove alias types

Delete `src/types/bet.ts` (re-export-only file). Update any imports to
use `types/prediction.ts` directly.

---

## Phase 2: API Migration (zero-downtime)

Maintain backward compatibility during migration.

### Step 2a: Add new routes

```
POST /api/predictions        → new primary
GET  /api/predictions        → new primary
PATCH /api/predictions/:id/settle  → new primary
PATCH /api/predictions/:id/protect → new primary
```

### Step 2b: Add redirect layer

Old routes continue to work as redirects:

```typescript
// /api/bets → redirect to /api/predictions
export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/bets', '/api/predictions');
  return NextResponse.redirect(url);
}
```

### Step 2c: Deprecation window

- Week 1: Both routes active, old routes log deprecation warning
- Week 2: Old routes return 301 redirect
- Week 3: Old routes removed

---

## Phase 3: DB Field Renames (background, non-blocking)

Low-priority field renames for philosophical consistency:

| Current | Proposed | Reason |
|---|---|---|
| `total_wagered` | `total_committed` | "Wagered" is sportsbook language |
| `savings_vault` | `releasing_capital` | "Savings" implies positive, but it's capital in transition |
| `at_risk_balance` | `committed_balance` | "At risk" sounds like gambling; "committed" is behavioral |

These are cosmetic — the API can alias them at the response layer without
requiring immediate DB migrations.

---

## Phase 4: Frontend alignment

No changes needed on the frontend — it already uses "Prediction" and
"Session" correctly. The mismatch is entirely in the backend terminology.

---

## Compatibility risk assessment

| Change | Breaking? | Mitigation |
|---|---|---|
| Prisma model rename | ✅ No (Prisma abstracts table names) | Generate client, update queries |
| API route rename | ⚠️ Yes, if external clients call `/api/bets` | Redirect layer for 2 weeks |
| DB field renames | ⚠️ Yes, if any raw SQL queries exist | Apply aliases first, then rename |
| Type alias removal | ✅ No (types are compile-time only) | Fix imports in same PR |
