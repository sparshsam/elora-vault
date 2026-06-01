/**
 * sub-account-lifecycle.ts
 *
 * Phase 6.4D+ — Elora Sub-Account Lifecycle Proposal.
 *
 * ⚠ RESEARCH DOCUMENT — NOT PRODUCTION CODE ⚠
 *
 * Defines the complete lifecycle for Elora-specific Base Account sub-accounts:
 * creation, spend-permission boundaries, app isolation, and future
 * orchestration paths.
 *
 * ## Account Separation Model
 *
 *   Universal Account (user's primary wallet / EOA)
 *     │
 *     ├── Elora Sub Account (app-domain, behavioral vault)
 *     │     ├── Vault deposits & withdrawals
 *     │     ├── Lock creation & release
 *     │     └── Future: prediction settlement
 *     │
 *     └── [Other apps' sub-accounts] (isolated)
 *
 * The Elora Sub Account is:
 *   - Domain-bound: created for app.elora-vault.vercel.app
 *   - Key-derived: from the user's universal account key
 *   - Non-custodial: Elora never holds private keys
 *   - Optional: everything works without one
 */

import type { Address } from "viem";

/* ════════════════════════════════════════════════════════════ */
/*  1. LIFECYCLE STATES                                        */
/* ════════════════════════════════════════════════════════════ */

/**
 * All possible states of an Elora sub-account.
 */
export type SubAccountLifecycleState =
  /** No sub-account exists and user hasn't been offered one */
  | "unavailable"
  /** User is aware but hasn't created one */
  | "not-created"
  /** User has been prompted, considering creation */
  | "pending-creation"
  /** Sub-account is being created (wallet confirmation in progress) */
  | "creating"
  /** Sub-account exists but has no spend permissions configured */
  | "active-no-spend"
  /** Sub-account exists with spend permissions configured */
  | "active-with-spend"
  /** Sub-account has been removed by user */
  | "removed"
  /** Creation failed (user rejected, RPC error, etc.) */
  | "creation-failed";

/**
 * Human-readable labels for each lifecycle state.
 */
export const SUB_ACCOUNT_STATE_LABELS: Record<SubAccountLifecycleState, string> = {
  unavailable: "Not available",
  "not-created": "Not created",
  "pending-creation": "Pending creation",
  creating: "Creating…",
  "active-no-spend": "Active (no spend permissions)",
  "active-with-spend": "Active (spend permissions set)",
  removed: "Removed",
  "creation-failed": "Creation failed",
};

/**
 * Full lifecycle state model.
 */
export interface SubAccountLifecycle {
  state: SubAccountLifecycleState;
  /** Sub-account address (if created) */
  address: Address | null;
  /** Whether the sub-account is bound to the Elora app domain */
  isDomainBound: boolean;
  /** Timestamp of creation (if created) */
  createdAt: number | null;
  /** Current spend permission config */
  spendPermission: SpendPermissionConfig | null;
  /** Whether batch execution is available on this sub-account */
  batchExecutionAvailable: boolean;
}

/* ════════════════════════════════════════════════════════════ */
/*  2. SPEND PERMISSION BOUNDARIES                             */
/* ════════════════════════════════════════════════════════════ */

/**
 * Spend permission configuration for the Elora sub-account.
 *
 * A spend permission allows the Elora sub-account to spend a limited
 * amount of USDC from the universal account without per-transaction
 * approvals. This is the key enabler for batch execution.
 */
export interface SpendPermissionConfig {
  /** USDC token address on Base */
  token: Address;
  /** Maximum total allowance */
  maxAllowance: bigint;
  /** Per-transaction cap (prevents single-tx drain) */
  perTxCap: bigint;
  /** Whether the permission auto-renews weekly/monthly */
  renewalPeriod: "none" | "weekly" | "monthly";
  /** Addresses the sub-account is allowed to call */
  allowedTargets: Address[];
  /** Specific function selectors allowed on each target */
  allowedSelectors: Record<string, `0x${string}`[]>;
}

/**
 * Default allowed targets for the Elora sub-account.
 * These are the only contracts the sub-account can interact with.
 */

// Placeholder addresses — populated at the contract upgrade phase
export const ELORA_ALLOWED_TARGETS: Address[] = [
  "0x0000000000000000000000000000000000000001" as Address, // ProtectedVault
  "0x0000000000000000000000000000000000000002" as Address, // USDC
];

/**
 * Function selectors the sub-account is allowed to call per target.
 *
 * This is the authorization matrix: each contract → allowed functions.
 * Everything else is rejected at the sub-account level.
 */
export const ELORA_ALLOWED_SELECTORS: Record<string, `0x${string}`[]> = {
  // ProtectedVault selectors
  "0x0000000000000000000000000000000000000001": [
    "0xd0e30db0", // deposit(uint256)
    "0x4c223b46", // createLock(uint256,uint256)
    "0x7b17050c", // releaseLock(uint256)
    "0x5e280c7d", // withdrawUnlocked()
    "0xf1dcf556", // withdrawLock(uint256)
  ],
  // USDC selectors (approve only, no transfers)
  "0x0000000000000000000000000000000000000002": [
    "0x095ea7b3", // approve(address,uint256)
  ],
};

/**
 * Boundary rules for spend permissions.
 *
 *   - Max allowance: user-defined cap, defaults to $1,000 USDC
 *   - Per-transaction cap: 20% of max allowance, prevents drain
 *   - Allowed targets: ONLY the ProtectedVault and USDC contracts
 *   - Allowed functions: ONLY deposit, createLock, releaseLock,
 *     withdrawUnlocked, withdrawLock, approve
 *   - No transferFrom: the sub-account cannot move arbitrary tokens
 *   - No delegatecall: the sub-account cannot execute arbitrary code
 *   - Renewal: optional weekly/monthly auto-top-up of allowance
 */
export const SPEND_PERMISSION_BOUNDARIES = {
  maxAllowanceDefault: "1000", // USDC
  perTxCapRatio: 0.2, // 20% of max allowance
  allowedTargetCount: 2, // vault + USDC only
  noTransferFrom: true,
  noDelegateCall: true,
  renewalOptions: ["none", "weekly", "monthly"] as const,
  revocationMethod: "user-initiated-only",
} as const;

/* ════════════════════════════════════════════════════════════ */
/*  3. UNIVERSAL VS APP ACCOUNT SEPARATION                     */
/* ════════════════════════════════════════════════════════════ */

/**
 * Separation model between the user's universal account and the
 * Elora sub-account.
 */
export interface AccountSeparationModel {
  /** Which account owns the vault's deposited USDC */
  vaultOwnership: "sub-account" | "universal";
  /** Which account signs vault transactions */
  transactionSigner: "universal" | "sub-account";
  /** Which account pays gas */
  gasPayer: "universal" | "sub-account" | "paymaster";
  /** Whether the sub-account has its own USDC balance */
  subAccountHasBalance: boolean;
  /** Whether the sub-account can hold USDC */
  subAccountCanHoldUSDC: boolean;
}

/**
 * Current and target separation models.
 */
export const ACCOUNT_SEPARATION: {
  current: AccountSeparationModel;
  phaseA: AccountSeparationModel;
  phaseB: AccountSeparationModel;
} = {
  // Current: no sub-account, everything through universal wallet
  current: {
    vaultOwnership: "universal",
    transactionSigner: "universal",
    gasPayer: "universal",
    subAccountHasBalance: false,
    subAccountCanHoldUSDC: false,
  },
  // Phase A: sub-account created, spend permissions set, vault still on universal
  phaseA: {
    vaultOwnership: "universal", // vault stays on universal initially
    transactionSigner: "sub-account", // sub-account signs on user's behalf
    gasPayer: "universal", // user still pays gas
    subAccountHasBalance: false,
    subAccountCanHoldUSDC: false,
  },
  // Phase B: sub-account is the primary vault execution account
  phaseB: {
    vaultOwnership: "sub-account", // vault recognized as sub-account's
    transactionSigner: "sub-account",
    gasPayer: "paymaster", // optional gas sponsorship
    subAccountHasBalance: true,
    subAccountCanHoldUSDC: true,
  },
};

/* ════════════════════════════════════════════════════════════ */
/*  4. ORCHESTRATION PATHS                                     */
/* ════════════════════════════════════════════════════════════ */

/**
 * Future orchestration paths enabled by sub-account execution.
 */
export interface SubAccountOrchestrationPath {
  /** Path identifier */
  id: string;
  /** What this path enables */
  description: string;
  /** Prerequisites needed */
  prerequisites: string[];
  /** Whether user action is required to enable */
  requiresUserAction: boolean;
  /** Risk level */
  riskLevel: "low" | "medium" | "high";
}

export const SUB_ACCOUNT_ORCHESTRATION_PATHS: SubAccountOrchestrationPath[] = [
  {
    id: "approve-free-deposits",
    description:
      "With pre-approved spend permissions, the approve step is eliminated " +
      "from every deposit. Deposit becomes a single call instead of approve→deposit.",
    prerequisites: [
      "Sub-account created",
      "Spend permission configured with vault contract",
      "Sufficient allowance remaining",
    ],
    requiresUserAction: true,
    riskLevel: "low",
  },
  {
    id: "batch-execution",
    description:
      "Sub-account executeBatch() sends multiple vault calls in one transaction. " +
      "Deposit+protect becomes one confirmation. Release+reprotect becomes atomic.",
    prerequisites: [
      "Sub-account created",
      "Spend permissions configured",
      "Vault supports batch calls or wallet_sendCalls available",
    ],
    requiresUserAction: false,
    riskLevel: "medium",
  },
  {
    id: "gas-sponsored-execution",
    description:
      "Paymaster on the sub-account covers gas for vault operations. " +
      "User pays no gas for deposit, protect, release, or withdraw.",
    prerequisites: [
      "Sub-account created",
      "Gas sponsorship configured on sub-account",
      "Paymaster endpoint operational",
    ],
    requiresUserAction: false,
    riskLevel: "medium",
  },
  {
    id: "recurring-protection",
    description:
      "Time-based trigger: when a lock expires, automatically release and " +
      "re-create with the same duration. Capital stays continuously protected.",
    prerequisites: [
      "Sub-account created",
      "Spend permissions configured",
      "Cron or keeper infrastructure for trigger",
    ],
    requiresUserAction: true,
    riskLevel: "high",
  },
];

/* ════════════════════════════════════════════════════════════ */
/*  5. LIFECYCLE TRANSITIONS                                   */
/* ════════════════════════════════════════════════════════════ */

/**
 * State transition map for the sub-account lifecycle.
 * Documents valid transitions between states.
 */
export const SUB_ACCOUNT_LIFECYCLE_TRANSITIONS: Record<
  SubAccountLifecycleState,
  SubAccountLifecycleState[]
> = {
  unavailable: ["not-created"],
  "not-created": ["pending-creation", "creating", "unavailable"],
  "pending-creation": ["creating", "not-created"],
  creating: ["active-no-spend", "creation-failed"],
  "active-no-spend": ["active-with-spend", "removed"],
  "active-with-spend": ["removed", "active-no-spend"],
  removed: ["not-created"],
  "creation-failed": ["not-created", "creating"],
};
