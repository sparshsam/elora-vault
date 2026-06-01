/**
 * Behavioral protection policy types.
 *
 * Policies are user-defined rules that describe how capital should behave
 * before emotion arrives. They are NOT automated execution — they are
 * behavioral commitments with optional future enforcement.
 *
 * Each policy has:
 *  - a trigger (when should this happen)
 *  - an effect (what should Elora do)
 *  - optional parameters (duration, percentage, threshold)
 */

/** Supported policy types — the kind of behavioral rule being defined. */
export type PolicyType =
  | "protect-profit-percentage"
  | "delayed-withdrawal"
  | "large-transfer-cooling"
  | "release-reflection-required"
  | "prediction-profit-protection";

/** Policy lifecycle status. */
export type PolicyStatus = "active" | "paused" | "draft";

/** Trigger condition that activates the policy. */
export interface PolicyCondition {
  /** Human-readable description of when this policy applies. */
  description: string;
  /** Optional minimum amount that triggers the policy. */
  minAmount?: number;
  /** Optional percentage threshold that triggers the policy. */
  percentageThreshold?: number;
  /** Optional time window in hours for delayed/cooldown policies. */
  windowHours?: number;
}

/** Action the policy describes. Not executed — just defined. */
export interface PolicyAction {
  /** Human-readable description of what Elora should do. */
  description: string;
  /** For percentage-based policies: what portion to protect (0-100). */
  protectPercentage?: number;
  /** For delay policies: hold duration in hours. */
  delayHours?: number;
  /** For threshold policies: the dollar amount threshold. */
  thresholdAmount?: number;
}

/**
 * A behavioral protection policy — a user-defined rule describing
 * how capital should behave under specific conditions.
 *
 * Policies currently save, display, edit, and pause.
 * They do NOT automatically move funds yet.
 */
export interface ProtectionPolicy {
  /** Unique identifier. */
  id: string;
  /** Short human-readable name. */
  title: string;
  /** The kind of policy. */
  type: PolicyType;
  /** Current status. */
  status: PolicyStatus;
  /** When the policy triggers. */
  condition: PolicyCondition;
  /** What the policy does. */
  action: PolicyAction;
  /** Optional longer behavioral description. */
  description?: string;
  /** When the policy was created. */
  createdAt: string;
  /** When the policy was last modified. */
  updatedAt: string;
}

/** Payload for creating a new policy. */
export interface CreatePolicyRequest {
  title: string;
  type: PolicyType;
  condition: PolicyCondition;
  action: PolicyAction;
  description?: string;
}

/** Payload for updating an existing policy. */
export interface UpdatePolicyRequest {
  title?: string;
  status?: PolicyStatus;
  condition?: PolicyCondition;
  action?: PolicyAction;
  description?: string;
}

/**
 * Policy metadata: display labels, descriptions, and default config
 * for each policy type. Used in the UI to render human-friendly forms.
 */
export const POLICY_TYPE_META: Record<
  PolicyType,
  {
    label: string;
    description: string;
    triggerLabel: string;
    effectLabel: string;
  }
> = {
  "protect-profit-percentage": {
    label: "Protect prediction profits",
    description:
      "Set aside a portion of positive prediction returns automatically.",
    triggerLabel: "When a prediction is settled as won",
    effectLabel: "Protect a percentage of the return",
  },
  "delayed-withdrawal": {
    label: "Delayed withdrawals",
    description:
      "Introduce a cooling-off period before withdrawals can complete.",
    triggerLabel: "When a withdrawal is requested",
    effectLabel: "Hold the withdrawal for a period of time",
  },
  "large-transfer-cooling": {
    label: "Large transfer cooling",
    description:
      "Large deposits or transfers enter a waiting period before becoming available.",
    triggerLabel: "When a deposit exceeds a threshold",
    effectLabel: "Delay availability for a period of time",
  },
  "release-reflection-required": {
    label: "Release reflection",
    description:
      "Require a reflection step before releasing protected capital early.",
    triggerLabel: "When an early release is requested",
    effectLabel: "Show a reflection prompt before release",
  },
  "prediction-profit-protection": {
    label: "Prediction profit protection",
    description:
      "Protect a portion of prediction profits into a timed horizon.",
    triggerLabel: "After a prediction settles as won",
    effectLabel: "Move a percentage of profit into protection",
  },
};
