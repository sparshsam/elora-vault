# Policy Orchestration Architecture

## Overview

The policy orchestration layer transforms the policy system from "configuration storage" into a coherent behavioral orchestration system. Policies guide, suggest, stage, delay, and encourage reflection — they do NOT control, automate, or optimize.

## System Architecture

```
┌─────────────────────────────────────────────┐
│               Capital Events                 │
│  (deposit, withdraw, protect, release,       │
│   prediction settle, session end)            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           Policy Evaluator                   │
│  • Evaluates all active policies             │
│  • Checks conditions against event context   │
│  • Respects cooldowns and schedules          │
│  • Returns suggestions + reflections         │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
┌────────────┐ ┌────────┐ ┌────────────┐
│ Reflection │ │Suggest │ │  Timeline  │
│   Layer    │ │ Engine │ │   Store    │
│ • Delays   │ │• Policy│ │ • Quiet    │
│ • Pauses   │ │ • Cont │ │   history  │
│ • Reconsid │ │  extual│ │ • No alerts│
└────────────┘ └────────┘ └────────────┘
```

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

Events trigger policy evaluation. Each event carries context about what happened.

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

## Evaluation Lifecycle

1. **Event occurs** — capital action is taken
2. **Policy scan** — all active policies checked against event
3. **Condition check** — each policy evaluates its trigger conditions
4. **Schedule check** — cooldown and temporal windows respected
5. **Suggestion generation** — matching policies produce calm suggestions
6. **Reflection check** — certain actions trigger "Are you sure?" delays
7. **Timeline record** — evaluation recorded for quiet history

## Reflection Layer

Reflections create space between impulse and action:

| Trigger | Duration | Behavior |
|---------|----------|----------|
| Release (normal) | 60s | Brief confirmation pause |
| Release (frequent) | 300s | Extended pause with context |
| Withdrawal (>50%) | 300s | Extended pause for large withdrawals |
| Consecutive losses (2+) | 300s | Pause with loss context |
| Early release | 300s | Extended pause with horizon context |

Users can always proceed after reflection. Reflections are not blocks.

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

| Policy Type | Default Cooldown |
|-------------|-----------------|
| Profit protection | 6 hours |
| Delayed withdrawal | 6 hours |
| Large transfer cooling | 6 hours |
| Release reflection | 1 hour |
| Prediction profit protection | 6 hours |

Cooldowns prevent the same policy from triggering repeatedly on the same event pattern.

## Future Execution Boundaries

The orchestration layer is designed for guidance, not execution.
The following boundaries are maintained:

### In Scope (Future)
- User-configurable schedule windows
- Persistent timeline (database-backed)
- Suggestion dismissal preferences
- Reflection duration customization
- Cooldown duration customization

### Out of Scope (Will Not Build)
- Automatic fund movement
- AI-agent behavioral prediction
- Gamification or scoring
- Performance metrics or optimization
- Trading automation
- Invisible or background execution
- Predictive manipulation
- Urgency creation

## File Map

```
src/types/
  policy.ts                         — Base policy types (unchanged)
  policy-orchestration.ts           — Extended orchestration types

src/lib/policies/
  policy-engine.ts                  — Entry point (re-exports all modules)
  events.ts                         — Capital event model
  policy-state-machine.ts           — State machine, scheduling, cooldowns
  policy-evaluator.ts               — Event-driven evaluation engine
  reflection-layer.ts               — "Are you sure?" delays and pauses
  behavioral-suggestions.ts         — Adaptive suggestion engine
  policy-timeline.ts                — Quiet chronology of interventions
```
