/**
 * account-capability-panel.tsx — Internal capability diagnostics panel.
 *
 * Displays wallet capability information detected via EIP-5792 and
 * the Base Account SDK. This component is for internal infrastructure
 * awareness only — it does not trigger any wallet actions.
 *
 * Tone: quiet infrastructure diagnostics
 * NOT: developer dashboard, crypto terminal, or hacker UI
 */

"use client";

import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, HelpCircle, Info } from "lucide-react";

/* ── Capability status indicator ─────────────────────── */

function CapabilityRow({
  label,
  supported,
  note,
}: {
  label: string;
  supported: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-tiny text-text-tertiary">{label}</span>
      <div className="flex items-center gap-1.5">
        {supported ? (
          <CheckCircle className="h-3 w-3 text-green-500" />
        ) : (
          <HelpCircle className="h-3 w-3 text-text-muted" />
        )}
        <span
          className={cn(
            "text-tiny font-mono",
            supported ? "text-green-600" : "text-text-muted",
          )}
        >
          {supported ? "supported" : "undetected"}
        </span>
        {note && (
          <span className="text-tiny text-text-subtle ml-1">— {note}</span>
        )}
      </div>
    </div>
  );
}

/* ── Wallet type display ─────────────────────────────── */

const WALLET_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  "eoa": { label: "Externally Owned Account", color: "text-text-primary" },
  "smart-wallet": { label: "Smart Wallet", color: "text-green-600" },
  "base-account": { label: "Base Account", color: "text-green-600" },
  "unknown": { label: "Unknown", color: "text-text-muted" },
};

/* ── Panel ───────────────────────────────────────────── */

interface AccountCapabilityPanelProps {
  className?: string;
}

/**
 * Quiet diagnostics panel showing wallet capabilities.
 *
 * Renders capability status rows and wallet type information
 * when a wallet is connected. Shows a simple prompt when no
 * wallet is connected.
 */
export function AccountCapabilityPanel({
  className,
}: AccountCapabilityPanelProps) {
  const caps = useWalletCapabilities();

  if (!caps.isConnected) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-surface p-5",
          className,
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-3.5 w-3.5 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Wallet Capabilities
          </h2>
        </div>
        <p className="text-tiny text-text-muted">
          Connect a wallet to view capability diagnostics.
        </p>
      </div>
    );
  }

  const walletLabel = WALLET_TYPE_LABELS[caps.walletType] ?? WALLET_TYPE_LABELS.unknown;

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5", className)}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-3.5 w-3.5 text-text-tertiary" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Wallet Capabilities
        </h2>
      </div>

      {/* ── Wallet Type ── */}
      <div className="flex items-center justify-between py-2 border-b border-border/50 mb-3">
        <span className="text-tiny text-text-tertiary">Wallet Type</span>
        <span className={cn("text-tiny font-medium", walletLabel.color)}>
          {walletLabel.label}
        </span>
      </div>

      {/* ── Capabilities ── */}
      <div className="space-y-0.5">
        <CapabilityRow
          label="Atomic batching (sendCalls)"
          supported={caps.supportsBatching}
          note={caps.supportsBatching ? "EIP-5792" : undefined}
        />
        <CapabilityRow
          label="Paymaster service"
          supported={caps.supportsPaymaster}
          note={caps.supportsPaymaster ? "sponsored gas ready" : undefined}
        />
        <CapabilityRow
          label="Base Account"
          supported={caps.supportsBaseAccount}
          note={caps.supportsBaseAccount ? "ERC-7895 sub-accounts" : undefined}
        />
        <CapabilityRow
          label="Sub-accounts"
          supported={caps.supportsSubAccounts}
          note={caps.supportsSubAccounts ? "domain-specific accounts" : undefined}
        />
      </div>

      {/* ── Connection Info ── */}
      <div className="mt-4 pt-3 border-t border-border/50 space-y-1">
        {caps.address && (
          <div className="flex items-center justify-between">
            <span className="text-tiny text-text-tertiary">Address</span>
            <span className="text-tiny font-mono text-text-muted">
              {caps.address.slice(0, 6)}...{caps.address.slice(-4)}
            </span>
          </div>
        )}
        {caps.chainId && (
          <div className="flex items-center justify-between">
            <span className="text-tiny text-text-tertiary">Chain ID</span>
            <span className="text-tiny font-mono text-text-muted">
              {caps.chainId}
            </span>
          </div>
        )}
      </div>

      {/* ── Loading state ── */}
      {caps.isLoading && (
        <div className="mt-3 flex items-center gap-1.5 text-tiny text-text-muted">
          <AlertCircle className="h-3 w-3" />
          Detecting capabilities...
        </div>
      )}
    </div>
  );
}
