# Policy System Deep-Dive Analysis

## 1. Layer Map (What Exists)

```
┌────────────────────────────────────────────────────────────────────┐
│                        API ROUTES (4)                              │
│  GET  /api/policies          → DB read                            │
│  POST /api/policies          → engine validate + normalize         │
│  PATCH/DELETE /api/policies/:id → engine canTransitionTo          │
│  GET  /api/policies/activity  → DB-derived events                 │
│  GET  /api/policies/evaluate  → runtime-evaluator + DB assemble   │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
┌─────────────────────────────┴──────────────────────────────────────┐
│                     COMPONENTS (3 React)                           │
│  summary-card.tsx     — generic display card                       │
│  policy-card.tsx      — individual policy display + menu           │
│  create-policy-modal.tsx — 3-step form, fetches /api/policies     │
│  (suggested-actions.tsx, confirm-action-modal.tsx — not in scope)  │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
┌─────────────────────────────┴──────────────────────────────────────┐
│                   LIBRARY LAYER (7 files)                          │
│                                                                     │
│  EVALUATION ENGINES (4 total):                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ 1. policy-engine.ts      — STUB (evaluatePolicy never    │      │
│  │                             called)                      │      │
│  │ 2. policy-evaluator.ts   — Event-driven, uses            │      │
│  │                             CapitalEvent + EvalContext   │      │
│  │ 3. policy-runtime-       — State-based, uses             │      │
│  │    evaluator.ts            RuntimeEvaluationInput         │      │
│  │ 4. policy-suggestions.ts — Client-side, uses             │      │
│  │                             PolicySuggestionContext       │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ORCHESTRATION / INFRA:                                             │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ policy-state-machine.ts  — 7-state machine, scheduling,   │      │
│  │                            temporal windows, cooldowns     │      │
│  │ policy-timeline.ts       — In-memory timeline store       │      │
│  │ events.ts                — CapitalEvent union type        │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
┌─────────────────────────────┴──────────────────────────────────────┐
│                     TYPE DEFINITIONS (2 files)                      │
│  policy.ts               ~143 lines — base types                    │
│  policy-orchestration.ts ~300 lines — extended orchestration types  │
└────────────────────────────────────────────────────────────────────┘
```

## 2. How Many Evaluation Engines and Why

**Four separate evaluation entry points** for a system with 5 policy types and simple CRUD logic:

| # | File | Function | Consumers | Status |
|---|------|----------|-----------|--------|
| 1 | `policy-engine.ts` | `evaluatePolicy()` | 0 | **DEAD CODE** — always returns `{triggered: false}`, never imported outside its file |
| 2 | `policy-evaluator.ts` | `evaluatePolicies()` | 0 (server-side) | **ORPHANED** — implemented, fully built with condition checkers per type, but no API route or event handler calls it |
| 3 | `policy-runtime-evaluator.ts` | `evaluatePoliciesForState()` | 1 (api/policies/evaluate/route.ts) | **THE ACTUAL ONE** — the only evaluator that runs |
| 4 | `policy-suggestions.ts` | `evaluatePolicySuggestions()` | 4 page components | **CLIENT-SIDE DUPLICATE** — evaluates the same policies in the browser with its own type system |

**Why this is a problem:**
- Engine #1 exists only as a stub comment. It was created as a placeholder, then the real work happened in files #2-#4 without removing the stub.
- Engine #2 (`policy-evaluator.ts`) is a fully working event-driven evaluator with condition checkers for all 5 policy types, but **nothing calls it**. It's an entire evaluation pipeline with no event handler feeding it.
- Engine #4 (`policy-suggestions.ts`) operates in a completely separate universe — different types, different input shape, different persistence strategy. It evaluates policy conditions client-side using localStorage.
- Engines #2 and #3 implement **duplicate condition-checking logic** for the same policy types:

  **protect-profit-percentage:**
  - `checkProfitProtection()` in evaluator.ts (lines 51-68)
  - `evaluateProfitProtection()` in runtime-evaluator.ts (lines 90-124)
  - Both check `event.type === 'prediction.settled'` / `winsWithProfit.length > 0`, both calculate `profit * protectPercentage / 100`

  **prediction-profit-protection:**
  - `checkPredictionProfitProtection()` in evaluator.ts (lines 124-141)
  - `evaluatePredictionProfitProtection()` in runtime-evaluator.ts (lines 132-163)
  - Near-identical profit calculation logic

  **release-reflection-required:**
  - `checkReleaseReflection()` in evaluator.ts (lines 103-122)
  - `evaluateReleaseReflection()` in runtime-evaluator.ts (lines 171-209)
  - Both check `totalReleased > 2`

## 3. Unnecessary Type Separation

### 3a. Two `PolicySuggestion` types with the same name

**File: `policy-orchestration.ts` (lines 57-67)**
```typescript
export interface PolicySuggestion {
  type: SuggestionType;       // "protection-prompt" | "reflection-prompt" | etc.
  title: string;
  description: string;
  action?: SuggestionAction;  // { label, description, href? }
  context: string;
  acknowledged?: boolean;
}
```

**File: `policy-suggestions.ts` (lines 14-26)**
```typescript
export interface PolicySuggestion {
  id: string;
  title: string;
  body: string;
  sourcePolicy: string;
  action: PolicySuggestionAction;  // "protect-capital" | "delay-withdrawal" | etc.
  amount?: number;
  durationDays?: number;
  priority: "low" | "medium" | "high";
  createdAt: string;
  expiresAt: string;
}
```

These are **different types with the same name**. The `policy-orchestration.ts` version is concept-oriented (type-based suggestion categories, optional href routing). The `policy-suggestions.ts` version is data-oriented (IDs, amounts, durations, priorities). They describe the same concept but are incompatible.

### 3b. Three evaluation context types for the same data

| Type | File | Difference |
|------|------|-----------|
| `EvaluationContext` | policy-orchestration.ts | Has `event: { type, timestamp }` + `activePolicyCount` + `lastEvaluatedAt` |
| `RuntimeEvaluationInput` | policy-orchestration.ts | Has `recentWins: {id, description, profit}[]` + `activeHorizons: {id, amount, durationDays}[]` |
| `PolicySuggestionContext` | policy-suggestions.ts | Has `recentGains` + `releasableAmount` + `activeHorizonCount` + `defaultDurationDays` |

All three contain `capital { available, protected, releasing, committed }` and `recentActivity` data (under varying field names). The overlap is ~80%:

```
EvaluationContext.capital === RuntimeEvaluationInput.capital === PolicySuggestionContext.{available, protected, releasing, committed}
(identical structure, just PolicySuggestionContext flattens it)
```

### 3c. Two status systems

- `PolicyStatus`: `"active" | "paused" | "draft"` — used in DB, API, components
- `OrchestrationStatus`: adds `"evaluating" | "scheduled" | "cooldown" | "reflecting"` (7 total)

The extended 4 states are **never persisted, never referenced in the API, never displayed in any component**. They exist only in the state machine's transition table. The state machine that consumes them has `transition()` called by no one.

### 3d. Two `PolicyActivityEvent` types

**Server-side** (api/policies/activity/route.ts): `"policy-created" | "policy-activated" | "policy-paused" | "policy-deleted"` — DB-derived lifecycle events
**Client-side** (policy-suggestions.ts): tracks `"generated" | "accepted" | "dismissed" | "snoozed" | "expired"` — suggestion lifecycle in localStorage

Both claim to be the "activity" layer. Neither references the other. The server sends events the client doesn't read; the client stores events the server doesn't know about.

## 4. Duplicate Logic Registry

### 4a. Cooldown enforcement (two implementations)

| Location | Mechanism | Lifecycle |
|----------|-----------|-----------|
| `policy-state-machine.ts:getCooldownStatus()` | Pure function, takes args | Never called outside its file |
| `policy-runtime-evaluator.ts:isInCooldown()` | `Map<string, number>` | Actively used per-request |
| `policy-evaluator.ts` (implicit) | `checkSchedule` → cooldownHours | Only consumer of state-machine cooldown |

Three cooldown models. The runtime evaluator's Map-based approach doesn't use the state machine's cooldown logic at all. The state machine's `getCooldownStatus()` is a pure function never invoked.

### 4b. Condition checkers (two implementations)

```
policy-evaluator.ts                    policy-runtime-evaluator.ts
─────────────────────                  ─────────────────────────
checkProfitProtection()                evaluateProfitProtection()
checkPredictionProfitProtection()      evaluatePredictionProfitProtection()
checkReleaseReflection()               evaluateReleaseReflection()
checkDelayedWithdrawal()               — NOT IMPLEMENTED (event-only)
checkLargeTransferCooling()            — NOT IMPLEMENTED (event-only)
```

The event-driven evaluator covers all 5 types. The state-based evaluator covers only 3. The client-side engine (`policy-suggestions.ts`) covers 4 different conditions using different calculations entirely:
- "Protect part of recent gains" (different from profit protection)
- "Re-protect released capital" (different from release reflection)
- "Delay large withdrawal overnight" (different from delayed withdrawal)
- "Review active horizons" (no server-side equivalent)

None of these align 1:1 with any server-side condition checker.

### 4c. Timeline vs. localStorage Activity

| Feature | `policy-timeline.ts` | `policy-suggestions.ts` (activity) |
|---------|---------------------|-----------------------------------|
| Storage | In-memory array | localStorage |
| Entry limit | 200 entries | 100 entries |
| Persistence | Session only | Cross-session |
| Queryable | Yes (4 query functions) | No (written, read as array) |
| Data consumers | **0** | 3 page components |
| Entry types | 9 timeline types | 5 statuses + 4 actions |

The timeline was built as a complete event recording system with 237 lines of code and 10 recording functions, but **nothing consumes it**. The suggestion engine's localStorage-based activity tracking (260 lines) is what actually stores and surfaces policy events to the UI.

## 5. Naming Drift Catalog

| Name | Location 1 | Location 2 | Conflict |
|------|-----------|-----------|----------|
| `evaluatePolicy` | policy-engine.ts (stub) | behavioral-suggestions.ts (different func) | `evaluatePolicy` vs `evaluatePolicyForSuggestion` — close enough to confuse |
| `evaluatePolicies` | policy-evaluator.ts | — | Unique but misleading (no consumer) |
| `evaluatePoliciesForState` | policy-runtime-evaluator.ts | — | Verb-prefixed to disambiguate from `evaluatePolicies` — the very need shows the split is wrong |
| `evaluatePolicySuggestions` | policy-suggestions.ts | — | Fourth variation of the same verb |
| `PolicySuggestion` (interface) | policy-orchestration.ts | policy-suggestions.ts | **Same name, completely different shape** |
| `PolicyActivityEvent` (interface) | policy-suggestions.ts | api/policies/activity/route.ts | Same name, different fields, different domains |
| `SuggestionType` | policy-orchestration.ts | — | 6 categories: "protection-prompt", "reflection-prompt", etc. |
| `PolicySuggestionAction` | policy-suggestions.ts | — | 4 actions: "protect-capital", "delay-withdrawal", etc. |
| `SuggestionAction` | policy-orchestration.ts | — | `{ label, description, href? }` — completely different from `PolicySuggestionAction` |

## 6. Orchestration Layers With No Orchestration Need

### 6a. `policy-state-machine.ts` (290 lines)

A complete state machine implementation with:
- 7-state transition table (STATE_MACHINE)
- Transition validation (`isValidTransition`, `transition`)
- State queries (`canEvaluate`, `canSuggest`, `getStateDescription`)
- Schedule management (`checkSchedule` with 4 schedule types)
- Temporal window checking (`checkTemporalWindow` with day-of-week, hour, min-interval)
- Cooldown management (`getCooldownStatus`)
- Default schedule factories (`defaultSchedule`, `delayedSchedule`)

**Actual usage in the entire codebase:**
- `canEvaluate("active")` called once — but it's passed a **string literal**, not a variable, making it equivalent to `"active" === "active" → true`
- `checkSchedule(defaultSchedule(), undefined, now)` called once — `defaultSchedule()` always returns `{ type: "immediate", cooldownHours: 6 }`, so `checkSchedule` returns `{ isActive: true }` unconditionally

**Never called anywhere:**
- `transition()` — full transition engine with guard conditions, zero consumers
- `canSuggest()` — the suggest-enablement abstraction, zero consumers
- `getStateDescription()` — zero consumers
- `checkTemporalWindow()` — zero consumers
- `getCooldownStatus()` — zero consumers
- `isValidTransition()` — zero consumers
- `allowedTransitions()` — zero consumers
- `delayedSchedule()` — zero consumers
- `cooldownHours` field — schedules always use `defaultSchedule()`, so this is always 6

**Conclusion:** The state machine is theoretical architecture. The system never transitions between intermediate states, never uses temporal windows, never checks schedule types. It is a 290-line abstraction for what amounts to `if (policy.status === "active")`.

### 6b. `policy-timeline.ts` (237 lines)

An in-memory timeline store with:
- 9 entry type constants
- 6 recording functions (recordPolicyEvaluation, recordSuggestionOffered, etc.)
- 6 query functions (getTimeline, getPolicyTimeline, getEntriesByType, etc.)
- Built-in bounded store (max 200 entries)

**Actual usage: Zero consumers.** No import anywhere in `src/except its own file. The only way data enters is through its own functions, and no code calls those functions.

**Competing with:** `policy-suggestions.ts`'s `readPolicyActivity`/`writePolicyActivity`/`recordPolicyActivity` which are actually consumed by 3 page components.

### 6c. `policy-evaluator.ts` (318 lines)

A fully implemented event-driven evaluation engine with condition checkers for all 5 policy types, suggestion builder, phase assignment, single-policy evaluation, cooldown management.

**Actual usage:** Zero consumers. No API route calls it. No event handler calls it. The entire event-driven evaluation pipeline exists in a vacuum.

**Competing with:** `policy-runtime-evaluator.ts` which does the same job differently and is the only one actually reachable through the API.

### 6d. `policy-engine.ts` `evaluatePolicy()` stub (lines 189-197)

A stub function that always returns `{ triggered: false, reason: "Evaluation not yet implemented." }`.

**Actual usage:** Zero consumers. Even the comment says "STUB — not wired to execution yet." The file is used only for `validatePolicy()`, `normalizePolicyRequest()`, and `canTransitionTo()` — the CRUD utilities. The evaluation function itself is dead weight.

## 7. Quantitative Summary

| Metric | Count | Notes |
|--------|-------|-------|
| Total policy system files | 14 | Types (2), lib (7), components (3), API routes (4) + overlapping across 2 evaluator universes |
| Lines of policy code | ~3,300 | Across all 14 files |
| Evaluation engines | 4 | 1 dead, 1 orphaned, 1 active, 1 client-side duplicate |
| Suggestion types with same name | 2 | `PolicySuggestion` in 2 files with incompatible shapes |
| Status systems | 2 | 3-state (used) + 7-state (unused) |
| Cooldown implementations | 3 | state machine pure func, runtime evaluator Map, evaluator schedule |
| Activity/timeline systems | 2 | In-memory timeline (0 consumers) + localStorage activity (3 consumers) |
| Dead code files | 2 | `policy-timeline.ts` (237 lines, 0 consumers), `policy-state-machine.ts` orchestration layer (~200 of 290 lines unused) |
| Orphaned files | 1 | `policy-evaluator.ts` (318 lines, fully implemented, 0 consumers) |
| Stub functions | 1 | `evaluatePolicy()` in policy-engine.ts |
| Type files that should be merged | 2 | `policy.ts` (143 lines) + `policy-orchestration.ts` (300 lines) could collapse to ~250 lines |

## 8. Root Cause Assessment

The system exhibits **architecture astronaut syndrome** — designing for complexity that doesn't yet exist. The evidence:

1. **The policy system manages 5 policy types with simple CRUD and conditional evaluation.** This is a fundamentally simple problem. Yet it has 4 evaluation engines, 2 status systems, 3 context types, and full orchestration infrastructure.

2. **Two parallel development streams** exist: event-driven (policy-evaluator + state-machine + timeline) and state-based (runtime-evaluator + suggestions + localStorage). Neither stream was reconciled when the other was built. The event-driven stream appears to be an earlier design that was abandoned in favor of the state-based approach, but the old files were never removed or deprecated.

3. **The base `policy.ts` types (143 lines) capture the real complexity** — 5 policy types, simple condition/action interfaces, metadata registry. Everything in `policy-orchestration.ts` (300 additional lines) is aspirational architecture that the actual system doesn't need at its current maturity.

4. **The state machine was built for a future where policies have complex lifecycle management** (scheduling, temporal windows, reflection periods, cooldowns with dynamic durations). Today, policies are created, updated, and deleted. The intermediate states add zero value.

## 9. Recommended Consolidation

To collapse from 4 evaluation paths to 1:

1. **Delete** `policy-engine.ts:evaluatePolicy()` stub
2. **Delete** `policy-timeline.ts` (dead code; if timeline is needed, build it on the DB)
3. **Delete** `policy-state-machine.ts:transition()`, `checkTemporalWindow()`, `getCooldownStatus()`, `canSuggest()`, `getStateDescription()` — none are consumed
4. **Deprecate** `policy-evaluator.ts` or merge its condition checkers into `policy-runtime-evaluator.ts`
5. **Merge** `policy-orchestration.ts` into `policy.ts` (or eliminate the orchestration types entirely, keeping only `RuntimeEvaluationInput` and `PolicyRuntimeSuggestion`)
6. **Reconcile** the two `PolicySuggestion` types into one, used by both server and client
7. **Unify** the two `PolicyActivityEvent` types into one server-backed source of truth
