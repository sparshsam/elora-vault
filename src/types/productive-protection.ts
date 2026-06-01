/**
 * productive-protection.ts — Conceptual types for productive protected capital.
 *
 * These types define the conceptual model for protected capital that
 * may optionally generate low-risk yield while remaining separated from
 * available balances.
 *
 * ── Philosophy ─────────────────────────────────────────
 * Productive protection is NOT yield farming. It is the idea that
 * protected capital, which is already intentionally set aside, could
 * conservatively generate returns while remaining in its protected
 * state. The emphasis is on preservation and low-risk, not
 * maximization or speculation.
 *
 * ── Current status ─────────────────────────────────────
 * All types here are conceptual. No protocol integrations exist.
 * No yield strategies are deployed. This is architecture preparation
 * for future optionality.
 *
 * ── When productive protection would activate ──────────
 * Productive protection is always opt-in. Capital that is "protected"
 * can remain static (current behavior) or be optionally directed
 * toward conservative yield generation (future). The default is
 * always static protection.
 */

/* ── Protection mode identifiers ────────────────────── */

/**
 * The mode of protection for protected capital.
 *
 * static-protection:      Capital is locked and held without yield.
 *                          Current production behavior. No external
 *                          protocol interaction. The safest default.
 *
 * productive-protection:  Capital generates low-risk yield while
 *                          remaining in its protected state. The
 *                          capital is still locked — it is not
 *                          available for impulse spending.
 *
 * conservative-yield:     A subset of productive protection using
 *                          the most conservative yield sources
 *                          (e.g., USDC savings on Base). Minimal
 *                          volatility exposure.
 *
 * treasury-style:         Capital is managed with treasury-grade
 *                          conservatism. Diversified across multiple
 *                          low-risk sources. Suitable for larger
 *                          protection amounts.
 *
 * stable-lending:         Capital is lent to stable, overcollateralized
 *                          lending protocols. Higher yield than
 *                          conservative-yield but still low-risk.
 */
export type ProtectionMode =
  | "static-protection"
  | "productive-protection"
  | "conservative-yield"
  | "treasury-style"
  | "stable-lending";

/* ── Mode metadata ──────────────────────────────────── */

export interface ProtectionModeInfo {
  mode: ProtectionMode;
  label: string;
  description: string;
  /** Risk level: 0 (no risk) to 5 (speculative) */
  riskLevel: 0 | 1 | 2 | 3 | 4 | 5;
  /** Whether this mode involves external protocols */
  involvesExternalProtocols: boolean;
  /** Whether this mode is available in production */
  isAvailable: boolean;
  /** Whether this mode requires user opt-in */
  requiresOptIn: boolean;
  /** Estimated APY range (display only, not guaranteed) */
  estimatedYieldRange: string;
  /** Whether the principal is protected against loss */
  principalProtected: boolean;
  /** Liquidity profile */
  liquidityProfile: "immediate" | "delayed" | "locked";
  /** Recommended minimum protection amount */
  recommendedMinAmount: number;
  /** Notes for internal reference */
  notes: string;
}

/* ── Mode definitions ───────────────────────────────── */

export const PROTECTION_MODES: Record<ProtectionMode, ProtectionModeInfo> = {
  "static-protection": {
    mode: "static-protection",
    label: "Static protection",
    description:
      "Capital is locked and held without yield. No external protocol interaction. The simplest and most secure option.",
    riskLevel: 0,
    involvesExternalProtocols: false,
    isAvailable: true,
    requiresOptIn: false,
    estimatedYieldRange: "0%",
    principalProtected: true,
    liquidityProfile: "locked",
    recommendedMinAmount: 0,
    notes: "Current production behavior. No protocol risk. Capital is held entirely within ProtectedVault.",
  },
  "productive-protection": {
    mode: "productive-protection",
    label: "Productive protection",
    description:
      "Protected capital generates low-risk yield while remaining separated. Capital is still locked — it is not available for spending.",
    riskLevel: 1,
    involvesExternalProtocols: true,
    isAvailable: false,
    requiresOptIn: true,
    estimatedYieldRange: "2–6%",
    principalProtected: true,
    liquidityProfile: "locked",
    recommendedMinAmount: 100,
    notes: "Future feature. Capital allocated to conservative Base-native yield sources. Principal preservation prioritized.",
  },
  "conservative-yield": {
    mode: "conservative-yield",
    label: "Conservative yield",
    description:
      "The most cautious yield approach. Capital in stable, audited protocols with proven track records on Base.",
    riskLevel: 1,
    involvesExternalProtocols: true,
    isAvailable: false,
    requiresOptIn: true,
    estimatedYieldRange: "2–4%",
    principalProtected: true,
    liquidityProfile: "locked",
    recommendedMinAmount: 500,
    notes: "Future feature. Targets stable USDC yield sources (e.g., Aave USDC, Morpho USDC).",
  },
  "treasury-style": {
    mode: "treasury-style",
    label: "Treasury-style allocation",
    description:
      "Diversified across multiple low-risk sources. Suitable for larger protection amounts where stability matters most.",
    riskLevel: 2,
    involvesExternalProtocols: true,
    isAvailable: false,
    requiresOptIn: true,
    estimatedYieldRange: "3–5%",
    principalProtected: false,
    liquidityProfile: "delayed",
    recommendedMinAmount: 5000,
    notes: "Future feature. Diversified allocation across multiple protocols. May involve small delay in liquidity.",
  },
  "stable-lending": {
    mode: "stable-lending",
    label: "Stable lending",
    description:
      "Capital lent to overcollateralized lending markets on Base. Higher yield potential with maintained safety.",
    riskLevel: 2,
    involvesExternalProtocols: true,
    isAvailable: false,
    requiresOptIn: true,
    estimatedYieldRange: "4–8%",
    principalProtected: false,
    liquidityProfile: "delayed",
    recommendedMinAmount: 1000,
    notes: "Future feature. Capital supplied to stable lending pools. Subject to market fluctuations in yield.",
  },
};

/* ── Helpers ─────────────────────────────────────────── */

/**
 * Get the available (production) protection modes.
 */
export function getAvailableProtectionModes(): ProtectionModeInfo[] {
  return Object.values(PROTECTION_MODES).filter((m) => m.isAvailable);
}

/**
 * Get the future (conceptual) protection modes.
 */
export function getFutureProtectionModes(): ProtectionModeInfo[] {
  return Object.values(PROTECTION_MODES).filter((m) => !m.isAvailable);
}
