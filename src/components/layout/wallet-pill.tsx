"use client";

import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

export function WalletPill({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-subtle border border-border", className)}>
        <Wallet className="h-3.5 w-3.5 text-text-tertiary" />
        <span className="text-xs text-text-tertiary font-medium">Wallet not connected</span>
      </div>
    );
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-subtle border border-border", className)}>
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <span className="text-xs text-text-secondary font-mono font-medium">{shortAddress}</span>
    </div>
  );
}
