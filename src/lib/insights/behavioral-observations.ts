/**
 * Behavioral observation engine.
 *
 * Generates soft, non-judgmental observations about capital patterns.
 * No scores. No gamification. No productivity metrics.
 *
 * Tone: observational, quiet, present.
 */

export type ObservationCategory =
  | "protection-behavior"
  | "release-timing"
  | "commitment-patterns"
  | "capital-separation";

export interface BehavioralObservation {
  id: string;
  category: ObservationCategory;
  text: string;
  detail?: string;
}

/* ── Input types ──────────────────────────── */

export interface HorizonData {
  amount: number;
  durationDays: number;
  progress: number;
  canRelease: boolean;
}

export interface ObservationInput {
  protectedAmount: number;
  availableAmount: number;
  committedAmount: number;
  releasingAmount: number;
  totalCapital: number;
  activeHorizons: HorizonData[];
  totalDeposited: number;
  totalSavedFromLosses: number;
  totalProfitWon: number;
  hasTransactions: boolean;
  hasAnyActivity: boolean;
}

/* ── Generators ───────────────────────────── */

function protectionBehavior(input: ObservationInput): BehavioralObservation[] {
  const result: BehavioralObservation[] = [];

  // Average horizon duration
  const durations = input.activeHorizons.map((h) => h.durationDays).filter(Boolean);
  if (durations.length > 0) {
    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    if (avg > 0) {
      result.push({
        id: "protection-horizon-duration",
        category: "protection-behavior",
        text:
          durations.length === 1
            ? `Current protection horizon is set for ${avg} days.`
            : `Protection horizons tend toward ${avg} days on average.`,
        detail: `Based on ${durations.length} active horizon${durations.length === 1 ? "" : "s"}.`,
      });
    }
  }

  // Total protected
  if (input.protectedAmount > 0) {
    const pct = Math.round((input.protectedAmount / Math.max(input.totalCapital, 1)) * 100);
    if (pct > 0) {
      result.push({
        id: "protection-percentage",
        category: "protection-behavior",
        text: `${pct}% of capital is currently held in protection.`,
        detail: `$${input.protectedAmount.toFixed(2)} protected across ${input.activeHorizons.length} horizon${input.activeHorizons.length === 1 ? "" : "s"}.`,
      });
    }
  }

  // Pending releases
  const pendingReleases = input.activeHorizons.filter((h) => h.canRelease).length;
  if (pendingReleases > 0) {
    result.push({
      id: "pending-releases",
      category: "protection-behavior",
      text:
        pendingReleases === 1
          ? "A protection horizon has completed. Capital is ready for release."
          : `${pendingReleases} protection horizons have completed and are ready for release.`,
      detail: "Completed horizons do not release automatically.",
    });
  }

  return result;
}

function releaseTiming(input: ObservationInput): BehavioralObservation[] {
  const result: BehavioralObservation[] = [];

  // Look at overall release readiness
  const completed = input.activeHorizons.filter((h) => h.canRelease);
  const active = input.activeHorizons.filter((h) => !h.canRelease);

  if (active.length > 0 && completed.length === 0) {
    result.push({
      id: "release-no-pending",
      category: "release-timing",
      text: "All active protection horizons are still in progress. No releases pending.",
      detail: `${active.length} horizon${active.length === 1 ? "" : "s"} currently active.`,
    });
  }

  if (completed.length > 0) {
    result.push({
      id: "release-ready",
      category: "release-timing",
      text:
        completed.length === 1
          ? "Completed protection horizons are awaiting your decision to release."
          : `${completed.length} completed protection horizons are awaiting your attention.`,
      detail: "Releases happen on your timeline, not automatically.",
    });
  }

  // If they have releasing capital, note it
  if (input.releasingAmount > 0 && input.activeHorizons.filter((h) => !h.canRelease).length > 0) {
    result.push({
      id: "release-in-progress",
      category: "release-timing",
      text: "Some capital is currently transitioning from protection back to availability.",
    });
  }

  return result;
}

function commitmentPatterns(input: ObservationInput): BehavioralObservation[] {
  const result: BehavioralObservation[] = [];

  if (input.committedAmount > 0 && input.protectedAmount > 0) {
    const ratio = Math.round((input.committedAmount / input.protectedAmount) * 100);
    result.push({
      id: "commit-protect-ratio",
      category: "commitment-patterns",
      text: `Committed capital represents ${ratio}% of the amount currently protected.`,
      detail: "Protection and commitment serve different purposes in your capital structure.",
    });
  }

  if (input.committedAmount > 0 && input.totalCapital > 0) {
    const pct = Math.round((input.committedAmount / input.totalCapital) * 100);
    if (pct > 0 && pct < 100) {
      result.push({
        id: "commitment-proportion",
        category: "commitment-patterns",
        text: `${pct}% of total capital is allocated to active commitments.`,
      });
    }
  }

  if (input.committedAmount > 0 && input.availableAmount > 0) {
    result.push({
      id: "available-vs-committed",
      category: "commitment-patterns",
      text: input.committedAmount > input.availableAmount
        ? "More capital is committed than is immediately available."
        : "Available capital exceeds what is currently committed.",
      detail: "A balance that shifts naturally with activity.",
    });
  }

  return result;
}

function capitalSeparation(input: ObservationInput): BehavioralObservation[] {
  const result: BehavioralObservation[] = [];

  // Count how many states have capital
  const activeStates: string[] = [];
  if (input.availableAmount > 0) activeStates.push("available");
  if (input.protectedAmount > 0) activeStates.push("protected");
  if (input.releasingAmount > 0) activeStates.push("releasing");
  if (input.committedAmount > 0) activeStates.push("committed");

  if (activeStates.length >= 3) {
    result.push({
      id: "separation-multiple",
      category: "capital-separation",
      text: `Capital is distributed across ${activeStates.length} states — ${activeStates.join(", ")}.`,
      detail: "Each state serves a different role in how capital moves and rests.",
    });
  } else if (activeStates.length === 2) {
    result.push({
      id: "separation-two",
      category: "capital-separation",
      text: `Capital currently occupies two states: ${activeStates.join(" and ")}.`,
    });
  }

  // Observe total deposited if there's history
  if (input.totalDeposited > 0) {
    const protectedPct = input.protectedAmount > 0
      ? Math.round((input.protectedAmount / input.totalDeposited) * 100)
      : 0;
    if (protectedPct > 0) {
      result.push({
        id: "deposited-protected",
        category: "capital-separation",
        text: `Of total deposits, ${protectedPct}% is currently in protection.`,
      });
    }
  }

  // Capital availability observation
  if (input.availableAmount > 0 && input.protectedAmount > input.availableAmount) {
    result.push({
      id: "protected-exceeds-available",
      category: "capital-separation",
      text: "Protected capital exceeds what's immediately available — a sign of intentional capital allocation.",
    });
  }

  return result;
}

/* ── Main entry point ─────────────────────── */

export function generateObservations(input: ObservationInput): BehavioralObservation[] {
  if (!input.hasAnyActivity) {
    return [
      {
        id: "no-activity",
        category: "protection-behavior",
        text: "No capital activity yet. Observations will appear as patterns emerge.",
      },
    ];
  }

  const observations: BehavioralObservation[] = [
    ...protectionBehavior(input),
    ...releaseTiming(input),
    ...commitmentPatterns(input),
    ...capitalSeparation(input),
  ];

  return observations;
}
