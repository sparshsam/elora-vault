export type TransactionLifecycleStatus =
  | "idle"
  | "awaiting-signature"
  | "submitted"
  | "confirming"
  | "completed"
  | "failed"
  | "reverted";

export interface TransactionLifecycleInput {
  hash?: `0x${string}`;
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
  isReverted?: boolean;
  error?: unknown;
}

export interface TransactionLifecycle {
  status: TransactionLifecycleStatus;
  hash?: `0x${string}`;
  isActive: boolean;
  isTerminal: boolean;
  canSubmit: boolean;
  calmError: string | null;
}

const ACTIVE_STATUSES = new Set<TransactionLifecycleStatus>([
  "awaiting-signature",
  "submitted",
  "confirming",
]);

export function getCalmTransactionError(
  error: unknown,
  fallback = "Transaction was not confirmed.",
): string {
  if (!error) return fallback;

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("user rejected") ||
    normalized.includes("user denied") ||
    normalized.includes("rejected the request") ||
    normalized.includes("request rejected")
  ) {
    return "Transaction was not confirmed.";
  }

  if (
    normalized.includes("chain") ||
    normalized.includes("network") ||
    normalized.includes("unsupported")
  ) {
    return "Please switch to Base Sepolia before moving capital.";
  }

  if (
    normalized.includes("insufficient") ||
    normalized.includes("exceeds") ||
    normalized.includes("allowance")
  ) {
    return "Capital state could not be updated. Check the amount and try again.";
  }

  if (normalized.includes("revert") || normalized.includes("execution reverted")) {
    return "Transaction reverted before capital could move.";
  }

  return fallback;
}

export function getTransactionLifecycle(
  input: TransactionLifecycleInput,
  fallbackError?: string,
): TransactionLifecycle {
  let status: TransactionLifecycleStatus = "idle";

  if (input.isReverted) status = "reverted";
  else if (input.error) status = "failed";
  else if (input.isConfirmed) status = "completed";
  else if (input.isConfirming) status = "confirming";
  else if (input.hash) status = "submitted";
  else if (input.isPending) status = "awaiting-signature";

  const isActive = ACTIVE_STATUSES.has(status);

  return {
    status,
    hash: input.hash,
    isActive,
    isTerminal: status === "completed" || status === "failed" || status === "reverted",
    canSubmit: status === "idle" || status === "failed" || status === "reverted",
    calmError:
      status === "failed" || status === "reverted"
        ? getCalmTransactionError(input.error, fallbackError)
        : null,
  };
}

export function shouldBlockSubmit(lifecycle: TransactionLifecycle): boolean {
  return lifecycle.isActive || lifecycle.status === "completed";
}
