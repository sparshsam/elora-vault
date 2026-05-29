"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useWalletStore } from "@/store/useWalletStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, User, Wallet, BarChart3 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const {
    user_balance,
    savings_vault,
    withdrawable_winnings,
    virtual_house_balance,
    total_deposited,
    total_wagered,
    total_saved_from_losses,
    total_profit_won,
    syncFromServer,
  } = useWalletStore();
  const [email, setEmail] = useState("");

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account and vault overview
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

      {/* Balance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm">Balance Overview</CardTitle>
          </div>
          <CardDescription>
            Your complete financial picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">User Balance</p>
              <p className="text-lg font-semibold text-white tabular-nums">
                ${user_balance.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Savings Vault</p>
              <p className="text-lg font-semibold text-amber-400 tabular-nums">
                ${savings_vault.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Withdrawable Winnings</p>
              <p className="text-lg font-semibold text-emerald-400 tabular-nums">
                ${withdrawable_winnings.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Virtual House</p>
              <p className="text-lg font-semibold text-indigo-400 tabular-nums">
                ${virtual_house_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <CardTitle className="text-sm">Statistics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Deposited</p>
              <p className="text-sm font-semibold text-white tabular-nums">
                ${total_deposited.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Wagered</p>
              <p className="text-sm font-semibold text-white tabular-nums">
                ${total_wagered.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Saved From Losses</p>
              <p className="text-sm font-semibold text-amber-400 tabular-nums">
                ${total_saved_from_losses.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Profit Won</p>
              <p className="text-sm font-semibold text-emerald-400 tabular-nums">
                ${total_profit_won.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UX Messaging */}
      <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/5 px-4 py-3">
        <p className="text-xs text-indigo-300/70 italic">
        &ldquo;The house is virtual. The discipline is real.&rdquo;
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Elora Vault is not a sportsbook. The house balance is virtual. This is a personal savings tool designed to gamify financial discipline. No real-money gambling occurs on this platform.
        </p>
      </div>
    </div>
  );
}
