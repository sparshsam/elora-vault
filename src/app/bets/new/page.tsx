"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { BetForm } from "@/components/bets/bet-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewBetPage() {
  const { houseBalance, syncFromServer } = useWalletStore();

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Bet</h1>
          <p className="text-sm text-gray-500 mt-1">
            Place a bet backed by your vault
          </p>
        </div>
      </div>

      {/* Vault summary */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Available Vault
            </p>
            <p className="text-lg font-bold text-white tabular-nums">
              ${houseBalance.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Withdrawable
            </p>
            <p className="text-sm text-gray-400 tabular-nums">
              ${useWalletStore.getState().withdrawableProfit.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bet Form */}
      <BetForm houseBalance={houseBalance} />
    </div>
  );
}
