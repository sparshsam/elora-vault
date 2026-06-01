/**
 * Policy Event Model
 *
 * Events are the triggers that drive policy evaluation.
 * Every capital action emits an event; the policy engine
 * evaluates active policies against the event context.
 *
 * This is NOT a message queue — it is a synchronous evaluation
 * model. Events are evaluated immediately when they occur.
 * Future phases may introduce async/queued evaluation for
 * non-urgent policies.
 */

/**
 * All capital events that can trigger policy evaluation.
 * Each event carries the context needed for policy conditions
 * to evaluate against.
 */
export type CapitalEvent =
  | DepositEvent
  | WithdrawalEvent
  | ProtectionCreatedEvent
  | ProtectionReleasedEvent
  | PredictionSettledEvent
  | SessionEndedEvent
  | PolicyActivatedEvent
  | TemporalWindowEvent;

export type EventType = CapitalEvent["type"];

/* ── Event Payloads ────────────────────────────── */

export interface DepositEvent {
  type: "capital.deposited";
  amount: number;
  totalAvailable: number;
  timestamp: number;
}

export interface WithdrawalEvent {
  type: "capital.withdrawn";
  amount: number;
  totalAvailable: number;
  timestamp: number;
}

export interface ProtectionCreatedEvent {
  type: "capital.protected";
  amount: number;
  durationDays: number;
  totalProtected: number;
  timestamp: number;
}

export interface ProtectionReleasedEvent {
  type: "capital.released";
  amount: number;
  durationHeld: number; // how many days it was protected
  totalReturned: number;
  timestamp: number;
}

export interface PredictionSettledEvent {
  type: "prediction.settled";
  outcome: "won" | "lost" | "push";
  stake: number;
  profit: number;
  totalReturn: number;
  consecutiveLosses?: number; // running count of losses before this
  totalAvailable: number;
  timestamp: number;
}

export interface SessionEndedEvent {
  type: "session.ended";
  outcome: "won" | "lost" | "break-even";
  pnl: number;
  totalSessionsToday: number;
  timestamp: number;
}

export interface PolicyActivatedEvent {
  type: "policy.activated";
  policyId: string;
  policyType: string;
  timestamp: number;
}

export interface TemporalWindowEvent {
  type: "time.window";
  window: "hourly" | "daily" | "weekly" | "monthly";
  timestamp: number;
}

/* ── Event Helpers ─────────────────────────────── */

/** All event type strings for reference. */
export const EVENT_TYPES: EventType[] = [
  "capital.deposited",
  "capital.withdrawn",
  "capital.protected",
  "capital.released",
  "prediction.settled",
  "session.ended",
  "policy.activated",
  "time.window",
];

/** Human-readable labels for event types. */
export const EVENT_LABELS: Record<EventType, string> = {
  "capital.deposited": "Deposit completed",
  "capital.withdrawn": "Withdrawal completed",
  "capital.protected": "Capital protected",
  "capital.released": "Capital released",
  "prediction.settled": "Prediction settled",
  "session.ended": "Session ended",
  "policy.activated": "Policy activated",
  "time.window": "Temporal window",
};

/** Create a timestamp for the current moment. */
export function now(): number {
  return Date.now();
}

/** Check if an event is a capital flow event (not temporal or system). */
export function isCapitalFlowEvent(event: CapitalEvent): boolean {
  return [
    "capital.deposited",
    "capital.withdrawn",
    "capital.protected",
    "capital.released",
  ].includes(event.type);
}
