"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWalletStore } from "@/store/useWalletStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, DollarSign, User, Shield } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { houseBalance, withdrawableProfit, totalSavedFromLosses, syncFromServer } =
    useWalletStore();
  const [email, setEmail] = useState("");
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [depositing, setDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState(false);

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) setEmail(user.email);
  };

  useEffect(() => {
    syncFromServer();
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncFromServer]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || depositAmount <= 0) return;

    setDepositing(true);
    setDepositError(null);
    setDepositSuccess(false);

    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Deposit failed");
      }

      setDepositSuccess(true);
      setDepositAmount("");
      syncFromServer();
    } catch (err) {
      setDepositError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your vault and account
        </p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-sm">Account</CardTitle>
          </div>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
              Email
            </p>
            <p className="text-sm text-white">{email || "Loading..."}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      {/* Deposit */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm">Deposit Funds</CardTitle>
          </div>
          <CardDescription>
            Add funds to your vault. Current vault: ${houseBalance.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label
                htmlFor="deposit"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Amount ($)
              </label>
              <input
                id="deposit"
                type="number"
                value={depositAmount}
                onChange={(e) =>
                  setDepositAmount(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {depositError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                <p className="text-sm text-red-400">{depositError}</p>
              </div>
            )}

            {depositSuccess && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
                <p className="text-sm text-emerald-400">
                  Funds deposited successfully!
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={depositing || !depositAmount || depositAmount <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {depositing ? "Depositing..." : "Deposit"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Vault Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-400" />
            <CardTitle className="text-sm">Vault Statistics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">House Balance</p>
              <p className="text-lg font-semibold text-white tabular-nums">
                ${houseBalance.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Withdrawable Profit</p>
              <p className="text-lg font-semibold text-emerald-400 tabular-nums">
                ${withdrawableProfit.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Saved from Losses</p>
              <p className="text-lg font-semibold text-purple-400 tabular-nums">
                ${totalSavedFromLosses.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Balance</p>
              <p className="text-lg font-semibold text-white tabular-nums">
                ${(houseBalance + withdrawableProfit).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
