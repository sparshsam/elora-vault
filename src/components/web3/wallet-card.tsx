"use client";

import { useAccount, useChainId } from "wagmi";
import { useReadContract } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatUnits } from "viem";
import { Wallet, Shield, Lock, Unlock, ExternalLink } from "lucide-react";
import { CURRENT_CHAIN } from "@/lib/contracts/contracts";

// Minimal ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/**
 * Connected Wallet Information Card.
 * Shows wallet address, network status, and vault summary.
 * Calm, minimal — reserved for the dashboard.
 */
export function WalletInfoCard({ className }: { className?: string }) {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { data: usdcBalanceData } = useReadContract({
    address: CURRENT_CHAIN.usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const usdcBalance = usdcBalanceData
    ? Number(formatUnits(usdcBalanceData as bigint, 6))
    : 0;

  if (!isConnected || !address) {
    return null;
  }

  const isBaseNetwork = chainId === 8453 || chainId === 84532;
  const formattedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const explorerUrl = isBaseNetwork
    ? `${CURRENT_CHAIN.explorerUrl}/address/${address}`
    : "#";

  return (
    <Card
      className={cn(
        "border-white/10 bg-black/40 backdrop-blur-xl",
        className,
      )}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-600/10">
              <Wallet className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Connected Wallet</p>
              <p className="text-sm font-semibold text-white font-mono tabular-nums">
                {formattedAddress}
              </p>
            </div>
          </div>

          {/* Network badge */}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium",
              "border transition-all",
              isBaseNetwork
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "border-red-500/20 bg-red-500/10 text-red-400",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isBaseNetwork ? "bg-emerald-400" : "bg-red-400",
              )}
            />
            {isBaseNetwork ? chain?.name ?? "Base" : "Unsupported"}
            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
          </a>
        </div>

        {/* USDC Balance */}
        <div className="rounded-lg bg-white/5 border border-white/5 p-3 mb-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-0.5">
            Wallet USDC Balance
          </p>
          <p className="text-lg font-semibold text-white tabular-nums">
            {usdcBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            USDC
          </p>
        </div>

        {/* Action hints */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-2.5">
            <Shield className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <p className="text-[10px] text-indigo-300/70 leading-relaxed">
              Deposit USDC to activate vault
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/10 p-2.5">
            <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <p className="text-[10px] text-amber-300/70 leading-relaxed">
              Lock capital to protect savings
            </p>
          </div>
        </div>

        {/* Status row */}
        <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isBaseNetwork ? "bg-emerald-400" : "bg-gray-500",
              )}
            />
            <span className="text-[10px] text-gray-500">
              {isBaseNetwork ? "Connected to Base" : "Unsupported network"}
            </span>
          </div>
          <span className="text-gray-600">·</span>
          <span className="text-[10px] text-gray-500 font-mono">
            v0.5 onchain
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
