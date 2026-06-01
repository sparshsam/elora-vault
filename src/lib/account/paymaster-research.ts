/**
 * paymaster-research.ts
 *
 * Phase 6.4D+ — Gas Sponsorship & Paymaster Research.
 *
 * ⚠ RESEARCH DOCUMENT — NOT PRODUCTION CODE ⚠
 *
 * Documents how Elora could sponsor gas for vault operations through a
 * paymaster, including sponsorship boundaries, abuse prevention, trust
 * assumptions, and future UX improvements.
 *
 * ## Why sponsor gas?
 *
 * Gas costs on Base are low (fractions of a cent), but the UX friction
 * of "you need ETH for gas" is a real barrier. Sponsoring gas for vault
 * operations (deposit, protect, release, withdraw) removes one more
 * hurdle and makes Elora feel like a calm utility rather than a
 * crypto application.
 *
 * ## When NOT to sponsor
 *
 * Gas sponsorship introduces:
 *   - Trust assumptions (sponsor can censor transactions)
 *   - Abuse surface (users can drain the paymaster)
 *   - Ongoing cost to the application
 *
 * These must be carefully bounded.
 */

/* ════════════════════════════════════════════════════════════ */
/*  1. SPONSORSHIP BOUNDARIES                                  */
/* ════════════════════════════════════════════════════════════ */

/**
 * What operations should be gas-sponsorable.
 */
export type SponsorshipScope =
  /** All vault operations: deposit, protect, release, withdraw */
  | "all-vault-operations"
  /** Only write-intensive operations: protect, release, batch */
  | "write-only"
  /** Only user-facing vault actions (not internal/batch) */
  | "user-facing-only"
  /** No sponsorship (user always pays) */
  | "none";

/**
 * Per-user sponsorship budget.
 */
export interface SponsorshipBudget {
  /** Maximum total gas value the app will sponsor per user */
  maxPerUser: string; // in USD or native token
  /** Maximum per-transaction sponsorship value */
  maxPerTx: string;
  /** How often the budget resets */
  resetPeriod: "none" | "daily" | "weekly" | "monthly";
  /** Whether unspent budget carries over */
  carryOver: boolean;
}

/**
 * Sponsorship boundaries configuration.
 */
export interface PaymasterBoundaries {
  /** What operations are sponsored */
  scope: SponsorshipScope;
  /** Per-user budget */
  budget: SponsorshipBudget;
  /** Minimum account age before sponsorship activates (anti-sybil) */
  minAccountAgeDays: number;
  /** Whether sponsorship requires a sub-account */
  requiresSubAccount: boolean;
  /** Maximum gas price the paymaster will accept (prevent MEV abuse) */
  maxGasPriceGwei: number;
}

/**
 * Recommended sponsorship boundaries for Elora.
 *
 * Rationale:
 *   - scope: user-facing-only — batch/internal operations shouldn't be
 *     sponsored to prevent users from spamming the paymaster
 *   - maxPerUser: $5 — enough for hundreds of vault operations on Base
 *   - maxPerTx: $0.05 — a single vault call costs ~$0.005 on Base,
 *     so $0.05 covers 10+ operations in a batch
 *   - minAccountAgeDays: 7 — prevents sybil creation for paymaster drain
 *   - maxGasPriceGwei: 20 — Base rarely exceeds 1 gwei, 20 is a safety ceiling
 */
export const RECOMMENDED_PAYMASTER_BOUNDARIES: PaymasterBoundaries = {
  scope: "user-facing-only",
  budget: {
    maxPerUser: "5.00", // $5 USD worth of gas
    maxPerTx: "0.05",   // $0.05 per transaction
    resetPeriod: "monthly",
    carryOver: false,
  },
  minAccountAgeDays: 7,
  requiresSubAccount: false, // optional: sub-account makes rate-limiting easier
  maxGasPriceGwei: 20,
};

/* ════════════════════════════════════════════════════════════ */
/*  2. ABUSE PREVENTION                                        */
/* ════════════════════════════════════════════════════════════ */

export interface AbusePreventionMechanism {
  /** What this mechanism prevents */
  threat: string;
  /** How it works */
  mitigation: string;
  /** Impact on legitimate users */
  userImpact: "none" | "low" | "medium";
  /** Whether it can be bypassed */
  bypassable: boolean;
}

/**
 * Abuse prevention mechanisms ranked by priority.
 */
export const ABUSE_PREVENTION_MEASURES: AbusePreventionMechanism[] = [
  {
    threat: "Sybil accounts draining paymaster budget",
    mitigation:
      "Gate sponsorship on account age (7+ days) and cumulative activity " +
      "(at least 1 deposit or protect action). New accounts pay their own gas.",
    userImpact: "low",
    bypassable: false,
  },
  {
    threat: "Users spamming vault operations to drain budget",
    mitigation:
      "Per-user and per-transaction caps. Monthly reset prevents accumulation. " +
      "Rate-limit: max 10 sponsored operations per hour per user.",
    userImpact: "low",
    bypassable: false,
  },
  {
    threat: "MEV bots front-running sponsored transactions",
    mitigation:
      "Max gas price cap (20 gwei) prevents high-priority MEV extraction. " +
      "Paymaster only pays up to the cap; anything above is user-funded.",
    userImpact: "none",
    bypassable: true,
  },
  {
    threat: "Users routing non-Elora calls through the paymaster",
    mitigation:
      "Paymaster verifies calldata targets are only the vault contract. " +
      "Any call to a non-allowlisted address is rejected at the paymaster level.",
    userImpact: "none",
    bypassable: false,
  },
];

/* ════════════════════════════════════════════════════════════ */
/*  3. TRUST ASSUMPTIONS                                       */
/* ════════════════════════════════════════════════════════════ */

export interface TrustAssumption {
  assumption: string;
  /** Who must be trusted */
  trustedParty: string;
  /** What happens if trust is violated */
  failureMode: string;
  /** Whether the user can opt out */
  canOptOut: boolean;
  /** Whether this assumption is acceptable for a non-custodial app */
  acceptableForNonCustodial: boolean;
}

/**
 * Trust assumptions for paymaster-sponsored transactions.
 *
 * Key principle: Elora should remain non-custodial. Paymaster sponsorship
 * introduces a trusted third party (the paymaster operator) that can
 * censor or delay transactions. Users must be able to opt out and pay
 * their own gas at any time.
 */
export const PAYMASTER_TRUST_ASSUMPTIONS: TrustAssumption[] = [
  {
    assumption: "Paymaster operator will not censor valid vault operations",
    trustedParty: "Paymaster operator (app or third party)",
    failureMode: "User cannot deposit, protect, release, or withdraw",
    canOptOut: true,
    acceptableForNonCustodial: true,
  },
  {
    assumption: "Paymaster will not overcharge for gas",
    trustedParty: "Paymaster operator",
    failureMode: "User's sponsorship budget is consumed faster than expected",
    canOptOut: true,
    acceptableForNonCustodial: true,
  },
  {
    assumption: "Paymaster backend is available when needed",
    trustedParty: "App infrastructure",
    failureMode: "Sponsored transactions fail; user must retry or pay own gas",
    canOptOut: true,
    acceptableForNonCustodial: true,
  },
  {
    assumption: "Paymaster will not relay invalid transactions",
    trustedParty: "Smart contract verification + paymaster logic",
    failureMode: "Invalid state transitions if verification is bypassed",
    canOptOut: true,
    acceptableForNonCustodial: false, // must be technically enforced, not trusted
  },
];

/* ════════════════════════════════════════════════════════════ */
/*  4. IMPLEMENTATION APPROACHES                               */
/* ════════════════════════════════════════════════════════════ */

export type PaymasterApproach =
  /** ERC-4337 account abstraction paymaster */
  | "erc-4337"
  /** Base-native paymaster via @base-org/account SDK */
  | "base-native-paymaster"
  /** Custom relay server */
  | "custom-relay"
  /** No paymaster — user always pays */
  | "none";

export interface PaymasterOption {
  approach: PaymasterApproach;
  description: string;
  complexity: "low" | "medium" | "high";
  trustModel: "trusted" | "trustless" | "semi-trusted";
  /** Whether this works without smart contract wallets */
  requiresSmartWallet: boolean;
  /** Whether this works with Base Account sub-accounts */
  worksWithBaseAccount: boolean;
  /** Estimated cost to operate (per 10k tx) */
  estimatedMonthlyCost: string;
}

/**
 * Paymaster implementation options ranked by suitability.
 */
export const PAYMASTER_OPTIONS: PaymasterOption[] = [
  {
    approach: "base-native-paymaster",
    description:
      "Use @base-org/account SDK's built-in paymaster support. " +
      "Sub-account transactions can be routed through Base's sponsored gas " +
      "infrastructure. Lowest integration effort if Base Account is already in use.",
    complexity: "low",
    trustModel: "semi-trusted",
    requiresSmartWallet: false,
    worksWithBaseAccount: true,
    estimatedMonthlyCost: "$5–20",
  },
  {
    approach: "erc-4337",
    description:
      "Full ERC-4337 account abstraction with a user operation bundler " +
      "and paymaster contract. Most flexible but highest complexity. " +
      "Requires smart contract wallet deployment for each user.",
    complexity: "high",
    trustModel: "trustless",
    requiresSmartWallet: true,
    worksWithBaseAccount: false,
    estimatedMonthlyCost: "$10–50",
  },
  {
    approach: "custom-relay",
    description:
      "Custom relay server that wraps vault calls with gas payment. " +
      "App sends a signed meta-transaction, relay sends it onchain and pays gas. " +
      "No smart wallet required but introduces a centralized relay operator.",
    complexity: "medium",
    trustModel: "trusted",
    requiresSmartWallet: false,
    worksWithBaseAccount: false,
    estimatedMonthlyCost: "$5–30",
  },
];

/**
 * Recommended approach: base-native-paymaster.
 *
 * Rationale:
 *   - Lowest integration effort (leverages existing @base-org/account SDK)
 *   - Works with sub-accounts which are the future execution path
 *   - Semi-trusted model is acceptable for a non-financial discipline app
 *   - Can be combined with ERC-4337 later if needed
 *   - Starting with $5/month budget for beta users is sustainable
 */

/* ════════════════════════════════════════════════════════════ */
/*  5. FUTURE UX IMPROVEMENTS                                  */
/* ════════════════════════════════════════════════════════════ */

export interface GasSponsorshipUXImprovement {
  improvement: string;
  description: string;
  prerequisite: string;
}

export const GAS_SPONSORSHIP_UX_IMPROVEMENTS: GasSponsorshipUXImprovement[] = [
  {
    improvement: "Silent execution",
    description:
      "Gas sponsorship removes the 'need ETH for gas' barrier. " +
      "Users never see gas prices, transaction fees, or native token " +
      "balances. The app feels like a web2 utility.",
    prerequisite: "Paymaster operational with Base Account",
  },
  {
    improvement: "One-tap vault operations",
    description:
      "With sponsorship + sub-account spend permissions + batch execution, " +
      "deposit+protect becomes a single tap without any wallet popups. " +
      "The user sees one confirmation and capital is moved atomically.",
    prerequisite: "Paymaster + sub-account + batch execution",
  },
  {
    improvement: "Zero-balance onboarding",
    description:
      "New users can deposit and protect capital without holding ETH " +
      "for gas. They only need USDC in their wallet. The paymaster covers " +
      "the first N operations.",
    prerequisite: "Paymaster operational + sub-account creation flow",
  },
  {
    improvement: "Sponsored lock rollover",
    description:
      "When a protection lock expires, the system can automatically " +
      "release and re-lock (with user consent) without the user needing " +
      "ETH. The paymaster covers the rollover gas cost.",
    prerequisite: "Paymaster + cron trigger + user consent flow",
  },
];
