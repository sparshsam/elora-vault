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

/**
 * Safely read the builder code from the environment.
 *
 * Returns the code if set and non-empty, or null if unset/empty.
 * This function throws nothing — it always returns safely.
 */
function getBuilderCode(): string | null {
  const code = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE;
  if (!code || code.trim() === "") {
    return null;
  }
  return code.trim();
}

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
  const code = getBuilderCode();

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

/**
 * Check whether a builder code is configured in the environment.
 *
 * Useful for conditional UI or feature flags without exposing
 * the code value itself.
 */
export function hasBuilderCode(): boolean {
  return getBuilderCode() !== null;
}

/**
 * Get the raw builder code value.
 *
 * Returns the code string or null if not configured.
 * Do NOT expose this value in client-side code unless necessary.
 */
export function getRawBuilderCode(): string | null {
  return getBuilderCode();
}
