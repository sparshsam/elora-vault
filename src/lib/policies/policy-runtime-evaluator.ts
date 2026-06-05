/**
 * Policy Runtime Evaluator v1
 *
 * Evaluates active user-defined policies against current capital state
 * and recent activity. Produces structured suggestions that flow into
 * the existing confirmation UI (Intent page).
 *
 * This is a STATE-based evaluator, NOT event-driven. It answers:
 *   "Given the current state of my capital, what do my policies suggest?"
 *
 * Design invariants:
 *   - No transaction execution — suggestions require user confirmation
 *   - No automatic locking, releasing, withdrawing, or protecting
 *   - Output is purely informational + intent-driven
 *   - requiresConfirmation is always true
 *
 * Event-driven evaluation (for real-time triggers) lives in
 * policy-evaluator.ts — this module complements it for state snapshots.
 */

import type { ProtectionPolicy } from "@/types/policy";
import type {
  PolicyRuntimeSuggestion,
  RuntimeEvaluationInput,
} from "@/types/policy-orchestration";

/* ── In-Memory Cooldown Store ────────────────── */

/**
 * Tracks when each policy was last evaluated, keyed by policy ID.
 * Used for cooldown enforcement across consecutive state checks.
 * Resets on page reload (session lifetime).
 */
const lastEvaluatedAt = new Map<string, number>();

/** Default cooldown between state-based evaluations (30 minutes). */
const STATE_COOLDOWN_MS = 30 * 60 * 1000;

function isInCooldown(policyId: string, now: number): boolean {
  const last = lastEvaluatedAt.get(policyId);
  if (!last) return false;
  return now - last < STATE_COOLDOWN_MS;
}

function markEvaluated(policyId: string, now: number): void {
  lastEvaluatedAt.set(policyId, now);
  // Prevent unbounded growth
  if (lastEvaluatedAt.size > 200) {
    const oldest = lastEvaluatedAt.keys().next().value;
    if (oldest !== undefined) lastEvaluatedAt.delete(oldest);
  }
}

/* ── Suggestion Builder ──────────────────────── */

function buildSuggestion(params: {
  policyId: string;
  policyTitle: string;
  policyType: ProtectionPolicy["type"];
  reason: string;
  suggestedAction: PolicyRuntimeSuggestion["suggestedAction"];
  amount?: number;
  confidence: PolicyRuntimeSuggestion["confidence"];
  priority: number;
  evaluatedAt: number;
}): PolicyRuntimeSuggestion {
  return {
    policyId: params.policyId,
    policyTitle: params.policyTitle,
    policyType: params.policyType,
    reason: params.reason,
    suggestedAction: params.suggestedAction,
    amount: params.amount,
    confidence: params.confidence,
    priority: params.priority,
    requiresConfirmation: true,
    expiresAt: params.evaluatedAt + 3_600_000, // 1 hour expiry
    evaluatedAt: params.evaluatedAt,
  };
}

/* ── Policy-Type State Checkers ──────────────── */

/**
 * State-based evaluation for profit protection policies.
 *
 * Checks whether recent won predictions have profits still sitting
 * in available capital, making them eligible for protection.
 */
function evaluateProfitProtection(
  policy: ProtectionPolicy,
  input: RuntimeEvaluationInput,
  now: number,
): PolicyRuntimeSuggestion | null {
  const protectPct = policy.action.protectPercentage ?? 30;
  const recentWins = input.recentActivity.predictionsWon;
  const winsWithProfit = input.recentWins.filter((w) => w.profit > 0);

  // Need recent wins and available capital to protect
  if (recentWins === 0 || winsWithProfit.length === 0 || input.capital.available <= 0) {
    return null;
  }

  // Calculate total eligible profit (capped at available capital)
  const totalProfit = winsWithProfit.reduce((s, w) => s + w.profit, 0);
  const protectAmount = Math.min(
    input.capital.available,
    Math.round((totalProfit * protectPct) / 100 * 100) / 100,
  );

  if (protectAmount < 0.01) return null;

  return buildSuggestion({
    policyId: policy.id,
    policyTitle: policy.title,
    policyType: policy.type,
    reason: `${protectPct}% of recent prediction profits ($${protectAmount.toFixed(2)}) is available to protect based on your "${policy.title}" policy.`,
    suggestedAction: "protection-prompt",
    amount: protectAmount,
    confidence: winsWithProfit.length > 1 ? "high" : "medium",
    priority: 1,
    evaluatedAt: now,
  });
}

/**
 * State-based evaluation for prediction profit protection.
 *
 * Similar to profit protection but explicitly framed as
 * moving profit into a timed protection horizon.
 */
function evaluatePredictionProfitProtection(
  policy: ProtectionPolicy,
  input: RuntimeEvaluationInput,
  now: number,
): PolicyRuntimeSuggestion | null {
  const protectPct = policy.action.protectPercentage ?? 50;
  const winsWithProfit = input.recentWins.filter((w) => w.profit > 0);

  if (winsWithProfit.length === 0 || input.capital.available <= 0) {
    return null;
  }

  const totalProfit = winsWithProfit.reduce((s, w) => s + w.profit, 0);
  const protectAmount = Math.min(
    input.capital.available,
    Math.round((totalProfit * protectPct) / 100 * 100) / 100,
  );

  if (protectAmount < 0.01) return null;

  return buildSuggestion({
    policyId: policy.id,
    policyTitle: policy.title,
    policyType: policy.type,
    reason: `"${policy.title}" — move ${protectPct}% of prediction profit ($${protectAmount.toFixed(2)}) into a timed protection horizon.`,
    suggestedAction: "protection-prompt",
    amount: protectAmount,
    confidence: "high",
    priority: 2,
    evaluatedAt: now,
  });
}

/**
 * State-based evaluation for release reflection.
 *
 * Checks if capital is currently releasing or if completed
 * horizons exist, suggesting a reflection pause.
 */
function evaluateReleaseReflection(
  policy: ProtectionPolicy,
  input: RuntimeEvaluationInput,
  now: number,
): PolicyRuntimeSuggestion | null {
  const totalReleased = input.recentActivity.totalReleased;

  if (totalReleased === 0 && input.capital.releasing === 0) {
    return null;
  }

  if (totalReleased > 2) {
    return buildSuggestion({
      policyId: policy.id,
      policyTitle: policy.title,
      policyType: policy.type,
      reason: `You've released capital ${totalReleased} times recently. "${policy.title}" suggests a reflective pause before further releases.`,
      suggestedAction: "reflection-prompt",
      confidence: "high",
      priority: 3,
      evaluatedAt: now,
    });
  }

  if (input.capital.releasing > 0) {
    return buildSuggestion({
      policyId: policy.id,
      policyTitle: policy.title,
      policyType: policy.type,
      reason: `$${input.capital.releasing.toFixed(2)} is in release. "${policy.title}" offers a reflection step before capital becomes available.`,
      suggestedAction: "reflection-prompt",
      confidence: "medium",
      priority: 4,
      evaluatedAt: now,
    });
  }

  return null;
}

/**
 * NOTE: Event-activated policies (delayed-withdrawal, large-transfer-cooling)
 * are NOT evaluated by the state-based runtime. They trigger in response to
 * specific events (withdrawal request, deposit) and are handled by the
 * event-driven evaluator in policy-evaluator.ts.
 *
 * Only state-evaluable policy types are included in the dispatch below.
 */

/* ── Dispatch ────────────────────────────────── */

const STATE_EVALUATORS: Partial<
  Record<
    ProtectionPolicy["type"],
    (policy: ProtectionPolicy, input: RuntimeEvaluationInput, now: number) => PolicyRuntimeSuggestion | null
  >
> = {
  "protect-profit-percentage": evaluateProfitProtection,
  "prediction-profit-protection": evaluatePredictionProfitProtection,
  "release-reflection-required": evaluateReleaseReflection,
};

/* ── Main Entry Point ────────────────────────── */

/**
 * Evaluate all active policies against current capital state.
 *
 * @param policies - Active user-defined policies to evaluate.
 * @param input - Current capital state and recent activity.
 * @param skipCooldown - If true, ignore cooldown periods (for manual refresh).
 * @returns Structured suggestions sorted by priority (highest first).
 */
export function evaluatePoliciesForState(
  policies: ProtectionPolicy[],
  input: RuntimeEvaluationInput,
  skipCooldown = false,
): PolicyRuntimeSuggestion[] {
  const now = Date.now();
  const suggestions: PolicyRuntimeSuggestion[] = [];

  for (const policy of policies) {
    // Only evaluate active policies
    if (policy.status !== "active") continue;

    // Cooldown check (skip if forced refresh)
    if (!skipCooldown && isInCooldown(policy.id, now)) continue;

    // Skip if policy type has no state evaluator
    const evaluator = STATE_EVALUATORS[policy.type];
    if (!evaluator) continue;

    // Run the state-based evaluation
    const suggestion = evaluator(policy, input, now);
    if (suggestion) {
      suggestions.push(suggestion);
    }

    // Mark as evaluated (even if no suggestion — maintains cooldown)
    markEvaluated(policy.id, now);
  }

  // Sort by priority (ascending — lower number = higher priority)
  suggestions.sort((a, b) => a.priority - b.priority);

  return suggestions;
}

/**
 * Reset all cooldown trackers (for testing or manual reset).
 */
export function resetCooldowns(): void {
  lastEvaluatedAt.clear();
}

/**
 * Get the number of policies currently in cooldown.
 */
export function getCooldownCount(now: number = Date.now()): number {
  let count = 0;
  for (const [, last] of lastEvaluatedAt) {
    if (now - last < STATE_COOLDOWN_MS) count++;
  }
  return count;
}
