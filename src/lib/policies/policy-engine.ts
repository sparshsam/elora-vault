/**
 * Behavioral Protection Policy Engine
 *
 * This is the core of Elora's policy system — definitions, validation,
 * normalization, and evaluation stubs. It is NOT execution.
 *
 * Policies describe how capital should behave under specific conditions.
 * Currently they save, display, edit, and pause. They do NOT automatically
 * move funds.
 *
 * Future execution phases will wire these definitions into actual onchain
 * and offchain flows. For now, the engine validates that policies are
 * structurally sound and provides the vocabulary for the policy system.
 */

import type {
  PolicyType,
  PolicyStatus,
  PolicyCondition,
  PolicyAction,
  ProtectionPolicy,
  CreatePolicyRequest,
} from "@/types/policy";

// ─── Supported Policy Types ────────────────────────────────────────

/** Registry of all supported policy types with behavioral descriptions. */
export const SUPPORTED_POLICY_TYPES: PolicyType[] = [
  "protect-profit-percentage",
  "delayed-withdrawal",
  "large-transfer-cooling",
  "release-reflection-required",
  "prediction-profit-protection",
];

// ─── Validation ────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a policy's structure and values.
 * Returns errors (structural problems that must be fixed) and warnings
 * (unusual configurations that should be reviewed).
 */
export function validatePolicy(request: CreatePolicyRequest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title
  if (!request.title || request.title.trim().length === 0) {
    errors.push("Policy must have a title.");
  } else if (request.title.length > 120) {
    errors.push("Title must be 120 characters or fewer.");
  }

  // Type
  if (!SUPPORTED_POLICY_TYPES.includes(request.type)) {
    errors.push(`"${request.type}" is not a supported policy type.`);
  }

  // Condition
  if (!request.condition) {
    errors.push("Policy must have a trigger condition.");
  } else {
    if (
      !request.condition.description ||
      request.condition.description.trim().length === 0
    ) {
      warnings.push("Consider adding a description for when this policy triggers.");
    }
    if (
      request.condition.minAmount !== undefined &&
      request.condition.minAmount < 0
    ) {
      errors.push("Minimum amount cannot be negative.");
    }
    if (
      request.condition.percentageThreshold !== undefined &&
      (request.condition.percentageThreshold < 0 ||
        request.condition.percentageThreshold > 100)
    ) {
      errors.push("Percentage threshold must be between 0 and 100.");
    }
    if (
      request.condition.windowHours !== undefined &&
      request.condition.windowHours < 0
    ) {
      errors.push("Time window cannot be negative.");
    }
  }

  // Action
  if (!request.action) {
    errors.push("Policy must have an action.");
  } else {
    if (
      !request.action.description ||
      request.action.description.trim().length === 0
    ) {
      warnings.push("Consider adding a description for what this policy does.");
    }
    if (
      request.action.protectPercentage !== undefined &&
      (request.action.protectPercentage < 0 ||
        request.action.protectPercentage > 100)
    ) {
      errors.push("Protect percentage must be between 0 and 100.");
    }
    if (
      request.action.delayHours !== undefined &&
      request.action.delayHours < 0
    ) {
      errors.push("Delay duration cannot be negative.");
    }
    if (
      request.action.thresholdAmount !== undefined &&
      request.action.thresholdAmount < 0
    ) {
      errors.push("Threshold amount cannot be negative.");
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Normalization ─────────────────────────────────────────────────

/**
 * Normalize a create request into a consistent shape — trims strings,
 * clamps percentages, removes undefined optional fields.
 */
export function normalizePolicyRequest(
  request: CreatePolicyRequest,
): CreatePolicyRequest {
  const condition: PolicyCondition = {
    description: request.condition?.description?.trim() ?? "",
    ...(request.condition?.minAmount !== undefined && {
      minAmount: request.condition.minAmount,
    }),
    ...(request.condition?.percentageThreshold !== undefined && {
      percentageThreshold: Math.min(
        100,
        Math.max(0, request.condition.percentageThreshold),
      ),
    }),
    ...(request.condition?.windowHours !== undefined && {
      windowHours: Math.max(0, request.condition.windowHours),
    }),
  };

  const action: PolicyAction = {
    description: request.action?.description?.trim() ?? "",
    ...(request.action?.protectPercentage !== undefined && {
      protectPercentage: Math.min(
        100,
        Math.max(0, request.action.protectPercentage),
      ),
    }),
    ...(request.action?.delayHours !== undefined && {
      delayHours: Math.max(0, request.action.delayHours),
    }),
    ...(request.action?.thresholdAmount !== undefined && {
      thresholdAmount: request.action.thresholdAmount,
    }),
  };

  return {
    title: request.title?.trim() ?? "",
    type: request.type,
    condition,
    action,
    description: request.description?.trim() || undefined,
  };
}

// ─── Evaluation Stubs ──────────────────────────────────────────────

/**
 * Evaluate whether a policy's trigger conditions are met.
 *
 * ⚠ STUB — not wired to execution yet.
 * Future phases will connect this to onchain events, balance changes,
 * and prediction settlements.
 */
export function evaluatePolicy(
  _policy: ProtectionPolicy,
  _context: Record<string, unknown>,
): { triggered: boolean; reason?: string } {
  // Stub: always returns not triggered.
  void _policy;
  void _context;
  return { triggered: false, reason: "Evaluation not yet implemented." };
}

// ─── Status Transitions ────────────────────────────────────────────

const VALID_TRANSITIONS: Record<PolicyStatus, PolicyStatus[]> = {
  draft: ["active", "paused"],
  active: ["paused", "draft"],
  paused: ["active", "draft"],
};

/**
 * Check whether a status transition is valid.
 */
export function canTransitionTo(
  from: PolicyStatus,
  to: PolicyStatus,
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get the allowed next statuses for a given status.
 */
export function allowedNextStatuses(status: PolicyStatus): PolicyStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}
