/**
 * builder-code.ts — Base Builder Code utility for ERC-8021 attribution.
 *
 * Provides a safe getBuilderDataSuffix() function that returns a valid
 * hex-encoded suffix when NEXT_PUBLIC_BASE_BUILDER_CODE is configured.
 *
 * Builder codes identify applications in onchain transactions for
 * ecosystem analytics and future rewards programs. Attribution does
 * NOT affect transaction execution, gas cost, or security.
 *
 * See: https://docs.base.org/builder-codes
 *
 * ── Usage ──────────────────────────────────────────────
 * This suffix can be appended to transaction calldata for ERC-8021
 * attribution. It is NOT wired into production transactions yet.
 *
 * No Base.dev API keys are stored or committed in this module.
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
 * Returns an empty string when no builder code is configured,
 * making it safe to use in any transaction pipeline without
 * conditional branching.
 *
 * This is NOT wired into production transaction flows.
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
