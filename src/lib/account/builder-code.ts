/**
 * builder-code.ts — Base Builder Code utility for ERC-8021 attribution.
 *
 * Provides getBuilderDataSuffix() for safe calldata suffix generation.
 * The suffix is wired into production write calls (deposit, createLock,
 * releaseLock, withdrawUnlocked, approve) via tx-hooks.ts.
 *
 * Builder codes identify applications in onchain transactions for
 * ecosystem analytics and future rewards programs. Attribution does
 * NOT affect transaction execution, gas cost, or security.
 *
 * See: https://docs.base.org/builder-codes
 *
 * ── Safety ─────────────────────────────────────────────
 * - When NEXT_PUBLIC_BASE_BUILDER_CODE is unset/empty, getBuilderDataSuffix()
 *   returns "0x" — a zero-length hex string that viem treats as a no-op.
 *   Transactions execute identically with or without attribution.
 * - The raw builder code value is never exposed to client-side UI.
 * - This module imports no side-effect modules.
 */

import { builderCode } from "@/lib/env";

/**
 * Return a hex-encoded calldata suffix for ERC-8021 transaction
 * attribution, based on the configured NEXT_PUBLIC_BASE_BUILDER_CODE.
 *
 * Returns a non-empty hex string when the builder code is set:
 *   "0x" + hexEncode(builderCode)
 *
 * Returns "0x" (zero-length) when no builder code is configured,
 * making it safe to pass unconditionally to every writeContract call
 * without conditional branching. viem treats "0x" as a no-op.
 *
 * Wired into production writes via src/lib/web3/tx-hooks.ts:
 *   - approve
 *   - deposit
 *   - createLock
 *   - releaseLock
 *   - withdrawUnlocked
 */
export function getBuilderDataSuffix(): `0x${string}` {
  const code = builderCode();

  if (!code) {
    return "0x";
  }

  // Encode the builder code as a hex string for calldata suffix.
  // Each character becomes two hex nibbles.
  const hex = Array.from(new TextEncoder().encode(code))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `0x${hex}`;
}
