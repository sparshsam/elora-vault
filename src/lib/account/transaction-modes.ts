/**
 * transaction-modes.ts — Transaction execution mode research.
 *
 * This module documents the transaction execution modes available to
 * Elora for future onchain operations. It is **research-only** and
 * contains NO production integration.
 *
 * ── Purpose ────────────────────────────────────────────
 * As Elora moves toward Base-native account infrastructure, the
 * transaction execution layer will evolve from simple `eth_sendTransaction`
 * calls to richer modes that leverage EIP-5792 (sendCalls), paymaster
 * sponsorship (ERC-7677), and sub-account execution (ERC-7895).
 *
 * This file captures each mode, its requirements, and when it would
 * be appropriate to use. No mode is wired into the production
 * transaction pipeline yet.
 *
 * ── Reference ──────────────────────────────────────────
 * - EIP-5792: wallet_sendCalls / wallet_getCapabilities
 * - EIP-7702: EOA transaction batching
 * - ERC-7677: Paymaster sponsorship
 * - ERC-7895: Sub-account management (Base)
 * - Base Account SDK: @base-org/account
 */

/* ── Execution mode identifiers ─────────────────────── */

/**
 * The set of transaction execution modes Elora may support.
 *
 * direct-wallet:    Standard eth_sendTransaction via connected wallet.
 *                   Current production mode. No abstraction.
 *
 * send-calls:       EIP-5792 wallet_sendCalls. Atomic batch execution.
 *                   Supported by Coinbase Smart Wallet, Base Account,
 *                   and other EIP-5792-compatible wallets.
 *
 * batched:          Multi-call transactions via contract aggregation
 *                   (e.g., Multicall3). Useful when the wallet does not
 *                   support native sendCalls but batch execution is
 *                   still desirable at the contract layer.
 *
 * sponsored:        Paymaster-sponsored transactions (ERC-7677).
 *                   The user signs and the paymaster covers gas.
 *                   Critical for gasless protection flows.
 *
 * sub-account:      Execution through an ERC-7895 sub-account.
 *                   Transactions originate from the app-scoped account
 *                   rather than the user's universal address.
 */
export type TransactionMode =
  | "direct-wallet"
  | "send-calls"
  | "batched"
  | "sponsored"
  | "sub-account";

/* ── Mode definitions (research) ────────────────────── */

export interface TransactionModeInfo {
  mode: TransactionMode;
  label: string;
  description: string;
  /** The underlying RPC method or mechanism */
  mechanism: string;
  /** Whether the wallet must support EIP-5792 capabilities */
  requiresEip5792: boolean;
  /** Whether a Base Account SDK provider is required */
  requiresBaseAccount: boolean;
  /** Whether a paymaster endpoint must be configured */
  requiresPaymaster: boolean;
  /** Whether a sub-account must exist */
  requiresSubAccount: boolean;
  /** Whether multiple operations can be bundled into one execution */
  supportsBatching: boolean;
  /** Whether gas costs are covered by a sponsor */
  isSponsored: boolean;
  /** Whether the user sees a wallet prompt */
  requiresUserPrompt: boolean;
  /** Suitability notes for Elora's capital flows */
  notes: string;
  /** Use cases within Elora where this mode would apply */
  useCases: string[];
}

/**
 * Research definitions for each transaction mode.
 *
 * These are reference entries for architecture planning. They
 * document what each mode requires and when it would be used,
 * but they are NOT wired into any execution path.
 *
 * ── DO NOT ─────────────────────────────────────────────
 * - Do not import these in production transaction code
 * - Do not use for routing deposit/protect/release flows
 * - Do not replace existing wagmi writeContract calls with these
 */
export const TRANSACTION_MODES: Record<TransactionMode, TransactionModeInfo> =
  {
    "direct-wallet": {
      mode: "direct-wallet",
      label: "Direct Wallet",
      description:
        "Standard transaction submission via eth_sendTransaction. The user's wallet prompts for confirmation for each individual operation.",
      mechanism: "eth_sendTransaction (wagmi writeContract)",
      requiresEip5792: false,
      requiresBaseAccount: false,
      requiresPaymaster: false,
      requiresSubAccount: false,
      supportsBatching: false,
      isSponsored: false,
      requiresUserPrompt: true,
      notes:
        "Current production mode. Works with all wallets. Simple but produces wallet fatigue during multi-step flows (approve → deposit → protect).",
      useCases: [
        "Current deposit flow",
        "Current protect (createLock) flow",
        "Current release (releaseLock) flow",
        "Current withdraw flow",
      ],
    },
    "send-calls": {
      mode: "send-calls",
      label: "Send Calls (EIP-5792)",
      description:
        "Atomic batch execution via wallet_sendCalls. Multiple operations bundled into one RPC call and confirmed once by the user.",
      mechanism: "wallet_sendCalls (wagmi useSendCalls)",
      requiresEip5792: true,
      requiresBaseAccount: false,
      requiresPaymaster: false,
      requiresSubAccount: false,
      supportsBatching: true,
      isSponsored: false,
      requiresUserPrompt: true,
      notes:
        "Only one wallet prompt for the entire batch. Ideal for approve+deposit or deposit+protect sequences. Supported by Coinbase Smart Wallet and other EIP-5792 wallets.",
      useCases: [
        "Approve USDC + deposit into vault (one prompt)",
        "Deposit + createLock (deposit and protect in one step)",
        "Batch horizon rebalancing",
      ],
    },
    batched: {
      mode: "batched",
      label: "Contract Batch (Multicall3)",
      description:
        "Multi-call aggregation at the contract layer using Multicall3 or similar. Individual transactions are bundled off-chain and executed in one onchain call.",
      mechanism:
        "Multicall3.aggregate (contract-level batching via wagmi writeContract)",
      requiresEip5792: false,
      requiresBaseAccount: false,
      requiresPaymaster: false,
      requiresSubAccount: false,
      supportsBatching: true,
      isSponsored: false,
      requiresUserPrompt: true,
      notes:
        "Fallback when the wallet does not support native sendCalls but batching is still desired. Requires the vault contract or a middleware contract to support delegate calls.",
      useCases: [
        "Fallback batching when sendCalls unavailable",
        "Multi-step vault operations through a router contract",
      ],
    },
    sponsored: {
      mode: "sponsored",
      label: "Sponsored (Paymaster)",
      description:
        "Paymaster-sponsored transactions via ERC-7677. The user signs the transaction and a paymaster covers the gas cost. The wallet must signal paymaster capability in wallet_getCapabilities.",
      mechanism:
        "wallet_sendCalls with paymasterService context (ERC-7677)",
      requiresEip5792: true,
      requiresBaseAccount: false,
      requiresPaymaster: true,
      requiresSubAccount: false,
      supportsBatching: true,
      isSponsored: true,
      requiresUserPrompt: true,
      notes:
        "Critical for reducing friction in protection flows. Users protect capital without spending ETH on gas. Requires a configured paymaster endpoint and sufficient paymaster budget.",
      useCases: [
        "Gasless capital protection (createLock)",
        "Gasless prediction settlement",
        "Gasless horizon release",
        "Low-value operations where gas would be disproportionate",
      ],
    },
    "sub-account": {
      mode: "sub-account",
      label: "Sub Account Execution (ERC-7895)",
      description:
        "Transaction execution through an ERC-7895 sub-account. Operations originate from the app-scoped sub-account rather than the user's universal address, enabling app-specific signing and session keys.",
      mechanism:
        "Base Account SDK sub-account provider (wallet_sendCalls from sub-account context)",
      requiresEip5792: true,
      requiresBaseAccount: true,
      requiresPaymaster: false,
      requiresSubAccount: true,
      supportsBatching: true,
      isSponsored: false,
      requiresUserPrompt: false,
      notes:
        "The most Elora-native mode. Capital lives in the app sub-account. Operations can be pre-approved via session keys, eliminating wallet prompts for routine flows. Self-custody is preserved because the sub-account is derived from the user's universal account.",
      useCases: [
        "Protected capital held in Elora Sub Account",
        "Session-key-based protection without wallet prompts",
        "App-scoped deposit and protection flows",
        "Capital rebalancing within the app context",
      ],
    },
  };

/**
 * Get the default transaction mode based on available capabilities.
 *
 * This is a research helper, NOT production routing logic.
 * It illustrates how mode selection COULD work once capabilities
 * are integrated into the execution pipeline.
 */
export function suggestTransactionMode(
  capabilities: {
    supportsBatching: boolean;
    supportsPaymaster: boolean;
    supportsBaseAccount: boolean;
    supportsSubAccounts: boolean;
  },
): TransactionMode {
  /* Research only — do not use for production routing. */
  if (capabilities.supportsSubAccounts && capabilities.supportsPaymaster) {
    return "sub-account";
  }
  if (capabilities.supportsBatching && capabilities.supportsPaymaster) {
    return "sponsored";
  }
  if (capabilities.supportsBatching) {
    return "send-calls";
  }
  return "direct-wallet";
}
