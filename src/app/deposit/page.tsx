"use client";

import { useEffect, useState } from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowDownToLine, Wallet, PiggyBank, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DepositPage() {
  const {
    user_balance,
    savings_vault,
    total_deposited,
    syncFromServer,
  } = useWalletStore();
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const presetAmounts = [25, 50, 100, 250, 500, 1000];

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Deposit failed");
      }

      setSuccess(true);
      setAmount("");
      syncFromServer();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Deposit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add funds to your playable balance
          </p>
        </div>
      </div>

      {/* Simulated deposit disclaimer */}
      <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/5 px-4 py-3">
        <p className="text-xs text-indigo-300/70 italic">
          Simulated deposits. No real money is involved. Elora Vault is a personal savings tool, not a sportsbook.
        </p>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-3.5 w-3.5 text-indigo-400" />
            <p className="text-xs text-gray-500">User Balance</p>
          </div>
          <p className="text-xl font-bold text-white tabular-nums">
            ${user_balance.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-xs text-gray-500">Savings Vault</p>
          </div>
          <p className="text-xl font-bold text-amber-400 tabular-nums">
            ${savings_vault.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Deposit form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm">Add Funds</CardTitle>
          </div>
          <CardDescription>
            Enter an amount to add to your playable balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeposit} className="space-y-4">
            {/* Preset amounts */}
            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    amount === preset
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white",
                  )}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <div>
              <label
                htmlFor="deposit"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Custom Amount ($)
              </label>
              <input
                id="deposit"
                type="number"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
                <p className="text-sm text-emerald-400">
                  Funds deposited successfully!
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !amount || amount <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Depositing..." : `Deposit $${Number(amount || 0).toFixed(2)}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Total deposited */}
      <div className="flex items-center justify-between text-sm px-1">
        <span className="text-gray-500">Total Deposited</span>
        <span className="text-white font-semibold tabular-nums">
          ${total_deposited.toFixed(2)}
        </span>
      </div>

      {/* UX Messaging */}
      <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/5 px-4 py-3">
        <p className="text-xs text-indigo-300/70 italic">
        &ldquo;The house is virtual. The discipline is real.&rdquo;
        </p>
      </div>
    </div>
  );
}
