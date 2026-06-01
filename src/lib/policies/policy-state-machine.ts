/**
 * Policy State Machine
 *
 * Manages the lifecycle of a policy through orchestration states:
 *
 *   draft ──→ active ──→ evaluating ──→ scheduled
 *     ↑          │           │               │
 *     │          │           ↓               │
 *     │          │        reflecting         │
 *     │          │           │               │
 *     │          │           ↓               │
 *     │          ├────→  cooldown ←──────────┘
 *     │          │           │
 *     └──────────┴───────────┘
 *
 * Cooldown and scheduling are time-based transitions.
 * Reflection requires user acknowledgment.
 * Evaluation is triggered by events.
 *
 * This is NOT execution — it is orchestration.
 * No funds are moved by this state machine.
 */

import type { OrchestrationStatus, PolicySchedule, TemporalWindow } from "@/types/policy-orchestration";

/* ── State Machine Definition ───────────────────── */

interface StateDefinition {
  allowedTransitions: OrchestrationStatus[];
  description: string;
  /** Whether the policy is actively evaluating events in this state. */
  isEvaluating: boolean;
  /** Whether the policy can produce suggestions. */
  canSuggest: boolean;
}

const STATE_MACHINE: Record<OrchestrationStatus, StateDefinition> = {
  draft: {
    allowedTransitions: ["active"],
    description: "Policy is being defined — not evaluating.",
    isEvaluating: false,
    canSuggest: false,
  },
  active: {
    allowedTransitions: ["evaluating", "paused", "draft"],
    description: "Policy is active and evaluating events.",
    isEvaluating: true,
    canSuggest: true,
  },
  evaluating: {
    allowedTransitions: ["active", "scheduled", "reflecting", "cooldown"],
    description: "Policy is actively evaluating against an event.",
    isEvaluating: true,
    canSuggest: true,
  },
  scheduled: {
    allowedTransitions: ["active", "evaluating", "cooldown"],
    description: "Policy triggered and is waiting in a scheduled window.",
    isEvaluating: false,
    canSuggest: false,
  },
  reflecting: {
    allowedTransitions: ["active", "cooldown"],
    description: "Policy is in a reflection/pause window.",
    isEvaluating: false,
    canSuggest: false,
  },
  cooldown: {
    allowedTransitions: ["active", "draft"],
    description: "Policy is resting after evaluation.",
    isEvaluating: false,
    canSuggest: false,
  },
  paused: {
    allowedTransitions: ["active", "draft"],
    description: "Policy is paused — not evaluating.",
    isEvaluating: false,
    canSuggest: false,
  },
};

/* ── State Queries ─────────────────────────────── */

export function isValidTransition(from: OrchestrationStatus, to: OrchestrationStatus): boolean {
  return STATE_MACHINE[from]?.allowedTransitions.includes(to) ?? false;
}

export function allowedTransitions(status: OrchestrationStatus): OrchestrationStatus[] {
  return STATE_MACHINE[status]?.allowedTransitions ?? [];
}

export function canEvaluate(status: OrchestrationStatus): boolean {
  return STATE_MACHINE[status]?.isEvaluating ?? false;
}

export function canSuggest(status: OrchestrationStatus): boolean {
  return STATE_MACHINE[status]?.canSuggest ?? false;
}

export function getStateDescription(status: OrchestrationStatus): string {
  return STATE_MACHINE[status]?.description ?? "Unknown state.";
}

/* ── Transition Engine ─────────────────────────── */

export interface TransitionResult {
  allowed: boolean;
  from: OrchestrationStatus;
  to: OrchestrationStatus;
  reason?: string;
}

/**
 * Attempt a state transition.
 * Returns whether the transition is allowed, with a reason.
 */
export function transition(
  from: OrchestrationStatus,
  to: OrchestrationStatus,
  context?: { inCooldown?: boolean; reflectionComplete?: boolean },
): TransitionResult {
  if (!isValidTransition(from, to)) {
    return {
      allowed: false,
      from,
      to,
      reason: `Cannot transition from "${from}" to "${to}".`,
    };
  }

  // Additional guard: cannot leave cooldown until complete
  if (from === "cooldown" && to !== "active" && to !== "draft") {
    return {
      allowed: false,
      from,
      to,
      reason: "Cooldown can only transition to active or draft.",
    };
  }

  // Reflection requires acknowledgment to leave
  if (from === "reflecting" && to !== "cooldown" && context?.reflectionComplete === false) {
    return {
      allowed: false,
      from,
      to,
      reason: "Reflection must complete before transitioning.",
    };
  }

  return { allowed: true, from, to };
}

/* ── Schedule Management ───────────────────────── */

export interface ScheduleStatus {
  isActive: boolean;
  nextEvaluationAt?: number;
  reason?: string;
}

/**
 * Check whether a policy's schedule allows evaluation at this moment.
 */
export function checkSchedule(
  schedule: PolicySchedule,
  lastEvaluatedAt?: number,
  now: number = Date.now(),
): ScheduleStatus {
  // Immediate — always active
  if (schedule.type === "immediate") {
    return { isActive: true };
  }

  // Cooldown check — if the policy was recently evaluated, it may be resting
  if (lastEvaluatedAt) {
    const cooldownMs = schedule.cooldownHours * 60 * 60 * 1000;
    const nextAllowedAt = lastEvaluatedAt + cooldownMs;
    if (now < nextAllowedAt) {
      return {
        isActive: false,
        nextEvaluationAt: nextAllowedAt,
        reason: "Policy is in cooldown period.",
      };
    }
  }

  // Delayed — always active after cooldown (the delay is handled at scheduling time)
  if (schedule.type === "delayed") {
    return { isActive: true };
  }

  // Temporal window — check day/hour
  if (schedule.type === "temporal-window" && schedule.window) {
    return checkTemporalWindow(schedule.window, now);
  }

  // Event count — always active (threshold check happens during evaluation)
  if (schedule.type === "event-count") {
    return { isActive: true };
  }

  return { isActive: true };
}

function checkTemporalWindow(window: TemporalWindow, now: number): ScheduleStatus {
  const date = new Date(now);

  // Day of week check
  if (window.dayOfWeek !== undefined) {
    if (date.getDay() !== window.dayOfWeek) {
      return {
        isActive: false,
        reason: `Outside scheduled day (expected ${window.dayOfWeek}, got ${date.getDay()}).`,
      };
    }
  }

  // Hour check
  if (window.hour !== undefined) {
    if (date.getHours() !== window.hour) {
      return {
        isActive: false,
        reason: `Outside scheduled hour (expected ${window.hour}, got ${date.getHours()}).`,
      };
    }
  }

  // Min interval check
  if (window.minIntervalHours !== undefined) {
    // The caller should check this via lastEvaluatedAt
    return { isActive: true };
  }

  return { isActive: true };
}

/* ── Cooldown Management ───────────────────────── */

export interface CooldownStatus {
  isCooling: boolean;
  remainingMinutes: number;
  endsAt: number;
}

/**
 * Calculate cooldown status from a policy's last evaluation.
 */
export function getCooldownStatus(
  cooldownHours: number,
  lastEvaluatedAt?: number,
  now: number = Date.now(),
): CooldownStatus {
  if (!lastEvaluatedAt) {
    return { isCooling: false, remainingMinutes: 0, endsAt: now };
  }

  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const endsAt = lastEvaluatedAt + cooldownMs;

  if (now >= endsAt) {
    return { isCooling: false, remainingMinutes: 0, endsAt };
  }

  const remainingMs = endsAt - now;
  return {
    isCooling: true,
    remainingMinutes: Math.ceil(remainingMs / 60000),
    endsAt,
  };
}

/* ── Default Schedules ─────────────────────────── */

import { DEFAULT_COOLDOWN_HOURS } from "@/types/policy-orchestration";

export function defaultSchedule(): PolicySchedule {
  return {
    type: "immediate",
    cooldownHours: DEFAULT_COOLDOWN_HOURS,
  };
}

export function delayedSchedule(delayHours: number): PolicySchedule {
  return {
    type: "delayed",
    delayHours,
    cooldownHours: DEFAULT_COOLDOWN_HOURS,
  };
}
