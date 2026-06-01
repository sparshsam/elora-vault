/**
 * Policy Evaluator
 *
 * The core evaluation engine. Receives capital events, evaluates
 * all active policies against the event context, checks cooldowns
 * and schedules, and produces suggestions.
 *
 * This is a synchronous, deterministic engine.
 * It does NOT execute actions — it evaluates conditions.
 */

import type { ProtectionPolicy } from "@/types/policy";
import type {
  EvaluationResult,
  EvaluationContext,
  EventEvaluationResult,
  PolicySuggestion,
  ReflectionState,
  EvaluationPhase,
} from "@/types/policy-orchestration";
import type { CapitalEvent } from "./events";
import { canEvaluate, checkSchedule, defaultSchedule } from "./policy-state-machine";

/* ── Policy-Type Condition Checkers ────────────── */

/**
 * Check if a policy's conditions are met given the current event and context.
 * Each policy type has its own condition logic.
 */
function checkPolicyConditions(
  policy: ProtectionPolicy,
  event: CapitalEvent,
  context: EvaluationContext,
): { triggered: boolean; reason: string } {
  switch (policy.type) {
    case "protect-profit-percentage":
      return checkProfitProtection(policy, event);
    case "delayed-withdrawal":
      return checkDelayedWithdrawal(policy, event);
    case "large-transfer-cooling":
      return checkLargeTransferCooling(policy, event);
    case "release-reflection-required":
      return checkReleaseReflection(policy, event, context);
    case "prediction-profit-protection":
      return checkPredictionProfitProtection(policy, event);
    default:
      return { triggered: false, reason: "Unknown policy type." };
  }
}

function checkProfitProtection(
  policy: ProtectionPolicy,
  event: CapitalEvent,

): { triggered: boolean; reason: string } {
  if (event.type !== "prediction.settled") {
    return { triggered: false, reason: "Awaiting prediction settlement." };
  }
  if (event.outcome !== "won") {
    return { triggered: false, reason: "Prediction was not won." };
  }
  const pct = policy.action.protectPercentage ?? 30;
  const protectAmount = (event.profit * pct) / 100;
  return {
    triggered: true,
    reason: `Protect ${pct}% ($${protectAmount.toFixed(2)}) of ${event.outcome} prediction return.`,
  };
}

function checkDelayedWithdrawal(
  _policy: ProtectionPolicy,
  event: CapitalEvent,

): { triggered: boolean; reason: string } {
  if (event.type !== "capital.withdrawn") {
    return { triggered: false, reason: "Awaiting withdrawal event." };
  }
  return {
    triggered: true,
    reason: `Withdrawal of $${event.amount.toFixed(2)} detected. Policy suggests a cooling period.`,
  };
}

function checkLargeTransferCooling(
  policy: ProtectionPolicy,
  event: CapitalEvent,

): { triggered: boolean; reason: string } {
  if (event.type !== "capital.deposited") {
    return { triggered: false, reason: "Awaiting deposit event." };
  }
  const threshold = policy.condition.minAmount ?? 1000;
  if (event.amount < threshold) {
    return { triggered: false, reason: `Deposit ($${event.amount.toFixed(2)}) below threshold ($${threshold}).` };
  }
  const delayHours = policy.action.delayHours ?? 24;
  return {
    triggered: true,
    reason: `Large deposit ($${event.amount.toFixed(2)}) detected. ${delayHours}h cooling period suggested.`,
  };
}

function checkReleaseReflection(
  _policy: ProtectionPolicy,
  event: CapitalEvent,
  context: EvaluationContext,
): { triggered: boolean; reason: string } {
  if (event.type !== "capital.released") {
    return { triggered: false, reason: "Awaiting release event." };
  }
  // Check if user has released frequently
  if (context.recentActivity.totalReleased > 2) {
    return {
      triggered: true,
      reason: `Multiple releases (${context.recentActivity.totalReleased}) this week. Take a moment to confirm.`,
    };
  }
  return {
    triggered: true,
    reason: `Release of $${event.amount.toFixed(2)} detected. A brief reflection is available.`,
  };
}

function checkPredictionProfitProtection(
  policy: ProtectionPolicy,
  event: CapitalEvent,

): { triggered: boolean; reason: string } {
  if (event.type !== "prediction.settled") {
    return { triggered: false, reason: "Awaiting prediction settlement." };
  }
  if (event.outcome !== "won") {
    return { triggered: false, reason: "Prediction was not won." };
  }
  const pct = policy.action.protectPercentage ?? 50;
  const protectAmount = (event.profit * pct) / 100;
  return {
    triggered: true,
    reason: `Protect ${pct}% of profit ($${protectAmount.toFixed(2)}) into a timed horizon.`,
  };
}

/* ── Suggestion Builder ────────────────────────── */

function buildSuggestion(
  policy: ProtectionPolicy,
  result: { triggered: boolean; reason: string },
  event: CapitalEvent,
): PolicySuggestion | undefined {
  if (!result.triggered) return undefined;

  const base: Omit<PolicySuggestion, "type"> = {
    title: policy.title,
    description: result.reason,
    context: `${event.type} — ${policy.type}`,
  };

  switch (policy.type) {
    case "protect-profit-percentage":
    case "prediction-profit-protection":
      return { ...base, type: "protection-prompt", action: { label: "Review protection", description: "Set aside capital as planned.", href: "/sessions" } };
    case "delayed-withdrawal":
      return { ...base, type: "cooling-notice", action: { label: "View policy", description: "See your withdrawal delay preference.", href: "/policies" } };
    case "large-transfer-cooling":
      return { ...base, type: "cooling-notice", action: { label: "View policy", description: "See your cooling period settings.", href: "/policies" } };
    case "release-reflection-required":
      return { ...base, type: "reflection-prompt", action: { label: "Reflect", description: "Take a moment before releasing.", href: "/intent" } };
    default:
      return { ...base, type: "behavioral-observation" };
  }
}

/* ── Phase Assignment ──────────────────────────── */

function determinePhase(
  policy: ProtectionPolicy,
  triggered: boolean,
  context: EvaluationContext,
): EvaluationPhase {
  if (!triggered) return "idle";
  if (policy.type === "release-reflection-required") return "reflecting";
  if (context.recentActivity.consecutiveLosses > 2) return "reflecting";
  return "suggesting";
}

/* ── Main Evaluation ───────────────────────────── */

/**
 * Evaluate all active policies against a capital event.
 * Returns the complete evaluation result with suggestions and reflections.
 */
export function evaluatePolicies(
  policies: ProtectionPolicy[],
  event: CapitalEvent,
  context: EvaluationContext,
): EventEvaluationResult {
  const evaluations: EvaluationResult[] = [];
  const suggestions: PolicySuggestion[] = [];
  const reflections: ReflectionState[] = [];
  const cooldowns: { policyId: string; until: number }[] = [];

  const now = Date.now();

  for (const policy of policies) {
    // 1. Check if policy is in a state that allows evaluation
    if (!canEvaluate("active")) continue; // Only active policies evaluate
    if (policy.status !== "active") continue;

    // 2. Check schedule and cooldown
    const schedule = defaultSchedule(); // Default until policies carry schedule data
    const scheduleStatus = checkSchedule(schedule, undefined, now);
    if (!scheduleStatus.isActive) {
      evaluations.push({
        policyId: policy.id,
        policyType: policy.type,
        policyTitle: policy.title,
        phase: "idle",
        triggered: false,
        reason: scheduleStatus.reason ?? "Schedule not active.",
        evaluatedAt: now,
      });
      continue;
    }

    // 3. Evaluate conditions
    const conditionResult = checkPolicyConditions(policy, event, context);

    // 4. Assign phase
    const phase = determinePhase(policy, conditionResult.triggered, context);

    // 5. Build suggestion
    const suggestion = buildSuggestion(policy, conditionResult, event);

    // 6. Create reflection if needed
    if (phase === "reflecting" && conditionResult.triggered) {
      reflections.push({
        startedAt: now,
        endsAt: now + 60000, // 60 second reflection
        subject: conditionResult.reason,
        confirmed: false,
        dismissed: false,
        reminderCount: 0,
      });
    }

    // 7. Add suggestion
    if (suggestion) {
      suggestions.push(suggestion);
    }

    // 8. Enter cooldown after evaluation
    if (conditionResult.triggered) {
      const cooldownMs = schedule.cooldownHours * 60 * 60 * 1000;
      cooldowns.push({ policyId: policy.id, until: now + cooldownMs });
    }

    evaluations.push({
      policyId: policy.id,
      policyType: policy.type,
      policyTitle: policy.title,
      phase,
      triggered: conditionResult.triggered,
      reason: conditionResult.reason,
      suggestion,
      evaluatedAt: now,
      expiresAt: conditionResult.triggered ? now + 3600000 : undefined, // 1 hour expiry
    });
  }

  return {
    eventType: event.type,
    evaluatedAt: now,
    evaluations,
    suggestions,
    reflections,
    cooldowns,
  };
}

/* ── Single Policy Evaluation ──────────────────── */

/**
 * Evaluate a single policy against a context.
 * Useful for targeted checks (e.g., before a withdrawal).
 */
export function evaluateSinglePolicy(
  policy: ProtectionPolicy,
  event: CapitalEvent,
  context: EvaluationContext,
): EvaluationResult {
  if (policy.status !== "active") {
    return {
      policyId: policy.id,
      policyType: policy.type,
      policyTitle: policy.title,
      phase: "idle",
      triggered: false,
      reason: "Policy is not active.",
      evaluatedAt: Date.now(),
    };
  }

  const conditionResult = checkPolicyConditions(policy, event, context);
  const phase = determinePhase(policy, conditionResult.triggered, context);
  const suggestion = buildSuggestion(policy, conditionResult, event);

  return {
    policyId: policy.id,
    policyType: policy.type,
    policyTitle: policy.title,
    phase,
    triggered: conditionResult.triggered,
    reason: conditionResult.reason,
    suggestion,
    evaluatedAt: Date.now(),
    expiresAt: conditionResult.triggered ? Date.now() + 3600000 : undefined,
  };
}
