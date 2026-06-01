/**
 * BaseAccountBadge
 *
 * Quietly indicates enhanced Base Account support availability.
 * Only renders when Base Account capabilities are detected.
 * Non-intrusive — a small visual hint, not a marketing callout.
 */

"use client";

import { useWalletCapabilities } from "@/lib/web3/use-wallet-capabilities";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface BaseAccountBadgeProps {
  /** Placement: inline (default) or tooltip-style */
  variant?: "pill" | "icon";
  className?: string;
}

/**
 * Small, quiet badge that appears when Base Account capabilities
 * are detected on the connected wallet.
 *
 * - pill: subtle text pill (default, for settings / wallet sections)
 * - icon: just a small sparkle icon (for compact headers)
 */
export function BaseAccountBadge({
  variant = "pill",
  className,
}: BaseAccountBadgeProps) {
  const { capabilities, status } = useWalletCapabilities();

  // Only show when capabilities are confirmed
  if (status !== "detected") return null;
  if (!capabilities.baseAccount && !capabilities.subAccountSupport) return null;

  if (variant === "icon") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          "text-green-500/70 hover:text-green-600",
          "transition-colors duration-200",
          className,
        )}
        title="Enhanced account support available"
      >
        <Sparkles className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "rounded-full px-2.5 py-1",
        "bg-green-50 border border-green-200",
        "text-[11px] font-medium text-green-700",
        "leading-none select-none",
        "transition-all duration-200",
        "hover:bg-green-100 hover:border-green-300",
        className,
      )}
      title="This wallet supports Base Account features"
    >
      <Sparkles className="h-3 w-3 text-green-500" />
      Enhanced account
    </span>
  );
}

/**
 * Description-only section — renders capabilities breakdown.
 * Use inside settings or wallet detail panels.
 */
export function WalletCapabilitiesInfo() {
  const { capabilities, status } = useWalletCapabilities();

  if (status !== "detected") return null;
  if (!capabilities.baseAccount && !capabilities.subAccountSupport) return null;

  const features: { label: string; supported: boolean }[] = [
    { label: "Base Account", supported: capabilities.baseAccount },
    { label: "Transaction batching", supported: capabilities.batching },
    { label: "Sub-account support", supported: capabilities.subAccountSupport },
    { label: "sendCalls (EIP-5792)", supported: capabilities.sendCallsSupport },
  ];

  return (
    <div className="space-y-2">
      <p className="text-tiny font-medium text-text-tertiary uppercase tracking-wider">
        Supported features
      </p>
      <div className="space-y-1.5">
        {features.map((f) => (
          <div
            key={f.label}
            className="flex items-center justify-between text-tiny"
          >
            <span
              className={cn(
                f.supported ? "text-text-secondary" : "text-text-muted",
              )}
            >
              {f.label}
            </span>
            <span
              className={cn(
                "font-mono text-[10px]",
                f.supported
                  ? "text-green-600"
                  : "text-text-subtle",
              )}
            >
              {f.supported ? "✓" : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Sub-account hierarchy display.
 * Shows Universal → Elora Account relationship if a sub-account exists.
 */
export function SubAccountHierarchy() {
  const { capabilities, status } = useWalletCapabilities();

  if (status !== "detected") return null;
  if (!capabilities.subAccountAddress) return null;

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-2">
      <p className="text-tiny font-medium text-text-tertiary uppercase tracking-wider">
        Account hierarchy
      </p>
      <div className="space-y-1.5">
        {/* Universal Account */}
        <div className="flex items-center gap-2 text-tiny">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
          <span className="text-text-muted">Universal Account</span>
          <span className="font-mono text-text-tertiary ml-auto">
            {capabilities.universalAddress
              ? shortenAddress(capabilities.universalAddress)
              : "—"}
          </span>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <span className="text-[10px] text-text-subtle">↓</span>
        </div>

        {/* Elora Account (sub-account) */}
        <div className="flex items-center gap-2 text-tiny">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
          <span className="font-medium text-text-primary">
            Elora Account
          </span>
          <span className="font-mono text-text-secondary ml-auto">
            {shortenAddress(capabilities.subAccountAddress)}
          </span>
        </div>
      </div>
    </div>
  );
}
