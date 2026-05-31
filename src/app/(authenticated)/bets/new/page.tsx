"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { BetForm } from "@/components/bets/bet-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewBetPage() {
  const {
    user_balance,
    savings_vault,
    virtual_house_balance,
    syncFromServer,
  } = useWalletStore();

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
            Stake against the virtual house
          </p>
        </div>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              User Balance
            </p>
            <p className="text-lg font-bold text-white tabular-nums mt-1">
              ${user_balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Savings Vault
            </p>
            <p className="text-lg font-bold text-amber-400 tabular-nums mt-1">
              ${savings_vault.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Virtual House Balance */}
      <div className="flex items-center justify-between text-sm px-1">
        <span className="text-gray-500">Virtual House Balance</span>
        <span className="text-indigo-400 font-semibold tabular-nums">
          ${virtual_house_balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Bet Form */}
      <BetForm
        userBalance={user_balance}
        savingsVault={savings_vault}
        virtualHouseBalance={virtual_house_balance}
      />

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Elora Vault is not a sportsbook. The house balance is virtual. This is a personal savings tool designed to gamify financial discipline. No real-money gambling occurs on this platform.
        </p>
      </div>
    </div>
  );
}
