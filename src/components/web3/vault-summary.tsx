"use client";

import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useVaultSummary, useVaultStatus } from "@/lib/web3/hooks";
import { Shield, Lock, Unlock, PiggyBank, AlertCircle } from "lucide-react";

/**
 * Onchain Vault Summary Card.
 * Shows deposited, locked, and available balances from the smart contract.
 */
export function VaultSummaryCard({ className }: { className?: string }) {
  const { isConnected, address } = useAccount();
  const { isDeployed } = useVaultStatus();
  const summary = useVaultSummary(address);

  if (!isConnected || !address) {
    return (
      <Card className={cn("border-white/10 bg-black/40", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-4 text-gray-500">
            <Shield className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">Connect wallet to view vault</p>
            <p className="text-xs mt-1 text-center max-w-xs text-gray-600">
              Your onchain protected capital will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isDeployed) {
    return (
      <Card className={cn("border-white/10 bg-black/40", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">
                Vault Contract Not Deployed
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Deploy the ProtectedVault contract to Base to activate onchain vault features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unlockedBalance = summary.totalDeposited - summary.totalLocked - summary.totalWithdrawn;

  return (
    <Card
      className={cn(
        "border-indigo-500/10 bg-black/40 backdrop-blur-xl",
        className,
      )}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-600/10">
            <Shield className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Onchain Vault</p>
            <p className="text-[10px] text-gray-600">Protected Capital</p>
          </div>
        </div>

        {/* Balances */}
        <div className="space-y-3">
          {/* Total Deposited */}
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/5">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-gray-400">Total Deposited</span>
            </div>
            <span className="text-sm font-semibold text-white tabular-nums">
              ${summary.totalDeposited.toFixed(2)}
            </span>
          </div>

          {/* Locked Balance */}
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/5">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs text-gray-400">Locked Capital</span>
            </div>
            <span className="text-sm font-semibold text-indigo-400 tabular-nums">
              ${summary.totalLocked.toFixed(2)}
            </span>
          </div>

          {/* Available/Unlocked */}
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/5">
            <div className="flex items-center gap-2">
              <Unlock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-gray-400">Available</span>
            </div>
            <span className="text-sm font-semibold text-emerald-400 tabular-nums">
              ${Math.max(0, unlockedBalance).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Active Locks Count */}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
          <span className="text-[10px] text-gray-500">Active Locks</span>
          <span className="text-xs font-medium text-white tabular-nums">
            {summary.activeLockCount}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
