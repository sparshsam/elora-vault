/**
 * Policy Timeline
 *
 * A quiet chronology of behavioral interventions — not an activity
 * feed, not a notification center. The timeline records when
 * policies evaluated, what they suggested, and what happened next.
 *
 * Design principles:
 *   - No badges, counts, or unread indicators
 *   - Chronological, not priority-sorted
 *   - Calm language, no urgency
 *   - Entries are purely informational — no actions required
 */

import type { TimelineEntry, TimelineEntryType, PolicySuggestion } from "@/types/policy-orchestration";

/* ── Timeline Store (In-Memory) ────────────────── */

/**
 * In-memory timeline store for the current session.
 * Future: persist to database for historical reference.
 */
const timelineStore: TimelineEntry[] = [];
const MAX_ENTRIES = 200;

/* ── Entry Builder ─────────────────────────────── */

let entryCounter = 0;

function nextId(): string {
  entryCounter++;
  return `tl-${Date.now()}-${entryCounter}`;
}

/**
 * Create a new timeline entry.
 */
export function createEntry(params: {
  type: TimelineEntryType;
  policyId?: string;
  policyTitle?: string;
  title: string;
  description: string;
  suggestion?: PolicySuggestion;
  acted?: boolean;
}): TimelineEntry {
  return {
    id: nextId(),
    type: params.type,
    policyId: params.policyId,
    policyTitle: params.policyTitle,
    title: params.title,
    description: params.description,
    suggestion: params.suggestion,
    acted: params.acted,
    timestamp: Date.now(),
  };
}

/* ── Recording ─────────────────────────────────── */

/**
 * Record an entry in the policy timeline.
 */
export function recordEntry(entry: TimelineEntry): void {
  timelineStore.unshift(entry);

  // Keep the store bounded
  if (timelineStore.length > MAX_ENTRIES) {
    timelineStore.pop();
  }
}

/**
 * Record a policy evaluation entry.
 */
export function recordPolicyEvaluation(
  policyId: string,
  policyTitle: string,
  triggered: boolean,
  reason: string,
): TimelineEntry {
  const entry = createEntry({
    type: "policy-evaluated",
    policyId,
    policyTitle,
    title: triggered ? "Policy condition met" : "Policy evaluated",
    description: reason,
  });
  recordEntry(entry);
  return entry;
}

/**
 * Record a suggestion being offered.
 */
export function recordSuggestionOffered(
  suggestion: PolicySuggestion,
  policyId?: string,
  policyTitle?: string,
): TimelineEntry {
  const entry = createEntry({
    type: "suggestion-offered",
    policyId,
    policyTitle,
    title: suggestion.title,
    description: suggestion.description,
    suggestion,
  });
  recordEntry(entry);
  return entry;
}

/**
 * Record a suggestion being acknowledged (user acted on it or dismissed it).
 */
export function recordSuggestionAcknowledged(
  suggestion: PolicySuggestion,
  acted: boolean,
): TimelineEntry {
  const entry = createEntry({
    type: acted ? "suggestion-acknowledged" : "suggestion-dismissed",
    title: suggestion.title,
    description: acted
      ? "Suggestion acknowledged and acted upon."
      : "Suggestion reviewed but not acted upon.",
    suggestion,
    acted,
  });
  recordEntry(entry);
  return entry;
}

/**
 * Record a reflection period.
 */
export function recordReflection(
  state: "started" | "completed" | "dismissed",
  subject: string,
): TimelineEntry {
  const typeMap: Record<string, TimelineEntryType> = {
    started: "reflection-started",
    completed: "reflection-completed",
    dismissed: "reflection-dismissed",
  };

  const descriptions: Record<string, string> = {
    started: `Reflection began: ${subject}.`,
    completed: "Reflection completed. Action proceeded.",
    dismissed: "Reflection dismissed. Action was reconsidered.",
  };

  const entry = createEntry({
    type: typeMap[state],
    title: state === "started" ? "Reflection started" : state === "completed" ? "Reflection completed" : "Reflection dismissed",
    description: descriptions[state],
  });
  recordEntry(entry);
  return entry;
}

/**
 * Record a cooldown being activated.
 */
export function recordCooldown(
  policyId: string,
  policyTitle: string,
  durationHours: number,
): TimelineEntry {
  const entry = createEntry({
    type: "cooldown-activated",
    policyId,
    policyTitle,
    title: "Policy in cooldown",
    description: `"${policyTitle}" will rest for ${durationHours} hours before its next evaluation.`,
  });
  recordEntry(entry);
  return entry;
}

/**
 * Record a scheduled trigger.
 */
export function recordScheduleTrigger(
  policyId: string,
  policyTitle: string,
): TimelineEntry {
  const entry = createEntry({
    type: "schedule-triggered",
    policyId,
    policyTitle,
    title: "Schedule window opened",
    description: `"${policyTitle}" has entered its scheduled evaluation window.`,
  });
  recordEntry(entry);
  return entry;
}

/* ── Querying ──────────────────────────────────── */

/**
 * Get all timeline entries, most recent first.
 */
export function getTimeline(limit?: number): TimelineEntry[] {
  if (limit) return timelineStore.slice(0, limit);
  return [...timelineStore];
}

/**
 * Get timeline entries for a specific policy.
 */
export function getPolicyTimeline(policyId: string): TimelineEntry[] {
  return timelineStore.filter((e) => e.policyId === policyId);
}

/**
 * Get timeline entries of a specific type.
 */
export function getEntriesByType(type: TimelineEntryType): TimelineEntry[] {
  return timelineStore.filter((e) => e.type === type);
}

/**
 * Get recent suggestions that haven't been acknowledged yet.
 */
export function getPendingSuggestions(): TimelineEntry[] {
  return timelineStore.filter(
    (e) => e.type === "suggestion-offered" && e.acted === undefined,
  );
}

/**
 * Clear the timeline (for testing or session reset).
 */
export function clearTimeline(): void {
  timelineStore.length = 0;
}
