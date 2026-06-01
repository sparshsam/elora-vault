/**
 * account-mode-table.tsx — Execution mode availability table.
 *
 * Maps detected wallet capabilities to available transaction execution
 * modes. Each mode shows whether it is supported by the connected
 * wallet, what it requires, and a brief explanation.
 *
 * Tone: quiet infrastructure documentation.
 * NOT: a developer dashboard or feature comparison table.
 */

"use client";

import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import {
  TRANSACTION_MODES,
  type TransactionMode,
} from "@/lib/account/transaction-modes";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

/* ── Mode availability logic ──────────────────── */

function isModeAvailable(
  mode: TransactionMode,
  caps: ReturnType<typeof useWalletCapabilities>,
): {
  available: boolean;
  reason: string;
} {
  switch (mode) {
    case "direct-wallet":
      return {
        available: true,
        reason: "Works with all wallets.",
      };
    case "send-calls":
      return caps.supportsBatching
        ? { available: true, reason: "Detected via EIP-5792." }
        : { available: false, reason: "wallet does not support sendCalls." };
    case "batched":
      return {
        available: true,
        reason: "Contract-level — no wallet support needed.",
      };
    case "sponsored":
      return caps.supportsPaymaster && caps.supportsBatching
        ? { available: true, reason: "Paymaster capability detected." }
        : caps.supportsBatching
          ? { available: false, reason: "No paymaster configured." }
          : { available: false, reason: "Requires sendCalls + paymaster." };
    case "sub-account":
      return caps.supportsSubAccounts
        ? { available: true, reason: "ERC-7895 sub-accounts detected." }
        : { available: false, reason: "wallet does not support sub-accounts." };
  }
}

/* ── Mode colors ──────────────────────────────── */

const MODE_STATUS_COLORS = {
  available: {
    dot: "bg-green-500",
    text: "text-green-600",
    badge: "bg-green-50 text-green-700 border-green-200",
    label: "Available",
  },
  unavailable: {
    dot: "bg-text-subtle",
    text: "text-text-muted",
    badge: "bg-surface-subtle text-text-muted border-border",
    label: "Unavailable",
  },
} as const;

/* ── Component ────────────────────────────────── */

interface AccountModeTableProps {
  className?: string;
}

/**
 * Execution mode availability table.
 *
 * Shows which transaction modes are supported by the connected wallet,
 * with brief explanations for each. Uses useWalletCapabilities to
 * determine availability.
 *
 * Gracefully handles:
 *   - No wallet connected (shows all modes with neutral guidance)
 *   - Wallet connected but capabilities loading (pulsing indicator)
 *   - EOA wallets (only direct-wallet and batched available)
 *   - Smart wallets / Base Accounts (richer mode support)
 */
export function AccountModeTable({ className }: AccountModeTableProps) {
  const caps = useWalletCapabilities();

  const modes: TransactionMode[] = [
    "direct-wallet",
    "send-calls",
    "batched",
    "sponsored",
    "sub-account",
  ];

  return (
    <div className={cn("rounded-xl border border-border bg-surface shadow-sm", className)}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-0">
        <Info className="h-3.5 w-3.5 text-text-tertiary" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Execution modes
        </h2>
      </div>
      <p className="text-tiny text-text-tertiary px-5 pt-1.5 pb-3 leading-relaxed">
        Research reference — maps detected capabilities to available transaction
        execution patterns. No mode is active in production flows.
      </p>

      {/* ── Table ── */}
      <div className="divide-y divide-border border-t border-border">
        {modes.map((mode) => {
          const info = TRANSACTION_MODES[mode];
          const { available, reason } = isModeAvailable(mode, caps);
          const statusStyle = available
            ? MODE_STATUS_COLORS.available
            : MODE_STATUS_COLORS.unavailable;

          return (
            <div key={mode} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", statusStyle.dot)} />
                    <span className="text-sm font-medium text-text-primary">
                      {info.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        statusStyle.badge,
                      )}
                    >
                      {caps.isConnected ? statusStyle.label : "No wallet"}
                    </span>
                  </div>
                  <p className="text-small text-text-secondary mt-1 leading-relaxed">
                    {info.description}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-tiny text-text-muted">
                      {info.mechanism}
                    </span>
                    {caps.isConnected && (
                      <span className={cn("text-tiny", statusStyle.text)}>
                        {reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer note ── */}
      <div className="px-5 py-3 border-t border-border">
        <p className="text-tiny text-text-tertiary leading-relaxed">
          EOA wallets support basic operations via <strong>direct-wallet</strong> mode.
          Smart wallets and Base Accounts progressively unlock batching, paymaster
          sponsorship, and sub-account execution. No production flows use these modes yet.
        </p>
      </div>
    </div>
  );
}
