/**
 * execution-architecture.ts
 *
 * Phase 6.4D+ — Orchestration Architecture Map & Execution Decision Tree.
 *
 * ⚠ RESEARCH DOCUMENT — NOT PRODUCTION CODE ⚠
 *
 * Defines the transaction routing architecture for Elora's Base-native
 * orchestration layer. This is the structural blueprint that maps how
 * capabilities, batching strategies, fallback logic, and user confirmations
 * compose into executable flows.
 *
 * Architecture layers (bottom-up):
 *
 *   Layer 0: Wallet Connection       (RainbowKit + wagmi)
 *   Layer 1: Capability Detection    (use-wallet-capabilities.ts)
 *   Layer 2: Capability Routing      (useCapabilityRouting)
 *   Layer 3: Execution Planning      (this file — decision tree)
 *   Layer 4: Flow Execution           (tx-hooks, sub-account SDK)
 *   Layer 5: Confirmation UI         (modals, previews, fallback notes)
 */

import type { OrchestrationFlowId } from "./orchestration-flows";
import type { RoutingDecision } from "@/lib/web3/use-wallet-capabilities";

/* ════════════════════════════════════════════════════════════ */
/*  1. ARCHITECTURE MAP                                        */
/* ════════════════════════════════════════════════════════════ */

/**
 * Architectural layers of the orchestration system.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │   Layer 5: Confirmation UI                                  │
 * │   Single-with-preview | per-step | fallback-aware           │
 * ├─────────────────────────────────────────────────────────────┤
 * │   Layer 4: Flow Execution                                   │
 * │   wallet_sendCalls | multicall | sequential | sub-account   │
 * ├─────────────────────────────────────────────────────────────┤
 * │   Layer 3: Execution Planning (Decision Tree)               │
 * │   input: { flow, capabilities, routing }                    │
 * │   output: { strategy, steps, fallback, gas estimate }       │
 * ├─────────────────────────────────────────────────────────────┤
 * │   Layer 2: Capability Routing                               │
 * │   useCapabilityRouting() → RoutingDecision                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │   Layer 1: Capability Detection                             │
 * │   wallet_getCapabilities | wallet_sendCalls probe           │
 * │   wallet_getSubAccounts | connector introspection           │
 * ├─────────────────────────────────────────────────────────────┤
 * │   Layer 0: Wallet Connection                                │
 * │   RainbowKit → wagmi → EIP-1193 provider                   │
 * └─────────────────────────────────────────────────────────────┘
 */

export type ArchitectureLayer =
  | "layer-0-wallet"
  | "layer-1-detection"
  | "layer-2-routing"
  | "layer-3-planning"
  | "layer-4-execution"
  | "layer-5-ui";

export const ARCHITECTURE_LAYERS: Record<ArchitectureLayer, string> = {
  "layer-0-wallet": "Wallet Connection — RainbowKit + wagmi + EIP-1193 provider",
  "layer-1-detection": "Capability Detection — wallet_getCapabilities, wallet_sendCalls probe, wallet_getSubAccounts",
  "layer-2-routing": "Capability Routing — useCapabilityRouting() → execution tier selection",
  "layer-3-planning": "Execution Planning — decision tree, strategy selection, fallback determination",
  "layer-4-execution": "Flow Execution — sendCalls batch, multicall, sequential, sub-account route",
  "layer-5-ui": "Confirmation UI — preview modals, fallback notices, status tracking",
};

/* ════════════════════════════════════════════════════════════ */
/*  2. EXECUTION DECISION TREE                                 */
/* ════════════════════════════════════════════════════════════ */

/**
 * Possible execution strategies for a given flow.
 */
export type ExecutionStrategy =
  /** Use wallet_sendCalls (EIP-5792) for atomic batch execution */
  | "wallet-send-calls"
  /** Use contract-level multicall or batch function */
  | "contract-batch"
  /** Execute steps sequentially via individual wallet confirmations */
  | "sequential"
  /** Sub-account spend-permission batched execution */
  | "sub-account-batch"
  /** Sub-account sequential execution */
  | "sub-account-sequential";

/**
 * The decision node for a single orchestration flow.
 * Represents the result of the decision tree for that flow.
 */
export interface ExecutionPlan {
  /** The flow being planned */
  flowId: OrchestrationFlowId;
  /** The selected execution strategy */
  strategy: ExecutionStrategy;
  /** Whether this plan uses batching at any level */
  isBatched: boolean;
  /** Whether the user needs a fallback explanation */
  requiresFallbackNote: boolean;
  /** Human-readable explanation of why this strategy was chosen */
  rationale: string;
  /** Estimated gas savings vs naive sequential execution (0–100) */
  gasSavingsPercent: number;
}

/**
 * Execute the decision tree for a given flow and routing decision.
 *
 * Decision rules:
 *
 *   Step 1: Does the wallet support sendCalls?
 *     Yes → wallet-send-calls strategy (batched)
 *     No  → Step 2
 *
 *   Step 2: Does the wallet support atomicBatch?
 *     Yes → contract-batch strategy (requires vault multicall function)
 *     No  → Step 3
 *
 *   Step 3: Does the wallet have sub-account support?
 *     Yes → sub-account-batch (if spend permissions exist)
 *         → sub-account-sequential (if no spend permissions)
 *     No  → sequential
 */
export function planExecution(
  flowId: OrchestrationFlowId,
  routing: RoutingDecision,
  /** Whether the flow requires atomicity (e.g. release→reprotect) */
  requiresAtomicity: boolean,
): ExecutionPlan {
  // Default fallback: sequential
  let strategy: ExecutionStrategy = "sequential";
  let gasSavingsPercent = 0;
  let rationale = "";

  if (routing.usesSendCalls) {
    strategy = "wallet-send-calls";
    gasSavingsPercent = 40;
    rationale =
      "wallet_sendCalls (EIP-5792) is available. All steps are composed into a single " +
      "atomic batch. The wallet handles ordering and revert-on-failure.";
  } else if (routing.tier === "batched" && !routing.usesSendCalls) {
    strategy = "contract-batch";
    gasSavingsPercent = 30;
    rationale =
      "Atomic batch capability detected at the contract level. Requires a vault multicall " +
      "function or batch endpoint. Gas savings slightly lower than wallet-level batching.";
  } else if (routing.usesSubAccount) {
    strategy = "sub-account-sequential";
    gasSavingsPercent = 5;
    rationale =
      "Sub-account detected. Spend-permission batch execution is the future path, but " +
      "currently only sequential execution is supported. The sub-account provides " +
      "app-scoped isolation for all vault interactions.";
  } else {
    strategy = "sequential";
    gasSavingsPercent = 0;
    rationale =
      "No batching capabilities detected. Each step executes independently with separate " +
      "wallet confirmations.";
  }

  // Safety: if atomicity is required but we can't batch, warn
  const requiresFallbackNote = requiresAtomicity && !strategy.startsWith("wallet")
    && strategy !== "contract-batch";

  return {
    flowId,
    strategy,
    isBatched: strategy === "wallet-send-calls" || strategy === "contract-batch",
    requiresFallbackNote,
    rationale,
    gasSavingsPercent,
  };
}

/**
 * Full decision tree as a human-readable map.
 * Used for UI display in the settings orchestration section.
 */
export interface DecisionTreeNode {
  condition: string;
  result: string;
  children?: DecisionTreeNode[];
}

export const EXECUTION_DECISION_TREE: DecisionTreeNode = {
  condition: "Flow requested",
  result: "Begin capability routing",
  children: [
    {
      condition: "wallet_sendCalls supported?",
      result: "YES → Atomic batch via wallet (EIP-5792). Single confirmation. ~40% gas savings.",
      children: [
        {
          condition: "With sub-account?",
          result: "Route through sub-account for isolation + future spend permissions.",
        },
      ],
    },
    {
      condition: "wallet_sendCalls NOT supported → atomicBatch capability?",
      result: "YES → Contract-level batching. Requires vault multicall function. ~30% gas savings.",
    },
    {
      condition: "Neither sendCalls nor atomicBatch → sub-account exists?",
      result: "YES → Sub-account sequential execution. App isolation without batching. Spend permissions needed for batch future.",
    },
    {
      condition: "No Base-native capabilities detected",
      result: "Sequential execution. Standard wallet confirmations per step. No gas savings.",
    },
  ],
};

/* ════════════════════════════════════════════════════════════ */
/*  3. ROUTING ARCHITECTURE                                    */
/* ════════════════════════════════════════════════════════════ */

/**
 * Transaction routing architecture.
 *
 * This describes how a transaction enters the system and flows through
 * the routing layer to determine the execution path.
 *
 * ┌─────────┐     ┌──────────────┐     ┌──────────────────┐
 * │  User   │────→│  Capability  │────→│  Execution       │
 * │ Action  │     │  Detection   │     │  Routing         │
 * └─────────┘     └──────────────┘     └──────────────────┘
 *                                             │
 *                    ┌────────────────────────┼────────────────────────┐
 *                    ▼                        ▼                        ▼
 *             ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
 *             │  sendCalls   │        │  Contract    │        │  Sequential  │
 *             │  Batch       │        │  Batch       │        │  Fallback    │
 *             └──────────────┘        └──────────────┘        └──────────────┘
 *                    │                        │                        │
 *                    ▼                        ▼                        ▼
 *             ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
 *             │  1 wallet    │        │  1 tx (multi)│        │  N wallet    │
 *             │  confirm     │        │  1 confirm   │        │  confirms    │
 *             └──────────────┘        └──────────────┘        └──────────────┘
 */

export interface RoutingArchitecture {
  /** How the routing tier selects the execution path */
  selectionLogic: string;
  /** What happens when the primary path is unavailable */
  fallbackChain: string[];
  /** Where transaction calldata originates */
  calldataSource: string;
  /** How the user confirms the action */
  confirmationPath: string;
}

export const ROUTING_ARCHITECTURE: RoutingArchitecture = {
  selectionLogic:
    "The capability routing layer (useCapabilityRouting) evaluates detected capabilities " +
    "in priority order: sendCalls > atomicBatch > sub-account > sequential. " +
    "The first matching tier becomes the execution path for the flow.",
  fallbackChain: [
    "1. wallet_sendCalls → contract-batch (if atomicBatch available)",
    "2. contract-batch → sub-account sequential (if sub-account exists)",
    "3. sub-account sequential → external wallet sequential (no Base features)",
    "4. All paths eventually resolve to sequential execution as the guaranteed fallback",
  ],
  calldataSource:
    "Calldata for each step is produced by the existing wagmi hooks " +
    "(useVaultDeposit, useCreateLock, useReleaseLock, etc.) via writeContract. " +
    "The orchestration layer composes calldata into a batch without changing " +
    "the hook internals.",
  confirmationPath:
    "batched: single confirmation with step preview → wallet popup → submit batch. " +
    "sequential: step 1 confirmation → wallet popup → step 2 confirmation → wallet popup. " +
    "The UI always shows the full step plan before the first confirmation.",
};

/* ════════════════════════════════════════════════════════════ */
/*  4. EXECUTION SEQUENCING                                    */
/* ════════════════════════════════════════════════════════════ */

/**
 * Execution sequencing model.
 * Defines the ordering and dependency constraints for multi-step flows.
 */
export interface ExecutionSequence {
  flowId: OrchestrationFlowId;
  /** Ordered list of step identifiers */
  steps: string[];
  /** Whether the steps must execute atomically (all-or-nothing) */
  atomic: boolean;
  /** What to do if a step fails in the middle */
  onFailure: "revert-all" | "continue-next" | "prompt-user";
  /** Whether the user can pause between steps (only in sequential mode) */
  userCanPause: boolean;
}

export const EXECUTION_SEQUENCES: Record<OrchestrationFlowId, ExecutionSequence> = {
  "deposit-and-protect": {
    flowId: "deposit-and-protect",
    steps: ["approve-usdc", "deposit", "create-lock"],
    atomic: true,
    onFailure: "revert-all",
    userCanPause: false,
  },
  "release-and-reprotect": {
    flowId: "release-and-reprotect",
    steps: ["release-lock", "create-lock"],
    atomic: true,
    onFailure: "revert-all",
    userCanPause: false,
  },
  "settle-and-protect": {
    flowId: "settle-and-protect",
    steps: ["settle-prediction", "create-lock"],
    atomic: false,
    onFailure: "continue-next",
    userCanPause: true,
  },
  "withdraw-and-deposit": {
    flowId: "withdraw-and-deposit",
    steps: ["withdraw-unlocked", "deposit"],
    atomic: true,
    onFailure: "revert-all",
    userCanPause: false,
  },
};
