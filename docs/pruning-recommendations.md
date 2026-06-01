# Pruning Recommendations

> **Phase:** 6.6 — Repository Stabilization & Security Completion
> **Status:** Safe to execute — no large system deletions recommended

---

## Immediate (Safe to delete now)

### 1. ✅ DONE — `src/lib/base/builder-code.ts`
Duplicate of `src/lib/account/builder-code.ts`. Neither is imported by
production code. Deletion is zero-risk.

**Status:** Deleted.

### 2. `src/types/bet.ts` — re-export shim

```typescript
export type { BetRecord, BetStatus, BetType, CreateBetRequest, SettleResult } from "./prediction";
```

This file adds zero value. It exists only to translate `Prediction` →
`Bet` for backward compatibility. After the terminology migration,
this file goes away.

**Action:** Remove. Update any import `from "@/types/bet"` → `from "@/types/prediction"`.

### 3. `src/types/prediction.ts` — alias types

The following are aliases that can be removed after migration:

```typescript
export type BetType = PredictionType;           // same type
export type BetStatus = PredictionStatus;       // same type
export type BetRecord = PredictionRecord & { betType: PredictionType };  // compatibility wrapper
export type CreateBetRequest = CreatePredictionRequest & { betType?: PredictionType };
export type SettleResult = PredictionSettleResult;  // same type
```

**Action:** Remove the alias lines. Keep `PredictionRecord`, `CreatePredictionRequest`,
`PredictionSettleResult` as the canonical types.

### 4. `src/types/session.ts` — `BettingSession` alias

```typescript
export type BettingSession = CapitalSession;
```

**Action:** Remove this line. Update any consumer to use `CapitalSession`.

---

## Short-term (Verify before deletion)

### 5. `src/lib/liability.ts` — unused settlement engine

8 exported functions, zero imports. The settlement routes have their own
inline versions of `calculateProfit` and `calculateTotalReturn`.

**Risk of deletion:** Low. Nothing breaks. But the settlement functions
are well-tested pure logic that could be valuable if the routes are
refactored.

**Recommendation:** Don't delete yet. Mark as `@deprecated` and remove
in 30 days if still unimported.

### 6. `src/lib/yield/yield-strategies.ts` — research document in lib/

This is architecture research for future yield optionality. It's correctly
marked "Research-only" but lives in `src/lib/` with production weight.

**Action:** Move to `docs/research/yield-strategies.md`. Same for
`src/types/productive-protection.ts` → `docs/research/productive-protection-types.md`.

### 7. `src/lib/capital/release-windows.ts` — research document

Conceptual models for delayed release. No production code depends on it.

**Action:** Move to `docs/research/release-windows.md`.

---

## Watch (Do not prune — legitimate research)

These files are research code with a clear dependency path to future features:

| File | Purpose | Keep? |
|---|---|---|
| `src/lib/account/orchestration-flows.ts` | EIP-5792 transaction orchestration | ✅ Keep — Base Account migration path |
| `src/lib/account/transaction-modes.ts` | Transaction execution mode research | ✅ Keep — same dependency |
| `src/lib/account/base-account-client.ts` | Base Account SDK wrapper | ✅ Keep — same dependency |
| `src/lib/account/builder-code.ts` | ERC-8021 attribution | ✅ Keep (single canonical version) |
| `src/lib/web3/use-wallet-capabilities.ts` | EIP-5792 detection | ✅ Keep — already imported |
| `src/lib/insights/behavioral-observations.ts` | Soft observation engine | ✅ Keep — aligned with product philosophy |

---

## Folder simplification

### Current `src/lib/` organization (flat)

```
src/lib/
├── account/         ✅ Keep (Base Account + builder code)
├── base/            ❌ Deleted (duplicate builder-code)
├── capital/         ⚠️ Move research docs out
├── contracts/       ✅ Keep
├── insights/        ✅ Keep
├── policies/        ✅ Keep (new policy engine)
├── supabase/        ✅ Keep
├── tx/              ✅ Keep (transaction lifecycle)
├── web3/            ✅ Keep
├── yield/           ⚠️ Move to docs/research/
├── capital-state.ts ✅ Keep
├── liability.ts     ⚠️ Mark deprecated
├── prisma.ts        ✅ Keep
├── transaction-types.ts ✅ Keep
├── utils.ts         ✅ Keep
└── validation.ts    ✅ Keep
```

### Proposed simplified structure

```
src/lib/
├── account/         Keep
├── capital/         Keep (remove research-only files)
├── contracts/       Keep
├── insights/        Keep
├── policies/        Keep
├── supabase/        Keep
├── tx/              Keep
├── web3/            Keep
├── capital-state.ts Keep
├── liability.ts     Mark @deprecated
├── prisma.ts        Keep
├── transaction-types.ts Keep
├── utils.ts         Keep
└── validation.ts    Keep

docs/research/       New directory — move yield, productive-protection, release-windows
```

---

## Technical Debt Summary

| Item | Type | Effort | Priority |
|---|---|---|---|
| `base/builder-code.ts` duplicate | Dead code | 0d | 🔴 Done |
| `types/bet.ts` re-export | Code smell | 0.1d | 🟡 Next |
| Prediction aliases in `prediction.ts` | Code smell | 0.2d | 🟡 Next |
| `BettingSession` alias | Code smell | 0.1d | 🟡 Next |
| `liability.ts` unused | Dead code | 0d | 🟢 Mark deprecated |
| Research docs in lib/ | Structural | 0.5d | 🟡 This month |
| Bet → Prediction terminology | Architecture | 2d | 🟠 Phase 2 |
| Triple-source capital state | Architecture | 3d | 🟠 Phase 3 |
| Modal reuse | Code quality | 0.5d | 🟢 Nice to have |
