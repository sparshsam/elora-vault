/**
 * yield-strategies.ts — Research-only yield strategy definitions.
 *
 * This module catalogs potential yield strategies for productive
 * protected capital on Base. These are DEFINITIONS ONLY — no
 * protocol integrations are implemented.
 *
 * ── Current status ─────────────────────────────────────
 * No strategies are active. No protocols are integrated.
 * No yield-bearing positions exist. This is architecture
 * preparation for future optionality.
 *
 * ── Philosophy ─────────────────────────────────────────
 * Yield is not the goal — separation is. Any future yield
 * strategy must:
 * 1. Preserve principal as the highest priority
 * 2. Maintain the calm, unhurried character of Elora
 * 3. Never compromise the ability to exit
 * 4. Avoid speculative, farm-oriented, or degen approaches
 */

/* ── Strategy identifiers ───────────────────────────── */

/**
 * Potential yield strategies for productive protected capital.
 *
 * aave-usdc-base:    USDC supplied to Aave on Base. The most
 *                     established lending protocol. Variable rate.
 *
 * morpho-usdc-base:  USDC supplied to Morpho on Base. Optimized
 *                     efficiency market. May offer better rates
 *                     than Aave with similar risk profile.
 *
 * reserve-style:     Capital held in reserve (no yield). The
 *                     current default. Zero protocol risk. Always
 *                     available as the baseline option.
 *
 * treasury-style:    Diversified across multiple low-risk sources
 *                     (Aave, Morpho, native USDC). Spread reduces
 *                     protocol-specific risk. Suitable for larger
 *                     amounts.
 */
export type YieldStrategyId =
  | "aave-usdc-base"
  | "morpho-usdc-base"
  | "reserve-style"
  | "treasury-style";

/* ── Risk profile ────────────────────────────────────── */

export type RiskLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type LiquidityProfile = "immediate" | "delayed" | "locked";

export type ProtocolCategory =
  | "lending"
  | "efficiency-lending"
  | "reserve"
  | "diversified";

/* ── Strategy definition ─────────────────────────────── */

export interface YieldStrategyDefinition {
  id: YieldStrategyId;
  label: string;
  description: string;
  /** Risk level: 0 (no risk) to 5 (speculative) */
  riskLevel: RiskLevel;
  /** How quickly capital can be withdrawn */
  liquidityProfile: LiquidityProfile;
  /** Whether the strategy is compatible with lock periods */
  lockCompatible: boolean;
  /** Volatility exposure description */
  volatilityExposure: string;
  /** The category of protocol used */
  protocolCategory: ProtocolCategory;
  /** Specific protocols considered (not integrated) */
  candidateProtocols: string[];
  /** Estimated APY range (display only, illustrative) */
  estimatedYieldRange: string;
  /** Whether this strategy is currently available */
  isAvailable: boolean;
  /** Notes about suitability for Elora */
  notes: string;
}

/* ── Strategy definitions (research only) ────────────── */

export const YIELD_STRATEGIES: Record<YieldStrategyId, YieldStrategyDefinition> = {
  "aave-usdc-base": {
    id: "aave-usdc-base",
    label: "Aave USDC (Base)",
    description:
      "USDC supplied to Aave's Base market. The most established lending protocol onchain. Variable supply rate with historical stability.",
    riskLevel: 1,
    liquidityProfile: "delayed",
    lockCompatible: true,
    volatilityExposure: "Minimal — USDC is a stable asset. Rate fluctuates with utilization but principal remains stable.",
    protocolCategory: "lending",
    candidateProtocols: ["Aave V3 (Base)"],
    estimatedYieldRange: "2–5%",
    isAvailable: false,
    notes:
      "Best first-choice protocol. Largest TVL, most audited, Base-native deployment. Withdrawal from Aave may take 1–2 blocks.",
  },
  "morpho-usdc-base": {
    id: "morpho-usdc-base",
    label: "Morpho USDC (Base)",
    description:
      "USDC supplied to Morpho's Blue market on Base. Efficiency-lending model that matches lenders and borrowers directly for better rates.",
    riskLevel: 1,
    liquidityProfile: "delayed",
    lockCompatible: true,
    volatilityExposure: "Minimal — USDC stable asset. Morpho rates are typically more competitive than Aave for the same asset.",
    protocolCategory: "efficiency-lending",
    candidateProtocols: ["Morpho Blue (Base)"],
    estimatedYieldRange: "3–6%",
    isAvailable: false,
    notes:
      "More efficient than Aave for paired supply/demand. Still highly audited. Slightly higher yield potential.",
  },
  "reserve-style": {
    id: "reserve-style",
    label: "Reserve (no yield)",
    description:
      "Capital held in reserve within the ProtectedVault. No external protocol interaction. Zero risk. The current default.",
    riskLevel: 0,
    liquidityProfile: "immediate",
    lockCompatible: true,
    volatilityExposure: "None. Capital is held entirely within the ProtectedVault contract.",
    protocolCategory: "reserve",
    candidateProtocols: [],
    estimatedYieldRange: "0%",
    isAvailable: true,
    notes:
      "Current production behavior. Always available as the baseline. No protocol risk, no integration dependencies.",
  },
  "treasury-style": {
    id: "treasury-style",
    label: "Treasury-style allocation",
    description:
      "Diversified allocation across multiple low-risk sources on Base. Spread reduces protocol-specific risk.",
    riskLevel: 2,
    liquidityProfile: "delayed",
    lockCompatible: true,
    volatilityExposure: "Low — diversified across protocols smooths individual rate volatility. Aggregate exposure remains stable.",
    protocolCategory: "diversified",
    candidateProtocols: ["Aave V3 (Base)", "Morpho Blue (Base)", "Native USDC"],
    estimatedYieldRange: "2–6%",
    isAvailable: false,
    notes:
      "Best for larger protection amounts where diversification matters. Rebalancing and monitoring overhead is higher.",
  },
};

/* ── Helpers ─────────────────────────────────────────── */

/**
 * Get available (production) yield strategies.
 */
export function getAvailableYieldStrategies(): YieldStrategyDefinition[] {
  return Object.values(YIELD_STRATEGIES).filter((s) => s.isAvailable);
}

/**
 * Get future (research) yield strategies.
 */
export function getFutureYieldStrategies(): YieldStrategyDefinition[] {
  return Object.values(YIELD_STRATEGIES).filter((s) => !s.isAvailable);
}

/**
 * Get strategies compatible with a given lock duration (in ms).
 * Currently all strategies are lock-compatible (placeholder logic).
 */
export function getStrategiesCompatibleWithLock(): YieldStrategyDefinition[] {
  return Object.values(YIELD_STRATEGIES).filter((s) => s.lockCompatible);
}
