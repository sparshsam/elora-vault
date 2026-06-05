# Policy Orchestration Architecture

## Overview

The policy orchestration layer transforms the policy system from "configuration storage" into a coherent behavioral orchestration system. Policies guide, suggest, stage, delay, and encourage reflection — they do NOT control, automate, or optimize.

## System Architecture

```
┌──────────────────────────────────────────────┐
│           Capital Events + State             │
│  (deposit, withdraw, protect, release,        │
│   prediction settle, session end, state snap) │
└────────────┬──────────────────┬───────────────┘
             │                  │
    ┌────────▼────────┐  ┌─────▼──────────┐
    │ Event-Driven    │  │  State-Based   │
    │ Evaluation      │  │  Evaluation    │
    │ (policy-        │  │ (policy-       │
    │  evaluator.ts)  │  │  runtime-      │
    │                 │  │  evaluator.ts) │
    │ Per-event       │  │ Per-page-load  │
    │ condition check │  │ state snapshot │
    └────────┬────────┘  └─────┬──────────┘
             │                  │
             └────────┬─────────┘
                      ▼
    ┌─────────────────────────────────┐
    │     Policy Runtime Suggestion   │
    │  (PolicyRuntimeSuggestion)      │
    │  • policyId, reason, action     │
    │  • amount, confidence, priority │
    │  • requiresConfirmation: true   │
    └────────────────┬────────────────┘
                     │
            ┌────────┼────────┐
            ▼        ▼        ▼
    ┌──────────┐ ┌──────┐ ┌──────────┐
    │Reflection│ │Suggest│ │ Timeline │
    │  Layer   │ │Engine │ │  Store   │
    │ • Delays │ │•State │ │ • Quiet  │
    │ • Pauses │ │•Event │ │  history │
    └──────────┘ └──────┘ └──────────┘
```

### Two Evaluation Modes

| Mode | Module | Trigger | Cooldown |
|---|---|---|---|
| **State-based** | `policy-runtime-evaluator.ts` | Page load / `GET /api/policies/evaluate` | 30 min in-memory |
| **Event-driven** | `policy-evaluator.ts` | Capital events (deposit, withdrawal, settlement) | Per-policy config (6h default) |

## Policy State Machine

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  ACTIVE │◄──────────────┐
                    └────┬────┘               │
                         │                    │
                    ┌────▼─────┐              │
                    │EVALUATING│              │
                    └────┬─────┘              │
                         │                    │
              ┌──────────┼──────────┐         │
              ▼          ▼          ▼         │
        ┌─────────┐ ┌─────────┐ ┌────────┐   │
        │SCHEDULED│ │REFLECT- │ │COOLDOWN│───┘
        └─────────┘ │  ING    │ └────────┘
                    └─────────┘
```

### States

| State | Evaluates? | Can Suggest? | Description |
|-------|-----------|-------------|-------------|
| draft | No | No | Policy being defined |
| active | Yes | Yes | Normal operation |
| evaluating | Yes | Yes | Actively checking conditions |
| scheduled | No | No | Waiting in temporal window |
| reflecting | No | No | In "Are you sure?" period |
| cooldown | No | No | Resting after evaluation |
| paused | No | No | User-suspended |

## Event Model

Events trigger evaluation in the event-driven mode. The state-based mode uses a snapshot instead of a specific event.

```
Capital Events:
  capital.deposited    — Deposit completed
  capital.withdrawn    — Withdrawal completed
  capital.protected    — Capital moved to protection
  capital.released     — Capital returned from protection
  prediction.settled   — Prediction outcome determined
  session.ended        — Session completed
  policy.activated     — Policy turned on
  time.window          — Temporal evaluation trigger
```

## State-Based Evaluation Logic

When `GET /api/policies/evaluate` is called, the runtime evaluates each active policy type differently:

| Policy Type | State Check | Produces |
|---|---|---|
| protect-profit-percentage | Recent won predictions with profits in available capital | protection-prompt with amount |
| prediction-profit-protection | Same, framed as timed horizon | protection-prompt with amount |
| release-reflection-required | Capital releasing or frequent releases detected | reflection-prompt |
| delayed-withdrawal | Skipped — event-activated | Evaluated at withdrawal time via event-driven path |
| large-transfer-cooling | Skipped — event-activated | Evaluated at deposit time via event-driven path |

## Suggestion Types

| Type | Source | Example |
|------|--------|---------|
| protection-prompt | Policy | "Protect 30% of this return" |
| reflection-prompt | Policy | "Take a moment before releasing" |
| cooling-notice | Policy | "This withdrawal has a 24h delay" |
| hesitation-check | Policy | "You've released capital 3x this week" |
| pause-suggestion | Contextual | "3 consecutive losses — consider pausing" |
| behavioral-observation | Contextual | "Capital ready — consider setting a horizon" |

## Cooldown System

After each evaluation, policies enter a cooldown period:

| Evaluation Mode | Default Cooldown |
|---|---|
| State-based (runtime evaluator) | 30 minutes (in-memory, session lifetime) |
| Event-driven | 6 hours (configurable per policy) |

Cooldowns prevent the same policy from triggering repeatedly on the same event or state pattern.

## Design Invariants

- **No auto-execution** — All suggestions require user confirmation (`requiresConfirmation: true`)
- **No automatic locking, releasing, withdrawing, or protecting**
- **No AI-agent behavioral prediction**
- **No gamification or scoring**
- **No performance metrics or optimization**
- **No urgency creation**

## File Map

```
src/types/
  policy.ts                         — Base policy types
  policy-orchestration.ts           — Extended orchestration types + PolicyRuntimeSuggestion

src/lib/policies/
  policy-engine.ts                  — Validation, normalization, status transitions
  policy-evaluator.ts               — Event-driven evaluation engine
  policy-runtime-evaluator.ts       — State-based evaluation layer (Runtime v1)
  policy-state-machine.ts           — State machine, scheduling, cooldowns
  events.ts                         — Capital event model
  policy-suggestions.ts             — Client-side generic suggestion engine
  policy-timeline.ts                — Quiet chronology of interventions

src/app/api/policies/
  route.ts                          — GET list, POST create
  [id]/route.ts                     — PATCH update, DELETE
  activity/route.ts                 — Policy lifecycle events
  evaluate/route.ts                 — State-based evaluation endpoint (Runtime v1)
```
