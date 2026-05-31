"use client";

import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { Wallet, LogOut, AlertCircle } from "lucide-react";
import { CURRENT_CHAIN } from "@/lib/contracts/contracts";

/* ── Props ───────────────────────────────────────────── */

interface WalletControlProps {
  /** compact: pill with inline disconnect. full: padded container with disconnect. */
  variant?: "compact" | "full";
  className?: string;
}

/* ── Helpers ─────────────────────────────────────────── */

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/* ── Component ───────────────────────────────────────── */

/**
 * WalletControl — unified wallet connect/disconnect/switch-network control.
 *
 * Disconnected          → "Connect Wallet" button.
 * Connected/wrong net   → "Switch to Base Sepolia" button.
 * Connected/correct net → address pill with inline disconnect.
 */
export function WalletControl({ variant = "full", className }: WalletControlProps) {
  const { isConnected, address, chainId } = useAccount();
  const { disconnect } = useDisconnect();

  const baseSepoliaId = CURRENT_CHAIN.chainId;
  const isWrongNetwork = isConnected && chainId && chainId !== baseSepoliaId;

  /* ── Disconnected — Connect button ── */
  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            type="button"
            onClick={openConnectModal}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg transition-all duration-200",
              "bg-green-500 text-white hover:bg-green-600 shadow-sm",
              "text-small font-medium",
              variant === "compact"
                ? "px-3 py-1.5"
                : "px-4 py-2.5 w-full justify-center",
              className,
            )}
          >
            <Wallet className="h-4 w-4 shrink-0" />
            Connect Wallet
          </button>
        )}
      </ConnectButton.Custom>
    );
  }

  /* ── Connected, wrong network — switch button ── */
  if (isWrongNetwork) {
    return (
      <ConnectButton.Custom>
        {({ openChainModal }) => (
          <div className={cn("flex flex-col gap-1", className)}>
            <button
              type="button"
              onClick={openChainModal}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border transition-all duration-200",
                "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
                "text-small font-medium",
                variant === "compact" ? "px-3 py-1.5" : "px-4 py-2.5 w-full justify-center",
              )}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              Switch to Base Sepolia
            </button>
            {variant !== "compact" && (
              <span className="text-[10px] text-amber-600/70 text-center">
                Connected to unsupported network
              </span>
            )}
          </div>
        )}
      </ConnectButton.Custom>
    );
  }

  /* ── Connected, correct network ── */
  const shortAddress = address ? shortenAddress(address) : "";

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="flex items-center gap-1.5 text-tiny text-text-tertiary">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
          {shortAddress}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium text-text-tertiary hover:text-danger transition-colors"
          title="Disconnect"
        >
          <LogOut className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle px-3 py-2.5">
        <span className="flex items-center gap-2 text-small font-mono font-medium text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          {shortAddress}
        </span>

        <button
          type="button"
          onClick={() => disconnect()}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-tiny font-medium text-text-tertiary hover:text-danger hover:bg-danger/10 transition-all duration-200"
          title="Disconnect wallet"
        >
          <LogOut className="h-3 w-3" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    </div>
  );
}
