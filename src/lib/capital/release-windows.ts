/**
 * release-windows.ts — Delayed release system definitions.
 *
 * Models how protected capital can transition back to availability
 * with intentional timing. Each release window represents a different
 * behavioral pattern for the release experience.
 *
 * This is architecture preparation only. No release execution logic
 * depends on these definitions yet.
 *
 * ── Philosophy ─────────────────────────────────────────
 * Release windows exist to make capital movement intentional rather
 * than impulsive. By introducing time, reflection, or staging between
 * the decision to release and the actual availability of capital,
 * Elora preserves the calm that makes protection valuable.
 *
 * ── Current state ──────────────────────────────────────
 * - Only "immediate" release (with a 10s confirmation timer) exists
 *   in production on the Intent page.
 * - All other window types are conceptual placeholders.
 */

/* ── Release window identifiers ─────────────────────── */

/**
 * The type of delay applied when releasing protected capital.
 *
 * immediate:   Capital becomes available as soon as the user confirms.
 *              This is the current production behavior with a brief
 *              10-second confirmation window to prevent reflex actions.
 *
 * delayed:     Capital becomes available after a fixed time delay
 *              (e.g., 12 hours). The user sets the delay or accepts
 *              a default. No further action required after confirmation.
 *
 * scheduled:   Capital becomes available at a specific future time
 *              (e.g., "tomorrow at 9:00 AM"). The user picks the
 *              release moment. Useful for end-of-day or end-of-week
 *              capital planning.
 *
 * staged:      Capital returns in tranches over a period (e.g., 25%
 *              per week). Each tranche becomes available automatically.
 *              Useful for large protection amounts where a sudden
 *              influx of available capital might trigger impulsive use.
 *
 * reviewed:    Release is confirmed by the user, then held for a
 *              reflection period before execution. During reflection,
 *              the user can cancel the release. If no cancellation,
 *              capital becomes available after the review window.
 */
export type ReleaseWindow = "immediate" | "delayed" | "scheduled" | "staged" | "reviewed";

/* ── Window configuration ───────────────────────────── */

export interface ReleaseWindowConfig {
  type: ReleaseWindow;
  label: string;
  description: string;
  /** Human-readable summary of the timing (e.g., "12 hours", "Tomorrow 9:00 AM") */
  timingLabel: string;
  /** Whether the user actively selects this (vs. it being the default) */
  isSelectable: boolean;
  /** Whether this window is currently available in production */
  isAvailable: boolean;
  /** The default delay in milliseconds (0 for immediate) */
  defaultDelayMs: number;
  /** Minimum delay in milliseconds */
  minDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Whether the user can customize the delay duration */
  isCustomizable: boolean;
  /** Whether a reflection/cancellation period exists after confirmation */
  hasReflectionPeriod: boolean;
  /** Whether capital returns in multiple tranches */
  isStaged: boolean;
}

/* ── Window definitions ─────────────────────────────── */

export const RELEASE_WINDOWS: Record<ReleaseWindow, ReleaseWindowConfig> = {
  immediate: {
    type: "immediate",
    label: "Immediate release",
    description: "Capital becomes available after a brief confirmation. No additional delay.",
    timingLabel: "Moments after confirmation",
    isSelectable: true,
    isAvailable: true,
    defaultDelayMs: 10_000, // 10-second confirmation countdown
    minDelayMs: 0,
    maxDelayMs: 60_000,
    isCustomizable: false,
    hasReflectionPeriod: false,
    isStaged: false,
  },
  delayed: {
    type: "delayed",
    label: "Delayed release",
    description: "Capital becomes available after a fixed waiting period. Set it and it happens.",
    timingLabel: "12 hours",
    isSelectable: true,
    isAvailable: false,
    defaultDelayMs: 12 * 60 * 60 * 1000, // 12 hours
    minDelayMs: 1 * 60 * 60 * 1000,       // 1 hour minimum
    maxDelayMs: 7 * 24 * 60 * 60 * 1000,  // 7 days maximum
    isCustomizable: true,
    hasReflectionPeriod: false,
    isStaged: false,
  },
  scheduled: {
    type: "scheduled",
    label: "Scheduled release",
    description: "Pick the exact time capital becomes available. Choose a moment that works for you.",
    timingLabel: "User-selected date and time",
    isSelectable: true,
    isAvailable: false,
    defaultDelayMs: 24 * 60 * 60 * 1000,  // 1 day default
    minDelayMs: 1 * 60 * 60 * 1000,       // 1 hour minimum
    maxDelayMs: 365 * 24 * 60 * 60 * 1000, // 1 year maximum
    isCustomizable: true,
    hasReflectionPeriod: false,
    isStaged: false,
  },
  staged: {
    type: "staged",
    label: "Staged release",
    description: "Capital returns in portions over time. Each tranche becomes available automatically at set intervals.",
    timingLabel: "25% per week",
    isSelectable: true,
    isAvailable: false,
    defaultDelayMs: 7 * 24 * 60 * 60 * 1000, // 1 week between tranches
    minDelayMs: 1 * 24 * 60 * 60 * 1000,     // 1 day minimum
    maxDelayMs: 90 * 24 * 60 * 60 * 1000,    // 90 days maximum
    isCustomizable: true,
    hasReflectionPeriod: false,
    isStaged: true,
  },
  reviewed: {
    type: "reviewed",
    label: "Reviewed release",
    description: "Confirm your intent, then reflect before execution. You can cancel during the review period.",
    timingLabel: "24-hour review period",
    isSelectable: true,
    isAvailable: false,
    defaultDelayMs: 24 * 60 * 60 * 1000,  // 24-hour review
    minDelayMs: 1 * 60 * 60 * 1000,       // 1 hour minimum
    maxDelayMs: 7 * 24 * 60 * 60 * 1000,  // 7 days maximum
    isCustomizable: true,
    hasReflectionPeriod: true,
    isStaged: false,
  },
};

/* ── Helpers ─────────────────────────────────────────── */

/**
 * Get the available (selectable) release windows.
 * Filters to windows the user can currently choose from.
 */
export function getAvailableReleaseWindows(): ReleaseWindowConfig[] {
  return Object.values(RELEASE_WINDOWS).filter((w) => w.isSelectable);
}

/**
 * Get the production-ready release windows.
 * Filters to windows currently available in production.
 */
export function getProductionReleaseWindows(): ReleaseWindowConfig[] {
  return Object.values(RELEASE_WINDOWS).filter((w) => w.isAvailable);
}

/**
 * Get a human-readable label for a delay duration.
 *
 * Examples:
 *   - 3600000 → "1 hour"
 *   - 43200000 → "12 hours"
 *   - 86400000 → "1 day"
 *   - 604800000 → "7 days"
 */
export function formatDelayDuration(ms: number): string {
  const hours = Math.round(ms / (60 * 60 * 1000));
  if (hours < 1) return "Less than an hour";
  if (hours === 1) return "1 hour";
  if (hours < 24) return `${hours} hours`;
  const days = Math.round(hours / 24);
  if (days === 1) return "1 day";
  return `${days} days`;
}

/**
 * Generate a mock release preview message for a given window type.
 *
 * These are UX copy examples, not real scheduling logic.
 */
export function getReleasePreviewMessage(window: ReleaseWindow, amountFormatted: string): string {
  switch (window) {
    case "immediate":
      return `$${amountFormatted} will be available moments after confirmation.`;
    case "delayed":
      return `$${amountFormatted} will become available in ${formatDelayDuration(RELEASE_WINDOWS.delayed.defaultDelayMs)}.`;
    case "scheduled":
      return `$${amountFormatted} will become available tomorrow at 9:00 AM.`;
    case "staged":
      return `$${amountFormatted} will return gradually — 25% every 7 days.`;
    case "reviewed":
      return `Release requested. You have 24 hours to cancel before capital becomes available.`;
  }
}
