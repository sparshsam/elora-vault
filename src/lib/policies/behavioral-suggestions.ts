/**
 * Behavioral Suggestion System
 *
 * Adaptive, contextual suggestions that help users align their
 * capital behavior with their stated policies. Suggestions are
 * NEVER commands — they are quiet observations and optional prompts.
 *
 * Suggestions emerge from patterns:
 *   - A user who won and has a profit-protection policy
 *   - A user who released capital multiple times in a week
 *   - A user with consecutive losses
 *   - A user making a large deposit without setting a horizon
 *
 * The system learns what's relevant from policy configuration,
 * not from predictive models or user tracking.
 */

import type { ProtectionPolicy } from "@/types/policy";
import type { PolicySuggestion, EvaluationContext } from "@/types/policy-orchestration";
import type { CapitalEvent } from "./events";

/* ── Suggestion Sources ────────────────────────── */

/**
 * Generate suggestions from active policies matching the current event.
 * This is the primary suggestion path — policies define what matters.
 */
export function suggestionsFromPolicies(
  policies: ProtectionPolicy[],
  event: CapitalEvent,
  context: EvaluationContext,
): PolicySuggestion[] {
  const suggestions: PolicySuggestion[] = [];

  for (const policy of policies) {
    if (policy.status !== "active") continue;

    const suggestion = evaluatePolicyForSuggestion(policy, event, context);
    if (suggestion) suggestions.push(suggestion);
  }

  return suggestions;
}

function evaluatePolicyForSuggestion(
  policy: ProtectionPolicy,
  event: CapitalEvent,
  context: EvaluationContext,
): PolicySuggestion | undefined {
  switch (policy.type) {
    case "protect-profit-percentage":
      return suggestProfitProtection(policy, event);
    case "delayed-withdrawal":
      return suggestDelayAwareness(policy, event);
    case "large-transfer-cooling":
      return suggestCoolingAwareness(policy, event);
    case "release-reflection-required":
      return suggestReleaseAwareness(policy, event, context);
    case "prediction-profit-protection":
      return suggestPredictionProtection(policy, event);
    default:
      return undefined;
  }
}

function suggestProfitProtection(
  policy: ProtectionPolicy,
  event: CapitalEvent,
): PolicySuggestion | undefined {
  if (event.type !== "prediction.settled" || event.outcome !== "won") return undefined;

  const pct = policy.action.protectPercentage ?? 30;
  const amount = (event.profit * pct) / 100;

  return {
    type: "protection-prompt",
    title: policy.title,
    description: `This prediction returned $${event.profit.toFixed(2)} in profit. Your policy suggests protecting ${pct}% ($${amount.toFixed(2)}).`,
    context: "Profit protection keeps gains separated from available capital.",
    action: {
      label: "Protect profit",
      description: `Set aside $${amount.toFixed(2)} into a horizon.`,
      href: "/sessions",
    },
  };
}

function suggestDelayAwareness(
  _policy: ProtectionPolicy,
  event: CapitalEvent,
): PolicySuggestion | undefined {
  if (event.type !== "capital.withdrawn") return undefined;

  return {
    type: "cooling-notice",
    title: "Delayed withdrawal in effect",
    description: `Withdrawal of $${event.amount.toFixed(2)} detected. Your policy allows for a cooling period.`,
    context: "Delays create space between intention and action.",
    action: {
      label: "View policy",
      description: "See your delay preference.",
      href: "/policies",
    },
  };
}

function suggestCoolingAwareness(
  policy: ProtectionPolicy,
  event: CapitalEvent,
): PolicySuggestion | undefined {
  if (event.type !== "capital.deposited") return undefined;
  const threshold = policy.condition.minAmount ?? 1000;
  if (event.amount < threshold) return undefined;

  const delayHours = policy.action.delayHours ?? 24;

  return {
    type: "cooling-notice",
    title: policy.title,
    description: `Large deposit of $${event.amount.toFixed(2)} detected. Your policy applies a ${delayHours}-hour cooling period before full availability.`,
    context: "Cooling periods help prevent impulsive use of newly arrived capital.",
    action: {
      label: "View policy",
      description: "See your cooling settings.",
      href: "/policies",
    },
  };
}

function suggestReleaseAwareness(
  _policy: ProtectionPolicy,
  event: CapitalEvent,
  context: EvaluationContext,
): PolicySuggestion | undefined {
  if (event.type !== "capital.released") return undefined;
  if (context.recentActivity.totalReleased <= 1) return undefined;

  return {
    type: "hesitation-check",
    title: "Multiple releases this week",
    description: `You've released capital ${context.recentActivity.totalReleased} times recently. Each release reduces protected capital.`,
    context: "Frequent releases may work against your protection goals.",
    action: {
      label: "Review intent",
      description: "Check what's being released.",
      href: "/intent",
    },
  };
}

function suggestPredictionProtection(
  policy: ProtectionPolicy,
  event: CapitalEvent,
): PolicySuggestion | undefined {
  if (event.type !== "prediction.settled" || event.outcome !== "won") return undefined;

  const pct = policy.action.protectPercentage ?? 50;
  const amount = (event.profit * pct) / 100;

  return {
    type: "protection-prompt",
    title: policy.title,
    description: `Your policy recommends protecting ${pct}% of won prediction profit ($${amount.toFixed(2)}) into a timed horizon.`,
    context: "Timed horizons keep capital separated until you choose to release it.",
    action: {
      label: "Protect in horizon",
      description: `Move $${amount.toFixed(2)} into a ${policy.action.delayHours ?? 30}-day horizon.`,
      href: "/sessions",
    },
  };
}

/* ── Contextual Suggestions (No Policy Required) ─ */

/**
 * Generate contextual suggestions based on capital patterns,
 * even without an explicit matching policy.
 * These are softer and quieter than policy-driven suggestions.
 */
export function contextualSuggestions(
  event: CapitalEvent,
  context: EvaluationContext,
): PolicySuggestion[] {
  const suggestions: PolicySuggestion[] = [];

  // After consecutive losses, suggest a pause
  if (event.type === "prediction.settled" && event.outcome === "lost") {
    const lossCount = event.consecutiveLosses ?? 1;
    if (lossCount >= 3) {
      suggestions.push({
        type: "pause-suggestion",
        title: "A pattern of losses",
        description: `${lossCount} consecutive predictions settled as losses. Consider reviewing your approach before committing more capital.`,
        context: "Taking a pause after consecutive losses is a calm financial habit.",
        action: {
          label: "Review predictions",
          description: "See your recent settled predictions.",
          href: "/sessions",
        },
      });
    } else if (lossCount === 2) {
      suggestions.push({
        type: "behavioral-observation",
        title: "Two consecutive losses",
        description: "A second consecutive loss. Not a pattern yet — but worth noting.",
        context: "Elora simply observes. How you respond is yours.",
      });
    }
  }

  // After a win, suggest protection (only if no policy exists for it)
  if (event.type === "prediction.settled" && event.outcome === "won") {
    const hasProtectionPolicy = context.activePolicyCount > 0;
    if (!hasProtectionPolicy && event.profit > 0) {
      suggestions.push({
        type: "protection-prompt",
        title: "Return available",
        description: `This prediction returned $${event.profit.toFixed(2)}. Consider protecting a portion.`,
        context: "A policy can automate this suggestion based on your preferences.",
        action: {
          label: "Protect return",
          description: "Move part of this return into a horizon.",
          href: "/sessions",
        },
      });
    }
  }

  // After a large deposit, suggest setting a horizon
  if (event.type === "capital.deposited" && event.amount >= 500) {
    const hasActiveHorizons = context.capital.protected > 0;
    if (!hasActiveHorizons) {
      suggestions.push({
        type: "behavioral-observation",
        title: "Capital ready",
        description: `$${event.amount.toFixed(2)} deposited. Setting a protection horizon helps keep it separated.`,
        context: "Protection horizons are the foundation of Elora's behavioral model.",
        action: {
          label: "Protect capital",
          description: "Set your first protection horizon.",
          href: "/vault",
        },
      });
    }
  }

  // After frequent releases
  if (event.type === "capital.released" && context.recentActivity.totalReleased >= 3) {
    const alreadySuggested = suggestions.some((s) => s.type === "hesitation-check");
    if (!alreadySuggested) {
      suggestions.push({
        type: "hesitation-check",
        title: "Capital releasing frequently",
        description: `You've released capital ${context.recentActivity.totalReleased} times this week. Consider whether these releases align with your intentions.`,
        context: "Releasing is always available. The question is whether it serves you.",
        action: {
          label: "Review intent",
          description: "See what's releasing and when.",
          href: "/intent",
        },
      });
    }
  }

  return suggestions;
}

/* ── Combined Suggestion Engine ────────────────── */

/**
 * Generate all suggestions for an event — both policy-driven and contextual.
 * Deduplicates by suggestion type and title.
 */
export function generateSuggestions(
  policies: ProtectionPolicy[],
  event: CapitalEvent,
  context: EvaluationContext,
): PolicySuggestion[] {
  const policySuggestions = suggestionsFromPolicies(policies, event, context);
  const contextual = contextualSuggestions(event, context);

  // Deduplicate — same type + same intent should not appear twice
  const seen = new Set<string>();
  const all = [...policySuggestions, ...contextual];

  return all.filter((s) => {
    const key = `${s.type}:${s.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
