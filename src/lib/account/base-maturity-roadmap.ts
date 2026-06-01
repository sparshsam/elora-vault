/**
 * base-maturity-roadmap.ts
 *
 * Phase 6.4D+ — Base-Native Maturity Roadmap.
 *
 * ⚠ RESEARCH DOCUMENT — NOT PRODUCTION CODE ⚠
 *
 * Defines the progressive maturity model for Elora's Base-native
 * infrastructure. Each phase builds on the previous without breaking
 * existing functionality. The roadmap is designed so that users who
 * never opt into Base-native features continue working exactly as before.
 *
 * Maturity levels:
 *
 *   Phase 1: Detection    (current — 6.3D)  — visibility only
 *   Phase 2: Awareness    (current — 6.4D)  — research + architecture
 *   Phase 3: Capability   (next)            — spend permissions + batch prep
 *   Phase 4: Execution    (future)          — batched vault operations
 *   Phase 5: Autonomy     (future)          — programmable capital behavior
 */

import type { ExecutionTier } from "@/lib/web3/use-wallet-capabilities";

/* ════════════════════════════════════════════════════════════ */
/*  1. MATURITY PHASES                                         */
/* ════════════════════════════════════════════════════════════ */

export type MaturityPhase =
  /** Phase 1: Detection — capability detection, no execution changes */
  | "phase-1-detection"
  /** Phase 2: Awareness — architecture research, UI previews, no execution */
  | "phase-2-awareness"
  /** Phase 3: Capability — spend permissions, batch preparation, gated UX */
  | "phase-3-capability"
  /** Phase 4: Execution — batched vault operations, gas sponsorship optional */
  | "phase-4-execution"
  /** Phase 5: Autonomy — programmable capital behavior, recurring actions */
  | "phase-5-autonomy";

export interface PhaseDefinition {
  /** Phase identifier */
  phase: MaturityPhase;
  /** Short name */
  name: string;
  /** What the user sees */
  userVisibleChanges: string[];
  /** What changes internally */
  internalChanges: string[];
  /** Execution tier enabled at this phase */
  executionTier: ExecutionTier;
  /** Whether production wallet flows are modified */
  modifiesWalletFlow: boolean;
  /** Whether the vault contract needs changes */
  requiresContractUpgrade: boolean;
  /** Whether user opt-in is required */
  requiresOptIn: boolean;
  /** Risks introduced at this phase */
  risks: string[];
}

export const MATURITY_PHASES: Record<MaturityPhase, PhaseDefinition> = {
  "phase-1-detection": {
    phase: "phase-1-detection",
    name: "Detection",
    userVisibleChanges: [
      "Base Account badge on wallet address",
      "Sub-account hierarchy display",
      "Settings: capability detection panel",
      "Settings: enhancement roadmap",
    ],
    internalChanges: [
      "EIP-5792 capability detection (wallet_getCapabilities)",
      "wallet_sendCalls direct probe",
      "wallet_getSubAccounts detection",
      "Connector heuristic fallback",
    ],
    executionTier: "external-only",
    modifiesWalletFlow: false,
    requiresContractUpgrade: false,
    requiresOptIn: false,
    risks: [],
  },
  "phase-2-awareness": {
    phase: "phase-2-awareness",
    name: "Awareness",
    userVisibleChanges: [
      "Transaction orchestration preview in Settings",
      "Execution decision tree visualization",
      "Batching flow cards with capability-aware badges",
      "Sub-account lifecycle section (read-only)",
      "Paymaster research notes",
    ],
    internalChanges: [
      "Orchestration architecture map",
      "Execution decision tree",
      "Sub-account lifecycle model",
      "Paymaster boundary research",
      "Maturity roadmap (this file)",
    ],
    executionTier: "external-only",
    modifiesWalletFlow: false,
    requiresContractUpgrade: false,
    requiresOptIn: false,
    risks: [],
  },
  "phase-3-capability": {
    phase: "phase-3-capability",
    name: "Capability",
    userVisibleChanges: [
      "Sub-account creation prompt (opt-in)",
      "Spend permission configuration UI",
      "Batch preview on deposit+protect flow (read-only)",
      "Settings: spend permission config panel",
      "Settings: batching capability toggle",
    ],
    internalChanges: [
      "Sub-account creation via @base-org/account SDK",
      "Spend permission setup for vault contract",
      "Batch calldata composition (not executed)",
      "Fallback path verification",
    ],
    executionTier: "sub-account",
    modifiesWalletFlow: true, // sub-account execution path added
    requiresContractUpgrade: false,
    requiresOptIn: true, // user must create sub-account
    risks: [
      "Sub-account creation UX must be clear and reversible",
      "Spend permission amounts must have sane defaults",
      "Users may confuse sub-account with a separate wallet",
    ],
  },
  "phase-4-execution": {
    phase: "phase-4-execution",
    name: "Execution",
    userVisibleChanges: [
      "Deposit + protect as single batched action",
      "Release + reprotect as single batched action",
      "Single wallet confirmation for multi-step flows",
      "Gas sponsorship indicator (when available)",
      "Settings: execution path status",
    ],
    internalChanges: [
      "wallet_sendCalls batch execution",
      "Contract multicall fallback",
      "Sequential fallback for unsupported wallets",
      "Paymaster integration (optional)",
      "Gas estimation for batches",
    ],
    executionTier: "batched",
    modifiesWalletFlow: true, // batch replaces sequential
    requiresContractUpgrade: false, // EIP-5792 needs no contract changes
    requiresOptIn: true, // user must opt into batched flows
    risks: [
      "wallet_sendCalls not universally supported — fallback is critical",
      "Gas estimation for batches is less accurate",
      "Partial batch failure must revert fully or be user-visible",
    ],
  },
  "phase-5-autonomy": {
    phase: "phase-5-autonomy",
    name: "Autonomy",
    userVisibleChanges: [
      "Automatic lock rollover (with user pre-approval)",
      "Recurring protection schedules",
      "Capital flow rules (user-defined)",
      "Calm execution mode (zero wallet popups)",
      "Activity log of all autonomous actions",
    ],
    internalChanges: [
      "Cron/keeper for time-triggered actions",
      "User-defined capital flow rules engine",
      "Sub-account batch execution with spend permissions",
      "Paymaster for autonomous operations",
      "Audit trail for all autonomous actions",
    ],
    executionTier: "batched",
    modifiesWalletFlow: true, // autonomous execution path
    requiresContractUpgrade: true, // may need batch function on vault
    requiresOptIn: true, // must be explicit
    risks: [
      "Autonomous execution introduces non-trivial risk surface",
      "User must fully understand and pre-approve rules",
      "Keeper infrastructure must be reliable",
      "Regulatory consideration: automated capital management",
    ],
  },
};

/* ════════════════════════════════════════════════════════════ */
/*  2. CURRENT PHASE ASSESSMENT                                */
/* ════════════════════════════════════════════════════════════ */

/**
 * Current maturity assessment.
 * Updated after each completed phase.
 */
export const CURRENT_MATURITY_ASSESSMENT = {
  /** Current phase reached */
  currentPhase: "phase-2-awareness" as MaturityPhase,
  /** Date of last phase completion */
  lastCompleted: "2026-06-01",
  /** Summary of what's shipping */
  summary:
    "Phase 2 (Awareness) is complete. All architecture research, decision " +
    "trees, lifecycle proposals, paymaster research, and maturity roadmap " +
    "are documented. No production wallet flows are modified. The Settings " +
    "page shows orchestration previews and capability routing information " +
    "as read-only displays.",
  /** Next phase planned */
  nextPhase: "Phase 3 (Capability) — sub-account creation + spend permissions",
  /** Tags for quick reference */
  tags: ["detection", "architecture", "research", "no-execution"],
};

/* ════════════════════════════════════════════════════════════ */
/*  3. MIGRATION PATHS                                         */
/* ════════════════════════════════════════════════════════════ */

/**
 * How users move between maturity phases.
 * Each entry describes the transition path.
 */
export interface MigrationPath {
  /** From phase */
  from: MaturityPhase;
  /** To phase */
  to: MaturityPhase;
  /** What triggers the migration */
  trigger: string;
  /** What the user must do */
  userAction: string;
  /** What the app does automatically */
  autoAction: string;
  /** Whether this is reversible */
  reversible: boolean;
  /** How to revert */
  revertPath?: string;
}

export const MIGRATION_PATHS: MigrationPath[] = [
  {
    from: "phase-1-detection",
    to: "phase-2-awareness",
    trigger: "Code deployment (no user action)",
    userAction: "None — architecture is read-only research",
    autoAction: "Orchestration previews appear in Settings",
    reversible: true,
    revertPath: "Revert commit; architecture docs are not user-visible beyond Settings",
  },
  {
    from: "phase-2-awareness",
    to: "phase-3-capability",
    trigger: "User clicks 'Create Elora Account' in Settings",
    userAction: "Confirm sub-account creation in wallet",
    autoAction:
      "Sub-account created, spend permission offered, batch previews become interactive",
    reversible: true,
    revertPath: "User removes sub-account in Settings or wallet",
  },
  {
    from: "phase-3-capability",
    to: "phase-4-execution",
    trigger:
      "User opts into batched flows in Settings + wallet supports sendCalls",
    userAction: "Toggle 'Use batched transactions' in Settings",
    autoAction:
      "Deposit+protect and release+reprotect use batching when available",
    reversible: true,
    revertPath:
      "Toggle off batching in Settings; all flows revert to sequential",
  },
  {
    from: "phase-4-execution",
    to: "phase-5-autonomy",
    trigger:
      "User configures capital flow rules + pre-approves autonomous actions",
    userAction:
      "Define rules (e.g. 'auto-rollover expired locks'), approve scope",
    autoAction:
      "Cron/keeper executes user-defined rules within approved boundaries",
    reversible: true,
    revertPath:
      "Disable autonomous actions in Settings; rules are paused, not deleted",
  },
];
