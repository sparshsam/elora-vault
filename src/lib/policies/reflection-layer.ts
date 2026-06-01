/**
 * Reflection Layer
 *
 * Soft friction flows that create space between impulse and action.
 * Reflections are NOT blocks — they are pauses. The user can always
 * proceed, but the system creates a moment of calm consideration.
 *
 * Types of reflection:
 *   - "Are you sure?" delays before capital actions
 *   - Pause windows after specific events (e.g., consecutive losses)
 *   - Release reconsideration prompts
 *   - Cooling-off suggestions for large movements
 */

import type { ReflectionState, PolicySuggestion } from "@/types/policy-orchestration";
import { DEFAULT_REFLECTION_SECONDS, EXTENDED_REFLECTION_SECONDS } from "@/types/policy-orchestration";
import type { CapitalEvent } from "./events";

/* ── Reflection Config ─────────────────────────── */

export interface ReflectionConfig {
  /** Duration of the reflection in seconds. */
  durationSeconds: number;
  /** The prompt shown to the user. */
  prompt: string;
  /** Additional context for the reflection. */
  context: string;
  /** Calm label for the confirm action. */
  confirmLabel: string;
  /** Calm label for the reconsider action. */
  reconsiderLabel: string;
}

/* ── Reflection Builders ───────────────────────── */

/**
 * Build a reflection config for a release action.
 */
export function releaseReflection(amount: number, releaseCountThisWeek: number): ReflectionConfig {
  if (releaseCountThisWeek > 2) {
    return {
      durationSeconds: EXTENDED_REFLECTION_SECONDS,
      prompt: `You've released capital ${releaseCountThisWeek} times this week. Take a longer moment to consider this release of $${amount.toFixed(2)}.`,
      context: "Frequent releases may reduce protected capital more than intended.",
      confirmLabel: "Continue with release",
      reconsiderLabel: "Keep protected",
    };
  }

  return {
    durationSeconds: DEFAULT_REFLECTION_SECONDS,
    prompt: `Release $${amount.toFixed(2)} from protection? Take a moment to confirm this is what you intend.`,
    context: "Protected capital is designed to stay separated. Releases are always available, but intention matters.",
    confirmLabel: "Confirm release",
    reconsiderLabel: "Keep protected",
  };
}

/**
 * Build a reflection config for a withdrawal action.
 */
export function withdrawalReflection(amount: number, totalAvailable: number): ReflectionConfig {
  const ratio = amount / totalAvailable;
  if (ratio > 0.5) {
    return {
      durationSeconds: EXTENDED_REFLECTION_SECONDS,
      prompt: `This withdrawal ($${amount.toFixed(2)}) is more than half your available capital. Take a longer moment to consider.`,
      context: "Large withdrawals reduce your ability to protect capital and set horizons.",
      confirmLabel: "Continue with withdrawal",
      reconsiderLabel: "Cancel withdrawal",
    };
  }

  return {
    durationSeconds: DEFAULT_REFLECTION_SECONDS,
    prompt: `Withdraw $${amount.toFixed(2)} from Elora? Confirm this is what you need right now.`,
    context: "Withdrawn capital leaves Elora and is no longer protected.",
    confirmLabel: "Confirm withdrawal",
    reconsiderLabel: "Cancel",
  };
}

/**
 * Build a reflection config for consecutive losses.
 */
export function consecutiveLossReflection(lossCount: number, totalLost: number): ReflectionConfig {
  return {
    durationSeconds: EXTENDED_REFLECTION_SECONDS,
    prompt: `${lossCount} consecutive prediction${lossCount === 1 ? "" : "s"} settled as losses totaling $${totalLost.toFixed(2)}. Consider pausing to reflect before the next one.`,
    context: "Taking a moment after consecutive losses is a calm financial practice.",
    confirmLabel: "Continue",
    reconsiderLabel: "Take a pause",
  };
}

/**
 * Build a reflection config for early release (before horizon ends).
 */
export function earlyReleaseReflection(daysRemaining: number): ReflectionConfig {
  return {
    durationSeconds: EXTENDED_REFLECTION_SECONDS,
    prompt: `This capital has ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining in its protection horizon. Early release means starting over.`,
    context: "Protection horizons are designed to be respected. Early release is always possible but worth considering carefully.",
    confirmLabel: "Release early",
    reconsiderLabel: "Keep protected",
  };
}

/* ── Reflection State Machine ──────────────────── */

export interface ReflectionUpdate {
  status: "ongoing" | "complete" | "dismissed";
  reflection: ReflectionState;
}

/**
 * Create a new reflection state.
 */
export function startReflection(subject: string, durationSeconds: number = DEFAULT_REFLECTION_SECONDS): ReflectionState {
  const now = Date.now();
  return {
    startedAt: now,
    endsAt: now + durationSeconds * 1000,
    subject,
    confirmed: false,
    dismissed: false,
    reminderCount: 0,
  };
}

/**
 * Check if a reflection period has ended.
 */
export function isReflectionComplete(reflection: ReflectionState, now: number = Date.now()): boolean {
  return now >= reflection.endsAt || reflection.confirmed || reflection.dismissed;
}

/**
 * Confirm a reflection (user chose to proceed).
 */
export function confirmReflection(reflection: ReflectionState): ReflectionState {
  return { ...reflection, confirmed: true };
}

/**
 * Dismiss a reflection (user chose to reconsider).
 */
export function dismissReflection(reflection: ReflectionState): ReflectionState {
  return { ...reflection, dismissed: true };
}

/**
 * Get the remaining time in a reflection as seconds.
 */
export function reflectionRemainingSeconds(reflection: ReflectionState, now: number = Date.now()): number {
  if (isReflectionComplete(reflection, now)) return 0;
  return Math.max(0, Math.ceil((reflection.endsAt - now) / 1000));
}

/* ── Event-Based Reflection Trigger ────────────── */

/**
 * Determine whether a capital event should trigger a reflection,
 * and if so, return the reflection config.
 */
export function shouldReflect(
  event: CapitalEvent,
  context: {
    recentReleaseCount: number;
    consecutiveLosses: number;
    totalAvailable: number;
  },
): ReflectionConfig | null {
  switch (event.type) {
    case "capital.released":
      return releaseReflection(event.amount, context.recentReleaseCount);

    case "capital.withdrawn":
      return withdrawalReflection(event.amount, context.totalAvailable);

    case "prediction.settled":
      if (event.outcome === "lost" && (event.consecutiveLosses ?? 0) >= 2) {
        const totalLost = event.stake * (event.consecutiveLosses ?? 1);
        return consecutiveLossReflection(event.consecutiveLosses ?? 1, totalLost);
      }
      return null;

    default:
      return null;
  }
}

/* ── Suggestion from Reflection ────────────────── */

/**
 * Convert a reflection config into a policy suggestion
 * for surfacing in the UI.
 */
export function reflectionToSuggestion(config: ReflectionConfig): PolicySuggestion {
  return {
    type: "reflection-prompt",
    title: "Take a moment",
    description: config.prompt,
    context: config.context,
    action: {
      label: config.confirmLabel,
      description: "Proceed after reflection.",
    },
  };
}
