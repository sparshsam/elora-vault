/**
 * account-strategy.ts — Account mode strategy types for Elora.
 *
 * This module defines the account strategy model for Elora's future
 * multi-account architecture. It is **architecture preparation only**.
 * No production wallet flows depend on the future strategy types yet.
 *
 * ── Current state ──────────────────────────────────────
 * - external-wallet (via RainbowKit + wagmi) is the active account mode.
 * - base-account (via @base-org/account SDK) is in lab testing only.
 *
 * ── Future architecture ────────────────────────────────
 * Elora will support three account modes:
 *
 * 1. External Wallet (active now)
 *    Standard EOA or smart wallet connected via RainbowKit.
 *    All vault operations (deposit, protect, release, withdraw)
 *    flow through the user's external wallet.
 *
 * 2. Universal Base Account (future)
 *    A Base Account connected via @base-org/account SDK.
 *    The universal account owns the Elora Sub Account and provides
 *    the root signing key. Wallet operations feel calmer because
 *    the SDK handles session management and account abstraction.
 *
 * 3. Elora Sub Account (future)
 *    An app-specific sub-account derived from the Universal Base
 *    Account. Protected capital would live inside this sub-account
 *    environment, enabling:
 *    - Application-scoped ownership (capital stays in the app context)
 *    - Gasless protection flows via paymaster sponsorship
 *    - Simplified UX (no repeated wallet prompts for routine operations)
 *    - Clear separation between personal wallet and app capital
 *
 * ── Migration path ─────────────────────────────────────
 * external-wallet → universal-base-account + elora-sub-account
 *
 * Each step must preserve self-custody and the ability to exit
 * at any time. No step is taken without a clear off-ramp.
 */

/* ── Current account mode ───────────────────────────── */

export type AccountMode = "external-wallet" | "base-account";

export type AccountStrategy = {
  mode: AccountMode;
  label: string;
  description: string;
  isAvailable: boolean;
  status: "active" | "coming-later";
};

export const accountStrategies: AccountStrategy[] = [
  {
    mode: "external-wallet",
    label: "Connected Wallet",
    description:
      "Current account mode. Use an external wallet to deposit, protect, release, and withdraw capital.",
    isAvailable: true,
    status: "active",
  },
  {
    mode: "base-account",
    label: "Base Account",
    description:
      "Future account infrastructure for calmer self-custody, simpler protection flows, and quieter onchain ownership.",
    isAvailable: false,
    status: "coming-later",
  },
];

export const activeAccountStrategy = accountStrategies.find(
  (strategy) => strategy.mode === "external-wallet",
) as AccountStrategy;

export const futureBaseAccountStrategy = accountStrategies.find(
  (strategy) => strategy.mode === "base-account",
) as AccountStrategy;

/* ── Future account strategy types (architecture prep) ─────────── */
/* NOT ACTIVATED. Exists as reference for eventual migration.       */

/**
 * Expanded account mode including future Base Account variants.
 *
 * external-wallet:    Current mode — any EOA/smart wallet via RainbowKit.
 * universal-base-account: A Base Account universal address (future).
 * elora-sub-account:     An app-scoped sub-account derived from the
 *                        universal Base Account (future).
 *
 * Activation order:
 *   1. external-wallet (current) → detect capabilities
 *   2. universal-base-account (next) → connect as alternative wallet
 *   3. elora-sub-account (eventual) → capital lives in app account
 */
export type FutureAccountMode =
  | "external-wallet"
  | "universal-base-account"
  | "elora-sub-account";

/**
 * Future account strategy — not yet wired into production.
 *
 * Properties marked "future" describe expected behavior;
 * they are placeholders for implementation.
 */
export interface FutureAccountStrategy {
  mode: FutureAccountMode;
  label: string;
  description: string;
  /** Whether this mode can be selected by the user */
  isSelectable: boolean;
  /** What this mode requires before activation */
  prerequisites: string[];
  /** Whether batching (sendCalls) is available in this mode */
  supportsBatching: boolean;
  /** Whether paymaster sponsorship is available in this mode */
  supportsPaymaster: boolean;
  /** Whether this mode owns protected capital directly */
  ownsCapital: boolean;
}

/**
 * Placeholder definitions for the three future account modes.
 *
 * These types exist to guide architecture discussions and
 * future implementation. They must not be used in production
 * wallet flows until explicitly activated.
 *
 * ── DO NOT ─────────────────────────────────────────────
 * - Do not import FutureAccountStrategy in components yet
 * - Do not wire into wallet-control.tsx
 * - Do not use for deposit/protect/release routing
 * - Do not replace activeAccountStrategy with these
 */
export const futureAccountStrategies: FutureAccountStrategy[] = [
  {
    mode: "external-wallet",
    label: "External Wallet",
    description:
      "Standard EOA or smart wallet connected via RainbowKit. Current production mode.",
    isSelectable: true,
    prerequisites: [],
    supportsBatching: false,
    supportsPaymaster: false,
    ownsCapital: true,
  },
  {
    mode: "universal-base-account",
    label: "Universal Base Account",
    description:
      "Base Account universal address. Connects via @base-org/account SDK. Enables sub-account creation and session-based wallet UX.",
    isSelectable: false,
    prerequisites: [
      "@base-org/account SDK integration",
      "Base Account wallet option in Connect modal",
      "Sub-account creation flow",
    ],
    supportsBatching: true,
    supportsPaymaster: true,
    ownsCapital: true,
  },
  {
    mode: "elora-sub-account",
    label: "Elora Sub Account",
    description:
      "App-scoped sub-account derived from the Universal Base Account. Protected capital lives in this account, enabling gasless flows and app-scoped ownership.",
    isSelectable: false,
    prerequisites: [
      "Universal Base Account connected",
      "Sub-account created for Elora domain",
      "Paymaster configured for sponsored protection flows",
      "Capability detection confirming sub-account and paymaster support",
    ],
    supportsBatching: true,
    supportsPaymaster: true,
    ownsCapital: true,
  },
];
