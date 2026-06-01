"use client";

/**
 * Re-export from canonical capital state module.
 *
 * All capital state logic now lives in src/lib/capital/capital-state.ts.
 * This file exists for backward compatibility; existing imports continue
 * to work without changes.
 *
 * New code should import directly from "@/lib/capital/capital-state".
 */

export { useCapitalState } from "@/lib/capital/capital-state";

export type {
  CapitalState,
  CapitalStateLabel,
  CapitalBalances,
  CapitalBalancesFormatted,
  CapitalSummary,
  HorizonInfo,
} from "@/lib/capital/capital-state";
