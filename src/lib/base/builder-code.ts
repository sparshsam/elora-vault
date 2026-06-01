/**
 * Builder Code Attribution — ERC-8021 Infrastructure
 *
 * Elora uses Builder Codes (Base-native attribution identifiers) to optionally
 * tag onchain transactions with an app-specific attribution code. This allows
 * future ecosystem analytics (via Base.dev) to understand how protected capital
 * systems are used onchain — without changing transaction execution.
 *
 * Why Builder Codes exist:
 * Builder Codes are short, app-specific identifiers registered with Base's
 * onchain attribution registry. When appended to transaction calldata via
 * ERC-8021, they signal which application initiated the transaction without
 * altering the transaction's outcome, gas cost, or execution path.
 *
 * Why Elora uses them:
 * So future onchain activity from Elora can be attributed to the app for
 * ecosystem analytics and potential rewards programs — without requiring
 * smart contract changes, wallet modifications, or user-facing features.
 *
 * Attribution is optional:
 * If NEXT_PUBLIC_BASE_BUILDER_CODE is not set, all functions return
 * undefined/null safely. No transactions are modified. The attribution
 * suffix has no effect on execution — it is purely informational metadata
 * appended to the end of transaction data.
 *
 * Transactions remain unchanged:
 * The data suffix is a best-effort append to existing transaction calldata.
 * It does not modify the original function call, arguments, or execution
 * behavior. If the suffix cannot be applied, the transaction proceeds
 * as normal.
 *
 * ─── wagmi / viem dataSuffix Support ──────────────────────────────────
 *
 * Research (wagmi v2.19.5, viem v2.51.3):
 *
 *   DataSuffix is NOT a global config option on wagmi's createConfig().
 *   It IS a per-call parameter on viem's writeContract(), sendTransaction(),
 *   and simulateContract() — inheritable through wagmi hooks.
 *
 *   Type: viem/types/dataSuffix.d.ts
 *     DataSuffix = Hex | { value: Hex; required?: boolean }
 *
 *   Where used (viem actions):
 *     - writeContract        ✅ dataSuffix?: Hex
 *     - sendTransaction      ✅ dataSuffix?: Hex
 *     - simulateContract     ✅ dataSuffix?: Hex
 *     - estimateContractGas  ✅ dataSuffix?: Hex
 *
 * Phase 5.2A decision:
 *   Create helper utilities (this file). Do NOT wire into production
 *   writes yet. Reason: stability > attribution. The suffix can be
 *   passed on individual calls in a future phase when we've tested
 *   its effect on existing flows (deposit/protect/release).
 *
 *   Future wiring pattern:
 *     import { getBuilderDataSuffix } from "@/lib/base/builder-code";
 *     writeContract({
 *       ...args,
 *       dataSuffix: getBuilderDataSuffix(),  // undefined when unconfigured
 *     });
 *
 *   The dataSuffix is undefined-safe: passing undefined has no effect,
 *   so getBuilderDataSuffix() can be spread unconditionally.
 */

import { Attribution } from "ox/erc8021";

/**
 * Returns the configured Builder Code string, or undefined if not set.
 *
 * The code is read from NEXT_PUBLIC_BASE_BUILDER_CODE. When unset or empty,
 * all attribution features are safely disabled.
 *
 * @returns The builder code string, or undefined.
 */
export function getBuilderCode(): string | undefined {
  const code = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE;
  return code && code.length > 0 ? code : undefined;
}

/**
 * Returns an ERC-8021 compliant data suffix hex string for the configured
 * Builder Code. This suffix can be appended to transaction calldata to
 * attribute onchain activity to the Elora application.
 *
 * Returns undefined when no Builder Code is configured — safe to pass
 * as `dataSuffix` on wagmi/viem write calls without a conditional.
 *
 * Example usage (future phase):
 * ```ts
 * writeContract({
 *   ...args,
 *   dataSuffix: getBuilderDataSuffix(),
 * })
 * ```
 *
 * @returns The ERC-8021 data suffix hex string, or undefined.
 */
export function getBuilderDataSuffix(): `0x${string}` | undefined {
  const code = getBuilderCode();
  if (!code) return undefined;

  try {
    return Attribution.toDataSuffix({ codes: [code] });
  } catch {
    // If encoding fails (e.g., invalid code format), return undefined safely.
    // This ensures attribution failures never block transaction execution.
    return undefined;
  }
}

/**
 * Returns whether a Builder Code is configured and attribution is active.
 *
 * @returns true if a builder code is configured.
 */
export function hasBuilderCode(): boolean {
  return getBuilderCode() !== undefined;
}
