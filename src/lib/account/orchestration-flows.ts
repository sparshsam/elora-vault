/**
 * orchestration-flows.ts
 *
 * Phase 6.4D+ — Base Account Transaction Orchestration Research (Refined).
 *
 * ⚠ RESEARCH DOCUMENT — NOT PRODUCTION CODE ⚠
 *
 * This file defines and documents how Elora could orchestrate multi-step
 * capital actions using Base-native capabilities (EIP-5792, sub-accounts,
 * atomic batch execution).
 *
 * ## Refinements from Phase 6.4D
 *
 * 1. Batching now accounts for wallet_sendCalls vs atomicBatch distinction
 *    — sendCalls is the preferred path, atomicBatch is the fallback.
 * 2. Fallback sequencing is capability-aware: the routing tier (see
 *    execution-architecture.ts) determines whether a given wallet can
 *    batch, and the flow adapts its execution plan accordingly.
 * 3. settle→protect flow documented with gas estimate and cross-system
 *    boundary analysis.
 * 4. Sub-account execution paths reference the lifecycle model in
 *    sub-account-lifecycle.ts.
 *
 * When Base Account capabilities are detected (via use-wallet-capabilities.ts),
 * these flows become theoretically possible. When not detected, the existing
 * sequential transaction flow continues unchanged.
 */

import type { Address } from "viem";

/* ════════════════════════════════════════════════════════════ */
/*  1. FLOW DEFINITIONS                                        */
/* ════════════════════════════════════════════════════════════ */

/**
 * Canonical orchestration flow identifiers.
 * Each represents a multi-step capital action that could be batched.
 */
export type OrchestrationFlowId =
  /**
   * Deposit USDC into vault AND immediately create a protection lock.
   * Combines: approve(USDC, vault) → deposit(amount) → createLock(amount, duration)
   * If allowance is sufficient, reduces to: deposit(amount) → createLock(amount, duration)
   */
  | "deposit-and-protect"

  /**
   * Release an expired lock AND immediately create a new protection lock
   * with the same capital.
   * Combines: releaseLock(lockId) → createLock(amount, newDuration)
   * Used for horizon rollover / capital reprotection.
   */
  | "release-and-reprotect"

  /**
   * Settle a prediction outcome AND protect the returned capital.
   * Combines: settlePrediction(predictionId) → createLock(amount, duration)
   * Capital flows from at-risk → protected without touching available.
   */
  | "settle-and-protect"

  /**
   * Withdraw unlocked capital AND deposit into vault in one step.
   * Combines: withdrawUnlocked() → deposit(amount)
   * Useful for moving capital from other contracts back into Elora vault.
   */
  | "withdraw-and-deposit";

/**
 * Human-readable labels for each orchestration flow.
 */
export const ORCHESTRATION_FLOW_LABELS: Record<OrchestrationFlowId, string> = {
  "deposit-and-protect": "Deposit & Protect",
  "release-and-reprotect": "Roll Over Protection",
  "settle-and-protect": "Settle & Protect",
  "withdraw-and-deposit": "Withdraw & Deposit",
};

/**
 * Human-readable descriptions for each orchestration flow.
 */
export const ORCHESTRATION_FLOW_DESCRIPTIONS: Record<OrchestrationFlowId, string> = {
  "deposit-and-protect":
    "Deposit USDC into your vault and immediately protect it with a timed lock. " +
    "Reduces two wallet confirmations to one.",
  "release-and-reprotect":
    "Release expired protected capital and immediately create a new protection. " +
    "Keeps capital continuously safeguarded without an exposure window.",
  "settle-and-protect":
    "Settle a prediction outcome and route the returned capital directly into " +
    "protection. Bypasses the available balance entirely.",
  "withdraw-and-deposit":
    "Withdraw unlocked capital from the vault and re-deposit it in a single " +
    "atomic step. Useful for capital consolidation.",
};

/* ════════════════════════════════════════════════════════════ */
/*  2. CAPABILITY REQUIREMENTS                                 */
/* ════════════════════════════════════════════════════════════ */

/**
 * Capabilities that a wallet or provider must support for each flow.
 * Used by the capability detection layer (use-wallet-capabilities.ts)
 * to gate whether batching is offered to the user.
 */
export interface FlowCapabilityRequirements {
  /** Must the wallet support atomic batch execution? */
  requiresAtomicBatch: boolean;
  /** Must the wallet support wallet_sendCalls (EIP-5792)? */
  requiresSendCalls: boolean;
  /** Must a Base Account sub-account exist? */
  requiresSubAccount: boolean;
  /** Must the vault contract support multicall? */
  requiresVaultMulticall: boolean;
  /** Must the USDC approve + transferFrom be pre-approved? */
  requiresSufficientAllowance: boolean;
}

/**
 * Capability requirements per orchestration flow.
 */
export const FLOW_CAPABILITY_REQUIREMENTS: Record<
  OrchestrationFlowId,
  FlowCapabilityRequirements
> = {
  "deposit-and-protect": {
    requiresAtomicBatch: true,
    requiresSendCalls: false, // atomicBatch on the contract side is sufficient
    requiresSubAccount: false,
    requiresVaultMulticall: false, // vault doesn't support multicall yet
    requiresSufficientAllowance: true, // USDC approval must pre-exist
  },
  "release-and-reprotect": {
    requiresAtomicBatch: true,
    requiresSendCalls: false,
    requiresSubAccount: false,
    requiresVaultMulticall: false,
    requiresSufficientAllowance: false, // no approval needed for release
  },
  "settle-and-protect": {
    requiresAtomicBatch: true,
    requiresSendCalls: false,
    requiresSubAccount: false,
    requiresVaultMulticall: false,
    requiresSufficientAllowance: true, // settlement returns to available, approval needed for protect
  },
  "withdraw-and-deposit": {
    requiresAtomicBatch: true,
    requiresSendCalls: false,
    requiresSubAccount: false,
    requiresVaultMulticall: false,
    requiresSufficientAllowance: true, // deposit needs vault approval
  },
};

/* ════════════════════════════════════════════════════════════ */
/*  3. FLOW MODELS                                             */
/* ════════════════════════════════════════════════════════════ */

/**
 * The sequence of contract calls that make up a batched flow.
 * Each step maps to a single contract function invocation.
 */
export interface FlowStep {
  /** Target contract address */
  target: Address;
  /** Function signature (human-readable) */
  functionSignature: string;
  /** Encoded calldata — produced by the respective wagmi hook */
  calldata?: `0x${string}`;
  /** Human description of what this step does */
  description: string;
  /** Whether this step depends on the previous step completing */
  dependsOnPrevious: boolean;
}

/**
 * Full orchestration flow model.
 */
export interface OrchestrationFlow {
  /** Unique flow identifier */
  id: OrchestrationFlowId;
  /** Human-readable label */
  label: string;
  /** Human-readable description */
  description: string;
  /** The sequence of contract calls */
  steps: FlowStep[];
  /** Capabilities needed */
  requiredCapabilities: FlowCapabilityRequirements;
  /** Estimated gas savings vs sequential execution (percentage) */
  estimatedGasSavingsPercent: number;
  /** Whether this flow requires user confirmation */
  requiresUserConfirmation: boolean;
}

/**
 * Research: deposit-and-protect flow.
 *
 * Current sequential flow:
 *   1. User approves USDC (if not already approved) — 1 tx
 *   2. User deposits USDC — 1 tx
 *   3. User creates lock — 1 tx
 *   Total: 3 transactions, 3 wallet confirmations
 *
 * Batched flow (with atomicBatch):
 *   1. User confirms once — 1 wallet confirmation
 *   2. Client sends: [deposit(amount), createLock(amount, duration)]
 *   Total: 1 transaction batch, 1 wallet confirmation
 *   Gas savings: ~40% (two fewer base fees + smaller overhead)
 *
 * Fallback (no batching):
 *   Execute steps sequentially using existing tx-hooks.
 *   User confirms each step individually.
 *
 * Smart contract implication:
 *   ProtectedVault needs a multicall or batch-execute function to receive
 *   atomic batches. Currently: deposit() and createLock() are separate
 *   external functions. A batchDepositAndLock(amount, duration) function
 *   would be ideal but requires a contract upgrade.
 */
export function createDepositAndProtectFlow(
  amount: bigint,
  durationSeconds: bigint,
): OrchestrationFlow {
  return {
    id: "deposit-and-protect",
    label: ORCHESTRATION_FLOW_LABELS["deposit-and-protect"],
    description: ORCHESTRATION_FLOW_DESCRIPTIONS["deposit-and-protect"],
    steps: [
      {
        target: "0x0000000000000000000000000000000000000000" as Address, // vault address (placeholder)
        functionSignature: "deposit(uint256)",
        description: `Deposit ${amount} USDC into vault`,
        dependsOnPrevious: false,
      },
      {
        target: "0x0000000000000000000000000000000000000000" as Address, // vault address (placeholder)
        functionSignature: "createLock(uint256,uint256)",
        description: `Lock ${amount} USDC for ${durationSeconds}s`,
        dependsOnPrevious: true,
      },
    ],
    requiredCapabilities: FLOW_CAPABILITY_REQUIREMENTS["deposit-and-protect"],
    estimatedGasSavingsPercent: 40,
    requiresUserConfirmation: true,
  };
}

/**
 * Research: release-and-reprotect flow.
 *
 * Current sequential flow:
 *   1. User releases expired lock — 1 tx
 *   2. User creates new lock — 1 tx
 *   Total: 2 transactions, 2 wallet confirmations
 *
 * Batched flow (with atomicBatch):
 *   1. User confirms once — 1 wallet confirmation
 *   2. Client sends: [releaseLock(lockId), createLock(amount, newDuration)]
 *   Total: 1 transaction batch, 1 wallet confirmation
 *   Gas savings: ~35%
 *
 * Critical guarantee: release and reprotect MUST be atomic.
 * If release succeeds but reprotect fails, capital sits unlocked
 * and vulnerable. Atomic batch ensures both succeed or both revert.
 *
 * Fallback (no batching):
 *   Execute releaseLock() first, then createLock() in sequence.
 *   Accept the exposure window between steps.
 */
export function createReleaseAndReprotectFlow(
  lockId: number,
  amount: bigint,
  newDurationSeconds: bigint,
): OrchestrationFlow {
  return {
    id: "release-and-reprotect",
    label: ORCHESTRATION_FLOW_LABELS["release-and-reprotect"],
    description: ORCHESTRATION_FLOW_DESCRIPTIONS["release-and-reprotect"],
    steps: [
      {
        target: "0x0000000000000000000000000000000000000000" as Address,
        functionSignature: "releaseLock(uint256)",
        description: `Release lock #${lockId}`,
        dependsOnPrevious: false,
      },
      {
        target: "0x0000000000000000000000000000000000000000" as Address,
        functionSignature: "createLock(uint256,uint256)",
        description: `Lock ${amount} USDC for ${newDurationSeconds}s`,
        dependsOnPrevious: true,
      },
    ],
    requiredCapabilities: FLOW_CAPABILITY_REQUIREMENTS["release-and-reprotect"],
    estimatedGasSavingsPercent: 35,
    requiresUserConfirmation: true,
  };
}

/**
 * Research: settle-and-protect flow.
 *
 * This is the most architecturally complex flow because it crosses
 * system boundaries: prediction settlement (database) + onchain lock.
 *
 * Current sequential flow:
 *   1. User settles prediction (API call) — server updates DB
 *   2. User creates lock (onchain) — 1 tx
 *   Total: 1 API call + 1 transaction
 *
 * This flow is blocked until:
 *   - Prediction settlement emits an onchain event
 *   - OR the settlement API returns the settled amount for immediate protection
 *
 * Research note: settle-and-protect is lower priority than the other two
 * flows because the prediction layer uses a virtual house model. Real
 * onchain settlement would require a prediction contract, not just the vault.
 *
 * Recommended approach: implement this as a client-side composition where
 * settle API call is followed by an immediate lock creation, gated on a
 * single "Settle & Protect" button click. Not truly atomic, but UX feels
 * like one action.
 */
export function createSettleAndProtectFlow(
  settlementAmount: bigint,
  durationSeconds: bigint,
): OrchestrationFlow {
  return {
    id: "settle-and-protect",
    label: ORCHESTRATION_FLOW_LABELS["settle-and-protect"],
    description: ORCHESTRATION_FLOW_DESCRIPTIONS["settle-and-protect"],
    steps: [
      {
        target: "0x0000000000000000000000000000000000000000" as Address,
        functionSignature: "settlePrediction(...)",
        description: "Settle prediction and return capital",
        dependsOnPrevious: false,
      },
      {
        target: "0x0000000000000000000000000000000000000000" as Address,
        functionSignature: "createLock(uint256,uint256)",
        description: `Lock ${settlementAmount} USDC for ${durationSeconds}s`,
        dependsOnPrevious: true,
      },
    ],
    requiredCapabilities: FLOW_CAPABILITY_REQUIREMENTS["settle-and-protect"],
    estimatedGasSavingsPercent: 20,
    requiresUserConfirmation: true,
  };
}

/* ════════════════════════════════════════════════════════════ */
/*  4. FALLBACK BEHAVIOR                                       */
/* ════════════════════════════════════════════════════════════ */

/**
 * Fallback strategy when batching is not available.
 */
export type FallbackStrategy =
  /** Execute steps sequentially with individual wallet confirmations */
  | "sequential"
  /** Skip the multi-step action entirely (unsafe to do partially) */
  | "abort"
  /** Execute steps sequentially but gate on user confirmation per step */
  | "sequential-with-confirmation";

/**
 * Fallback strategy per flow when capabilities are insufficient.
 */
export const FLOW_FALLBACK_STRATEGIES: Record<
  OrchestrationFlowId,
  FallbackStrategy
> = {
  "deposit-and-protect": "sequential",
  "release-and-reprotect": "sequential-with-confirmation",
  "settle-and-protect": "sequential",
  "withdraw-and-deposit": "sequential",
};

/**
 * Fallback descriptions explaining what happens when batching is unavailable.
 */
export const FLOW_FALLBACK_DESCRIPTIONS: Record<
  OrchestrationFlowId,
  string
> = {
  "deposit-and-protect":
    "Each step is executed individually. You will confirm deposit, then confirm protection separately.",
  "release-and-reprotect":
    "We strongly recommend sequential execution here. Release first, then create new protection. " +
    "Capital will be unlocked between steps — only proceed if you intend to re-protect immediately.",
  "settle-and-protect":
    "Prediction is settled first, then protection is created. You will confirm each step.",
  "withdraw-and-deposit":
    "Withdraw first, then deposit. Each step requires separate wallet confirmation.",
};

/* ════════════════════════════════════════════════════════════ */
/*  5. USER CONFIRMATION INTERFACES                           */
/* ════════════════════════════════════════════════════════════ */

/**
 * Granularity of user confirmation for orchestrated actions.
 */
export type ConfirmationGranularity =
  /** Single confirmation for the entire batched flow */
  | "single"
  /** Confirm each step individually (sequential-equivalent UX) */
  | "per-step"
  /** Confirm once for the batch but show step-by-step preview */
  | "single-with-preview";

/**
 * Confirmation model per flow.
 */
export const FLOW_CONFIRMATION_MODELS: Record<
  OrchestrationFlowId,
  ConfirmationGranularity
> = {
  "deposit-and-protect": "single-with-preview",
  "release-and-reprotect": "single-with-preview",
  "settle-and-protect": "single-with-preview",
  "withdraw-and-deposit": "single-with-preview",
};

/**
 * Data shown in the confirmation preview before executing a flow.
 */
export interface FlowConfirmationPreview {
  flowId: OrchestrationFlowId;
  flowLabel: string;
  /** Total amount of USDC involved */
  totalAmount: string;
  /** Number of steps in the flow */
  stepCount: number;
  /** Human-readable step descriptions */
  steps: string[];
  /** Whether gas cost is shown to user */
  showGasEstimate: boolean;
  /** Estimated gas cost (if available) */
  gasEstimateWei?: bigint;
  /** Whether batching is being used */
  isBatched: boolean;
}

/**
 * Build a confirmation preview for a given flow.
 */
export function buildConfirmationPreview(
  flow: OrchestrationFlow,
  isBatched: boolean,
): FlowConfirmationPreview {
  return {
    flowId: flow.id,
    flowLabel: flow.label,
    totalAmount: flow.steps[0]?.description.match(/[\d.]+/)?.[0] ?? "—",
    stepCount: flow.steps.length,
    steps: flow.steps.map((s) => s.description),
    showGasEstimate: isBatched,
    isBatched,
  };
}

/* ════════════════════════════════════════════════════════════ */
/*  6. SUB-ACCOUNT EXECUTION RESEARCH                          */
/* ════════════════════════════════════════════════════════════ */

/**
 * How Elora sub-accounts could be used for capital operations.
 *
 * ## Architecture
 *
 * Universal Account (user's primary wallet)
 *   └── Elora Sub Account (app-scoped, domain-bound)
 *         ├── Vault deposits & withdrawals
 *         ├── Lock creation & release
 *         └── Future: prediction settlements
 *
 * ## Benefits
 *
 * 1. **App isolation** — Sub-account is scoped to Elora's domain.
 *    Other apps cannot interact with it without explicit user consent.
 *
 * 2. **Simplified recurring interactions** — Sub-account can hold
 *    pre-approved spend permissions for the vault contract, eliminating
 *    the approve step on every deposit.
 *
 * 3. **User ownership preserved** — The sub-account is derived from the
 *    user's universal account key. Elora never controls the keys.
 *
 * 4. **Cleaner transaction flow** — With pre-approved spend permissions
 *    on the sub-account, deposit+protect becomes a single message:
 *    `subAccount.executeBatch([depositCall, lockCall])`
 *
 * ## Spend Permissions
 *
 * Sub-accounts support "spend permissions" — pre-approved allowances
 * that route through the universal account if insufficient. This means:
 *   - User approves once: "Elora sub-account may spend up to $X USDC"
 *   - All subsequent vault operations use the approved budget
 *   - No per-transaction approve steps
 *
 * ## Implementation Path
 *
 * Phase A (current): Detection + visibility (Phase 6.3D)
 *   → Detect sub-account, show hierarchy, no execution
 *
 * Phase B (next): Spend permission setup
 *   → User creates sub-account, sets spend permission for vault
 *   → Eliminates approve step for future deposits
 *
 * Phase C (future): Sub-account vault routing
 *   → All vault operations execute through sub-account
 *   → Atomic batching via executeBatch
 *   → Gas sponsorship possible via paymaster on sub-account
 */

export interface SubAccountExecutionModel {
  /** Whether a sub-account has been created for Elora */
  subAccountExists: boolean;
  /** The sub-account address (if created) */
  subAccountAddress: Address | null;
  /** Whether spend permissions are configured */
  spendPermissionsConfigured: boolean;
  /** Whether the sub-account can execute batch calls */
  batchExecutionAvailable: boolean;
  /** Whether gas sponsorship is configured on the sub-account */
  gasSponsorshipAvailable: boolean;
}

/**
 * Default (empty) sub-account execution state.
 */
export const EMPTY_SUB_ACCOUNT_MODEL: SubAccountExecutionModel = {
  subAccountExists: false,
  subAccountAddress: null,
  spendPermissionsConfigured: false,
  batchExecutionAvailable: false,
  gasSponsorshipAvailable: false,
};

/* ════════════════════════════════════════════════════════════ */
/*  7. SMART CONTRACT IMPLICATIONS                             */
/* ════════════════════════════════════════════════════════════ */

/**
 * Contract changes needed to support atomic batching.
 *
 * ## Option A: Batch function on vault
 *
 * Add to ProtectedVault:
 * ```
 * function batchDepositAndLock(uint256 amount, uint256 duration) external {
 *     deposit(amount);  // calls internal _deposit or reuses existing
 *     createLock(amount, duration);
 * }
 * ```
 * Pros: Simple, gas-efficient, one function call
 * Cons: Requires contract upgrade, less flexible for future flows
 *
 * ## Option B: Generic multicall on vault
 *
 * Add to ProtectedVault:
 * ```
 * function multicall(bytes[] calldata data) external returns (bytes[] memory) {
 *     bytes[] memory results = new bytes[](data.length);
 *     for (uint256 i = 0; i < data.length; i++) {
 *         (bool success, bytes memory result) = address(this).delegatecall(data[i]);
 *         require(success, "Multicall failed");
 *         results[i] = result;
 *     }
 *     return results;
 * }
 * ```
 * Pros: Flexible, any combination of calls, extensible
 * Cons: Higher gas, potential for unsafe combinations
 *
 * ## Option C: EIP-5792 wallet_sendCalls
 *
 * Use wallet-level batching instead of contract-level.
 * Client composes [deposit, createLock] and sends as a batch via
 * wallet_sendCalls. Wallet executes atomically.
 *
 * Pros: No contract changes needed, works with existing vault
 * Cons: Requires wallet_sendCalls support (detectable via capabilities)
 *
 * ## Recommendation
 *
 * Start with Option C (wallet_sendCalls) since it requires zero contract
 * changes and is detectable via use-wallet-capabilities.ts. Fall back to
 * sequential execution when not supported.
 *
 * Option A (batch function) is the medium-term upgrade path once the
 * vault contract is audited and a formal upgrade is scheduled.
 */

export type BatchExecutionStrategy =
  /** Use wallet-level batching (EIP-5792 wallet_sendCalls) */
  | "wallet-send-calls"
  /** Use vault multicall function */
  | "vault-multicall"
  /** Use vault-specific batch function */
  | "vault-batch-function"
  /** No batching — execute sequentially */
  | "sequential";

/**
 * Recommended batching strategy per flow.
 * Ranks by preference: wallet_sendCalls > vault multicall > sequential.
 */
export const FLOW_BATCH_STRATEGIES: Record<
  OrchestrationFlowId,
  BatchExecutionStrategy
> = {
  "deposit-and-protect": "wallet-send-calls",
  "release-and-reprotect": "wallet-send-calls",
  "settle-and-protect": "wallet-send-calls",
  "withdraw-and-deposit": "wallet-send-calls",
};

/* ════════════════════════════════════════════════════════════ */
/*  8. BLOCKERS AND RISKS                                      */
/* ════════════════════════════════════════════════════════════ */

export interface BlockersAndRisks {
  /** List of unresolved blockers */
  blockers: string[];
  /** List of identified risks */
  risks: string[];
  /** Notes about external dependencies */
  externalDependencies: string[];
}

/**
 * Current blockers and risks for orchestration execution.
 *
 * Blockers:
 *   - ProtectedVault contract does not expose deposit() as internal,
 *     so a batch function cannot reuse internal logic without duplication
 *     or refactoring.
 *   - wallet_sendCalls EIP-5792 is not widely supported yet. Detection
 *     via wallet_getCapabilities is reliable when supported, but the
 *     fallback (sequential) must always work.
 *   - Sub-account spend permissions require Base Account SDK features
 *     that are still in developer preview.
 *
 * Risks:
 *   - Atomic batch in release-and-reprotect: if reprotect fails after
 *     release succeeds, capital is unlocked. A try-catch wrapper or
 *     explicit revert-on-failure is essential.
 *   - Gas estimation for batched calls is less accurate than single calls.
 *     Users may see "out of gas" errors on complex batches.
 *   - Sub-account vault routing introduces a new execution path that
 *     must be tested exhaustively before any production use.
 *
 * External dependencies:
 *   - @base-org/account SDK version for sub-account spend permissions
 *   - EIP-5792 wallet support across Coinbase Wallet, MetaMask, Rainbow
 *   - ProtectedVault contract upgrade (if batch function approach is taken)
 */
export const ORCHESTRATION_BLOCKERS: BlockersAndRisks = {
  blockers: [
    "ProtectedVault contract needs internal deposit + lock for batch function (Option A)",
    "EIP-5792 wallet_sendCalls is not yet widely supported across wallet providers",
    "Sub-account spend permissions API is in developer preview",
  ],
  risks: [
    "release-and-reprotect atomicity: partial failure leaves capital unlocked",
    "Gas estimation accuracy decreases with batch size",
    "Sub-account execution introduces new attack surface if not tested thoroughly",
    "Contract upgrade required for Option A or B — audit timeline unknown",
  ],
  externalDependencies: [
    "@base-org/account SDK: monitor for spend permission API GA",
    "EIP-5792 wallet adoption: track Coinbase Wallet, MetaMask, Rainbow releases",
    "ProtectedVault audit: required before any contract changes",
  ],
};
