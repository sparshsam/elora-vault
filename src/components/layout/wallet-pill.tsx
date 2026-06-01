"use client";

import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { useWalletCapabilities } from "@/lib/web3/use-wallet-capabilities";
import { Wallet, Sparkles } from "lucide-react";

interface WalletPillProps {
  className?: string;
  /** minimal — dot + address only, no container. full — padded container (default) */
  variant?: "full" | "minimal";
}

export function WalletPill({ className, variant = "full" }: WalletPillProps) {
  const { address, isConnected } = useAccount();
  const { capabilities, status } = useWalletCapabilities();

  const hasBaseAccount =
    status === "detected" &&
    (capabilities.baseAccount || capabilities.subAccountSupport);

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!isConnected || !address) {
    if (variant === "minimal") {
      return (
        <span className={cn("flex items-center gap-1.5 text-tiny text-text-tertiary", className)}>
          <Wallet className="h-3 w-3" />
          Not connected
        </span>
      );
    }
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-subtle border border-border", className)}>
        <Wallet className="h-3.5 w-3.5 text-text-tertiary" />
        <span className="text-xs text-text-tertiary font-medium">Wallet not connected</span>
      </div>
    );
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (variant === "minimal") {
    return (
      <span className={cn("flex items-center gap-1.5 text-tiny text-text-tertiary", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {hasBaseAccount ? (
          <span className="flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-green-500" />
            {shortAddress}
          </span>
        ) : (
          shortAddress
        )}
      </span>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-subtle border border-border">
        <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
        {hasBaseAccount ? (
          <span className="flex items-center gap-1.5 text-xs text-text-secondary font-mono font-medium">
            <Sparkles className="h-3 w-3 text-green-500 shrink-0" />
            {shortAddress}
          </span>
        ) : (
          <span className="text-xs text-text-secondary font-mono font-medium">
            {shortAddress}
          </span>
        )}
      </div>

      {/* Sub-account hierarchy — shown beneath the pill when Base Account detected */}
      {hasBaseAccount && capabilities.subAccountAddress && (
        <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-green-50/50 border border-green-200/50">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-2.5 w-2.5 text-green-500 shrink-0" />
            <span className="text-[10px] font-medium text-green-700">
              Elora Account connected
            </span>
            <span className="text-[10px] font-mono text-green-500/70 ml-auto">
              {shortenAddress(capabilities.subAccountAddress)}
            </span>
          </div>
          <div className="text-[9px] text-green-600/60 mt-0.5 flex items-center gap-1">
            <span>Universal → Elora</span>
          </div>
        </div>
      )}
    </div>
  );
}
