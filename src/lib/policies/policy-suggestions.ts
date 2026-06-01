export type PolicySuggestionAction =
  | "protect-capital"
  | "delay-withdrawal"
  | "reprotect-capital"
  | "extend-horizon";

export type PolicySuggestionStatus =
  | "generated"
  | "accepted"
  | "dismissed"
  | "snoozed"
  | "expired";

export interface PolicySuggestion {
  id: string;
  title: string;
  body: string;
  sourcePolicy: string;
  action: PolicySuggestionAction;
  amount?: number;
  durationDays?: number;
  releaseTiming?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  expiresAt: string;
}

export interface PolicyActivityEvent {
  id: string;
  suggestionId: string;
  status: PolicySuggestionStatus;
  title: string;
  sourcePolicy: string;
  action: PolicySuggestionAction;
  timestamp: string;
  expiresAt?: string;
}

export interface PolicySuggestionContext {
  available: number;
  protected: number;
  releasing: number;
  committed: number;
  recentGains: number;
  releasableAmount: number;
  activeHorizonCount: number;
  defaultDurationDays: number;
}

export const POLICY_ACTIVITY_STORAGE_KEY = "elora_policy_activity_v1";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function expiresIn(days: number, now: number): string {
  return new Date(now + days * ONE_DAY_MS).toISOString();
}

function hasTerminalActivity(
  suggestionId: string,
  activity: PolicyActivityEvent[],
  now: number,
): boolean {
  return activity.some((event) => {
    if (event.suggestionId !== suggestionId) return false;
    if (event.status === "accepted" || event.status === "dismissed" || event.status === "expired") return true;
    if (event.status !== "snoozed") return false;

    return now - new Date(event.timestamp).getTime() < ONE_DAY_MS;
  });
}

export function evaluatePolicySuggestions(
  context: PolicySuggestionContext,
  activity: PolicyActivityEvent[] = [],
  now = Date.now(),
): PolicySuggestion[] {
  const createdAt = new Date(now).toISOString();
  const defaultDurationDays = context.defaultDurationDays || 30;
  const suggestions: PolicySuggestion[] = [];

  if (context.recentGains >= 0.01 && context.available >= 0.01) {
    const amount = roundCurrency(Math.min(context.available, context.recentGains * 0.5));
    if (amount >= 0.01) {
      suggestions.push({
        id: `protect-recent-gains-${amount.toFixed(2)}-${defaultDurationDays}`,
        title: "Protect part of recent gains",
        body: `Move $${amount.toFixed(2)} of recent returns into a ${defaultDurationDays}-day protection horizon.`,
        sourcePolicy: "Post-gain protection",
        action: "protect-capital",
        amount,
        durationDays: defaultDurationDays,
        priority: "high",
        createdAt,
        expiresAt: expiresIn(2, now),
      });
    }
  }

  if (context.releasableAmount >= 0.01 && context.available >= 0.01) {
    const amount = roundCurrency(Math.min(context.available, context.releasableAmount));
    suggestions.push({
      id: `reprotect-released-capital-${amount.toFixed(2)}-${defaultDurationDays}`,
      title: "Re-protect released capital",
      body: `Prepare a new ${defaultDurationDays}-day horizon for $${amount.toFixed(2)} that is ready to stay separated.`,
      sourcePolicy: "Release continuity",
      action: "reprotect-capital",
      amount,
      durationDays: defaultDurationDays,
      priority: "medium",
      createdAt,
      expiresAt: expiresIn(2, now),
    });
  }

  if (context.available >= 100) {
    suggestions.push({
      id: "delay-large-withdrawal-overnight",
      title: "Delay any large withdrawal overnight",
      body: "Available capital is meaningfully elevated. Keep withdrawals unhurried before moving funds outside Elora.",
      sourcePolicy: "Withdrawal cooling period",
      action: "delay-withdrawal",
      releaseTiming: "Tomorrow morning",
      priority: "medium",
      createdAt,
      expiresAt: expiresIn(1, now),
    });
  }

  if (context.activeHorizonCount > 0 && context.protected >= 0.01) {
    suggestions.push({
      id: `review-active-horizons-${context.activeHorizonCount}`,
      title: "Review active protection horizons",
      body: "A protection period is already active. Consider whether the current horizon still matches your intent.",
      sourcePolicy: "Horizon review",
      action: "extend-horizon",
      durationDays: defaultDurationDays,
      priority: "low",
      createdAt,
      expiresAt: expiresIn(3, now),
    });
  }

  return suggestions.filter((suggestion) => !hasTerminalActivity(suggestion.id, activity, now));
}

export function readPolicyActivity(): PolicyActivityEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(POLICY_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const reconciled = reconcileExpiredPolicyActivity(parsed);
    if (reconciled.length !== parsed.length) writePolicyActivity(reconciled);
    return reconciled;
  } catch {
    return [];
  }
}

export function writePolicyActivity(activity: PolicyActivityEvent[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    POLICY_ACTIVITY_STORAGE_KEY,
    JSON.stringify(activity.slice(-100)),
  );
}

export function recordPolicyActivity(
  activity: PolicyActivityEvent[],
  suggestion: PolicySuggestion,
  status: PolicySuggestionStatus,
  now = Date.now(),
): PolicyActivityEvent[] {
  const event: PolicyActivityEvent = {
    id: `${suggestion.id}-${status}-${now}`,
    suggestionId: suggestion.id,
    status,
    title: suggestion.title,
    sourcePolicy: suggestion.sourcePolicy,
    action: suggestion.action,
    timestamp: new Date(now).toISOString(),
    expiresAt: suggestion.expiresAt,
  };
  const next = [...activity, event];
  writePolicyActivity(next);
  return next;
}

export function reconcileExpiredPolicyActivity(
  activity: PolicyActivityEvent[],
  now = Date.now(),
): PolicyActivityEvent[] {
  let next = activity;

  for (const event of activity) {
    if (event.status !== "generated" || !event.expiresAt) continue;
    if (new Date(event.expiresAt).getTime() > now) continue;

    const hasFinalState = activity.some((candidate) => (
      candidate.suggestionId === event.suggestionId &&
      ["accepted", "dismissed", "expired"].includes(candidate.status)
    ));
    if (hasFinalState) continue;

    next = [
      ...next,
      {
        ...event,
        id: `${event.suggestionId}-expired-${now}`,
        status: "expired",
        timestamp: new Date(now).toISOString(),
      },
    ];
  }

  return next;
}
