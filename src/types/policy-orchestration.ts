/**
 * Policy Orchestration Types
 *
 * Extends the base policy system with orchestration concepts:
 * evaluation lifecycle, scheduling, cooldowns, reflection, and timelines.
 *
 * These types describe HOW policies are evaluated and when they intervene.
 * They do NOT describe automated execution — they describe behavioral
 * orchestration.
 */

import type { PolicyType, PolicyStatus as BasePolicyStatus } from "@/types/policy";

/* ── Extended Status ───────────────────────────── */

/**
 * Extended policy status for orchestration.
 * Adds intermediate states for evaluation lifecycle.
 */
export type OrchestrationStatus =
  | BasePolicyStatus
  | "evaluating"
  | "scheduled"
  | "cooldown"
  | "reflecting";

/* ── Evaluation Lifecycle ──────────────────────── */

/** The current phase of a policy in the evaluation lifecycle. */
export type EvaluationPhase =
  | "idle"           // Not currently being evaluated
  | "scanning"       // Checking if trigger conditions are met
  | "suggesting"     // Generating a suggestion (not execution)
  | "reflecting"     // In a reflection/pause window
  | "staged";        // Ready but awaiting user confirmation

/** Result of a single policy evaluation. */
export interface EvaluationResult {
  policyId: string;
  policyType: PolicyType;
  policyTitle: string;
  phase: EvaluationPhase;
  triggered: boolean;
  /** Human-readable reason for the evaluation outcome. */
  reason: string;
  /** If triggered, what suggestion does the policy offer? */
  suggestion?: PolicySuggestion;
  /** When the evaluation occurred. */
  evaluatedAt: number;
  /** When this evaluation's effect expires, if applicable. */
  expiresAt?: number;
}

/* ── Suggestions ───────────────────────────────── */

/** A policy suggestion — the policy's recommended intervention. */
export interface PolicySuggestion {
  type: SuggestionType;
  title: string;
  description: string;
  /** Calm, optional action the user can take. */
  action?: SuggestionAction;
  /** Context that prompted this suggestion. */
  context: string;
  /** Whether the user acted on this suggestion. */
  acknowledged?: boolean;
}

export type SuggestionType =
  | "protection-prompt"      // "Protect this return?"
  | "reflection-prompt"      // "Are you sure? Take a moment."
  | "cooling-notice"         // "This withdrawal will be available in..."
  | "hesitation-check"       // "You've released capital N times this week"
  | "pause-suggestion"       // "Consider pausing after consecutive losses"
  | "behavioral-observation";// Quiet pattern observation

export interface SuggestionAction {
  label: string;         // Button text
  description: string;   // What happens
  /** The route or action this suggestion leads to. */
  href?: string;
}

/* ── Scheduling & Cooldown ─────────────────────── */

export interface PolicySchedule {
  /** Type of schedule. */
  type: "immediate" | "delayed" | "temporal-window" | "event-count";
  /** If delayed: delay in hours. */
  delayHours?: number;
  /** If temporal-window: window definition. */
  window?: TemporalWindow;
  /** If event-count: trigger after N events. */
  eventThreshold?: number;
  /** Cooldown between evaluations, in hours. */
  cooldownHours: number;
}

export interface TemporalWindow {
  /** Day of week (0=Sunday, 6=Saturday). */
  dayOfWeek?: number;
  /** Hour of day (0-23). */
  hour?: number;
  /** Minimum hours since last evaluation. */
  minIntervalHours?: number;
}

/* ── Reflection State ──────────────────────────── */

export interface ReflectionState {
  /** When the reflection period started. */
  startedAt: number;
  /** When the reflection period ends. */
  endsAt: number;
  /** What's being reflected on. */
  subject: string;
  /** Whether the user has confirmed. */
  confirmed: boolean;
  /** Whether the user has dismissed. */
  dismissed: boolean;
  /** Reminder count during reflection. */
  reminderCount: number;
}

/* ── Timeline Records ──────────────────────────── */

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  policyId?: string;
  policyTitle?: string;
  title: string;
  description: string;
  /** The suggestion that was offered, if any. */
  suggestion?: PolicySuggestion;
  /** Whether the suggestion was acted on. */
  acted?: boolean;
  timestamp: number;
}

export type TimelineEntryType =
  | "policy-evaluated"
  | "suggestion-offered"
  | "suggestion-acknowledged"
  | "suggestion-dismissed"
  | "reflection-started"
  | "reflection-completed"
  | "reflection-dismissed"
  | "cooldown-activated"
  | "schedule-triggered";

/* ── Evaluation Context ────────────────────────── */

/* ── Runtime Suggestion ───────────────────────── */

/**
 * A structured suggestion from the policy runtime evaluation engine.
 *
 * This is the canonical output of evaluating active policies against
 * current capital state. It describes what a policy recommends, why,
 * and requires explicit user confirmation before any execution layer
 * should act on it.
 *
 * Design invariants:
 *   - NEVER auto-execute based on this type
 *   - requiresConfirmation is always true
 *   - confidence reflects how strongly the condition was met
 *   - priority orders suggestions within a batch (1 = highest)
 */
export interface PolicyRuntimeSuggestion {
  /** The policy that produced this suggestion. */
  policyId: string;
  policyTitle: string;
  policyType: PolicyType;
  /** Human-readable explanation of why this suggestion was generated. */
  reason: string;
  /** What the policy recommends doing. */
  suggestedAction: SuggestionType;
  /** Dollar amount the suggestion involves, if applicable. */
  amount?: number;
  /**
   * How confident the evaluation is that the condition is genuinely met.
   * - high: condition clearly met (e.g., recent win above threshold with capital available)
   * - medium: condition partially met (e.g., win exists but amount is small)
   * - low: faint signal, worth a quiet mention
   */
  confidence: "low" | "medium" | "high";
  /**
   * Priority within a batch of suggestions (1 = highest).
   * Derived from urgency and capital impact.
   */
  priority: number;
  /** Always true — policy runtime never auto-executes. */
  requiresConfirmation: true;
  /** When this suggestion expires and should be re-evaluated. */
  expiresAt: number;
  /** When the evaluation was performed. */
  evaluatedAt: number;
}

/* ── Runtime Evaluation Context ──────────────── */

/**
 * Compact state snapshot used by the policy runtime evaluator.
 * Unlike EvaluationContext (event-driven), this is built from
 * current capital state and recent activity — no event required.
 */
export interface RuntimeEvaluationInput {
  /** Current capital state (onchain + DB derived). */
  capital: {
    available: number;
    protected: number;
    releasing: number;
    committed: number;
  };
  /** Recent activity summary (last 7 days). */
  recentActivity: {
    predictionsWon: number;
    predictionsLost: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalProtected: number;
    totalReleased: number;
    consecutiveLosses: number;
  };
  /** Recent won predictions with their profit amounts. */
  recentWins: { id: string; description: string; profit: number }[];
  /** Active protection horizons. */
  activeHorizons: { id: string; amount: number; durationDays: number }[];
}

/* ── Evaluation Context (event-driven, existing) ─ */

/**
 * Full context passed to the evaluation engine.
 * Built from the current capital event plus the user's
 * current capital state and recent history.
 */
export interface EvaluationContext {
  /** The event that triggered evaluation. */
  event: { type: string; timestamp: number };
  /** Current capital state. */
  capital: {
    available: number;
    protected: number;
    releasing: number;
    committed: number;
  };
  /** Recent activity summary (last 7 days). */
  recentActivity: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalProtected: number;
    totalReleased: number;
    predictionsWon: number;
    predictionsLost: number;
    consecutiveLosses: number;
  };
  /** Number of active policies. */
  activePolicyCount: number;
  /** Timestamp of last evaluation for cooldown checks. */
  lastEvaluatedAt?: number;
}

/* ── Event Evaluation Result ───────────────────── */

/**
 * The complete result of evaluating all active policies
 * against a single capital event.
 */
export interface EventEvaluationResult {
  eventType: string;
  evaluatedAt: number;
  /** Individual evaluation results. */
  evaluations: EvaluationResult[];
  /** Suggestions to surface (filtered, deduped). */
  suggestions: PolicySuggestion[];
  /** Reflections to surface. */
  reflections: ReflectionState[];
  /** Policies that entered cooldown. */
  cooldowns: { policyId: string; until: number }[];
}

/* ── Constants ─────────────────────────────────── */

/** Default cooldown between evaluations (6 hours). */
export const DEFAULT_COOLDOWN_HOURS = 6;

/** Minimum cooldown (30 minutes). */
export const MIN_COOLDOWN_HOURS = 0.5;

/** Maximum cooldown (7 days). */
export const MAX_COOLDOWN_HOURS = 168;

/** Default reflection duration (60 seconds). */
export const DEFAULT_REFLECTION_SECONDS = 60;

/** Extended reflection for large actions (5 minutes). */
export const EXTENDED_REFLECTION_SECONDS = 300;
