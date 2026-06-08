"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNetworkCheck } from "@/hooks/use-network-check";
import type { TransactionLifecycle } from "@/lib/tx/transaction-state";

/* ── Shared sub-components ───────────────────────────── */

function IconCircle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-12 w-12 items-center justify-center rounded-full mb-4", className)}>
      {children}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-6 w-6", className)} viewBox="0 0 24 24" fill="none">
      <path d="M7 13l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PulsingDot() {
  return <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />;
}

/* ── Timer hook: fires onTimeout after threshold ms ──── */

function useTimer(active: boolean, thresholdMs: number, onTimeout: () => void) {
  const startedAt = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      startedAt.current = null;
      firedRef.current = false;
      return;
    }

    if (startedAt.current === null) {
      startedAt.current = Date.now();
    }

    const elapsed = Date.now() - startedAt.current;
    if (elapsed >= thresholdMs && !firedRef.current) {
      firedRef.current = true;
      onTimeout();
      return;
    }

    const remaining = thresholdMs - elapsed;
    if (remaining <= 0) return;

    const timer = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onTimeout();
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [active, thresholdMs, onTimeout]);
}

/* ── Pending Wallet Helper ──────────────────────────── */
/* Shared timer state for wallet popup / switch-chain    */

const SIGNATURE_TIMEOUT_MS = 90_000; // 90 seconds
const SWITCH_CHAIN_TIMEOUT_MS = 60_000; // 60 seconds

/* ── Success state ───────────────────────────────────── */

export function TxSuccess({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <IconCircle className="bg-green-100">
        <CheckIcon className="text-green-600" />
      </IconCircle>
      <p className="text-sm font-medium text-text-primary">{message}</p>
    </div>
  );
}

/* ── Wrong Network Banner ────────────────────────────── */

export function WrongNetworkBanner() {
  const { isCorrectChain, expectedChainName, switchChain, isSwitching } = useNetworkCheck();
  const [timedOut, setTimedOut] = useState(false);

  useTimer(isSwitching, SWITCH_CHAIN_TIMEOUT_MS, () => setTimedOut(true));

  if (isCorrectChain) return null;

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <IconCircle className="bg-amber-50 border border-amber-200">
        <svg className="h-6 w-6 text-amber-600" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4M12 16v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </IconCircle>
      <p className="text-sm font-medium text-text-primary">Wrong network</p>
      <p className="text-tiny text-text-tertiary mt-1 leading-relaxed max-w-xs">
        Connect to <span className="font-medium">{expectedChainName}</span> to perform this action.
      </p>
      {switchChain && !timedOut && (
        <button
          type="button"
          onClick={switchChain}
          disabled={isSwitching}
          className={cn(
            "mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-small font-medium shadow-sm transition-all",
            isSwitching
              ? "bg-surface-hover text-text-muted cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600",
          )}
        >
          {isSwitching ? "Switching..." : `Switch to ${expectedChainName}`}
        </button>
      )}
      {timedOut && (
        <div className="mt-4 w-full max-w-xs space-y-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-tiny text-amber-800 leading-relaxed">
              The network switch popup was dismissed or is not responding. Close this modal, switch
              to <span className="font-medium">{expectedChainName}</span> in your wallet, then try again.
            </p>
          </div>
          {switchChain && (
            <button
              type="button"
              onClick={() => { setTimedOut(false); switchChain(); }}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-tiny font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Retry switch
            </button>
          )}
        </div>
      )}
      {isSwitching && !timedOut && (
        <p className="text-tiny text-text-tertiary mt-2">Waiting for wallet confirmation...</p>
      )}
    </div>
  );
}

/* ── Wrong Network inline callout (for input step) ──── */

export function WrongNetworkCallout() {
  const { isCorrectChain, expectedChainName, switchChain, isSwitching } = useNetworkCheck();
  const [timedOut, setTimedOut] = useState(false);

  useTimer(isSwitching, SWITCH_CHAIN_TIMEOUT_MS, () => setTimedOut(true));

  if (isCorrectChain) return null;

  return (
    <div className={cn("rounded-lg border p-3 flex items-center justify-between gap-3",
      timedOut ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50")}>
      <p className="text-tiny leading-relaxed">
        {timedOut ? (
          <span className="text-red-700">
            Network switch was dismissed. Switch to{" "}
            <span className="font-medium">{expectedChainName}</span> in your wallet.
          </span>
        ) : (
          <span className="text-amber-800">
            Connect to <span className="font-medium">{expectedChainName}</span> before proceeding.
          </span>
        )}
      </p>
      {switchChain && (
        <button
          type="button"
          onClick={() => { setTimedOut(false); switchChain(); }}
          disabled={isSwitching}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
            timedOut
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-amber-600 text-white hover:bg-amber-700",
          )}
        >
          {isSwitching ? "Switching..." : "Switch"}
        </button>
      )}
    </div>
  );
}

/* ── Awaiting Signature — wallet popup visible ──────── */

export function AwaitingSignature({ onCancel }: { onCancel?: () => void }) {
  const [timedOut, setTimedOut] = useState(false);

  useTimer(true, SIGNATURE_TIMEOUT_MS, () => setTimedOut(true));

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <IconCircle className={timedOut ? "bg-amber-50 border border-amber-200" : "bg-surface-subtle"}>
        <PulsingDot />
      </IconCircle>
      <p className="text-sm font-medium text-text-primary">
        {timedOut ? "Wallet is not responding" : "Confirm in your wallet"}
      </p>
      <p className="text-tiny text-text-muted mt-2 max-w-xs leading-relaxed">
        {timedOut
          ? "The wallet popup was dismissed or is not responding. No transaction was sent."
          : "A wallet popup has been opened. Sign the transaction to continue."}
      </p>
      {timedOut ? (
        <div className="mt-4 w-full max-w-xs space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-tiny text-amber-800 leading-relaxed">
              Close this modal and try again. If the popup keeps failing, check that your wallet is
              unlocked and connected to the correct network.
            </p>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-tiny font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Close &amp; try again
            </button>
          )}
        </div>
      ) : (
        <p className="text-tiny text-text-tertiary mt-4 max-w-xs leading-relaxed border border-border rounded-lg bg-surface-subtle px-3 py-2">
          If the popup was dismissed, it will time out in{" "}
          {Math.ceil(SIGNATURE_TIMEOUT_MS / 1000)} seconds. You can then close this modal and try
          again.
        </p>
      )}
    </div>
  );
}

/* ── Submitted — transaction sent, waiting for blocks ─ */

export function TxSubmitted() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <IconCircle className="bg-surface-subtle">
        <PulsingDot />
      </IconCircle>
      <p className="text-sm font-medium text-text-primary">Transaction submitted</p>
      <p className="text-tiny text-text-muted mt-2 max-w-xs leading-relaxed">
        Waiting for confirmation onchain. This usually takes a few seconds.
      </p>
    </div>
  );
}

/* ── Confirming — blocks being produced ─────────────── */

export function TxConfirming() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <IconCircle className="bg-surface-subtle">
        <PulsingDot />
      </IconCircle>
      <p className="text-sm font-medium text-text-primary">Confirming onchain</p>
      <p className="text-tiny text-text-muted mt-2 max-w-xs leading-relaxed">
        Your transaction has been included. Waiting for finality.
      </p>
    </div>
  );
}

/* ── Failed / Reverted — with calm error + retry ────── */

interface TxErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function TxErrorDisplay({ message, onRetry }: TxErrorDisplayProps) {
  const isRejected =
    message.toLowerCase().includes("not confirmed") ||
    message.toLowerCase().includes("rejected") ||
    message.toLowerCase().includes("denied");

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <IconCircle className="bg-danger/10">
        <svg className="h-6 w-6 text-danger" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4M12 16v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </IconCircle>
      <p className="text-sm font-medium text-text-primary">{message}</p>
      {isRejected && (
        <p className="text-tiny text-text-tertiary mt-2 max-w-xs leading-relaxed">
          The transaction was not submitted onchain. Close the modal and try again when you&apos;re ready.
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1 rounded-lg bg-surface-subtle text-text-secondary px-4 py-2 text-small font-medium hover:text-text-primary transition-colors border border-border"
        >
          Try again
        </button>
      )}
      {!onRetry && isRejected && (
        <p className="text-tiny text-text-tertiary mt-4 max-w-xs leading-relaxed border border-border rounded-lg bg-surface-subtle px-3 py-2">
          Close this modal and start a new transaction.
        </p>
      )}
    </div>
  );
}

/* ── Integrated lifecycle display ─────────────────────
 *
 * Renders the correct visual state based on the transaction
 * lifecycle. Handles wrong-network as a separate case.
 *
 * Usage:
 *   <TxLifecycleDisplay
 *     lifecycle={lifecycle}
 *     successMessage="Capital deposited."
 *     onRetry={handleRetry}
 *   />
 */

interface TxLifecycleDisplayProps {
  lifecycle: TransactionLifecycle;
  successMessage: string;
  onRetry?: () => void;
  /** Called when wallet popup times out — closes modal for retry. */
  onCancel?: () => void;
  /** If true, also check network on non-terminal states. Default true. */
  checkNetwork?: boolean;
}

export function TxLifecycleDisplay({
  lifecycle,
  successMessage,
  onRetry,
  onCancel,
  checkNetwork = true,
}: TxLifecycleDisplayProps) {
  const network = useNetworkCheck();

  // On idle, only show wrong-network if enabled
  if (lifecycle.status === "idle") {
    if (checkNetwork && !network.isCorrectChain) {
      return <WrongNetworkBanner />;
    }
    return null;
  }

  // Wrong network check for active states
  if (checkNetwork && !network.isCorrectChain && lifecycle.isActive) {
    return <WrongNetworkBanner />;
  }

  switch (lifecycle.status) {
    case "awaiting-signature":
      return <AwaitingSignature onCancel={onCancel} />;
    case "submitted":
      return <TxSubmitted />;
    case "confirming":
      return <TxConfirming />;
    case "completed":
      return <TxSuccess message={successMessage} />;
    case "failed":
    case "reverted":
      return (
        <TxErrorDisplay
          message={lifecycle.calmError ?? "Transaction was not completed."}
          onRetry={onRetry}
        />
      );
    default:
      return null;
  }
}
