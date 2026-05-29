"use client";

import { useEffect, useState } from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { HouseBalanceCard } from "@/components/dashboard/house-balance-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BalanceChart } from "@/components/dashboard/balance-chart";
import { BetTable } from "@/components/bets/bet-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  PiggyBank,
  Target,
  DollarSign,
  BarChart3,
  Award,
  Activity,
} from "lucide-react";

interface BetSummary {
  total: number;
  won: number;
  open: number;
  lost: number;
}

export default function DashboardPage() {
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
  const [betSummary, setBetSummary] = useState<BetSummary>({
    total: 0,
    won: 0,
    open: 0,
    lost: 0,
  });
  const [recentBets, setRecentBets] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState<
    { date: string; balance: number }[]
  >([]);

  const fetchRecentBets = async () => {
    try {
      const res = await fetch("/api/bets?limit=5");
      if (res.ok) {
        const data = await res.json();
        setRecentBets(data.bets || []);
        const allBets = data.bets || [];
        setBetSummary({
          total: data.total || 0,
          won: allBets.filter((b: { status: string }) => b.status === "WON").length,
          open: allBets.filter((b: { status: string }) => b.status === "OPEN").length,
          lost: allBets.filter((b: { status: string }) => b.status === "LOST").length,
        });
      }
      // Also fetch full open count
      const openRes = await fetch("/api/bets?status=OPEN&limit=1");
      if (openRes.ok) {
        const openData = await openRes.json();
        setBetSummary((prev) => ({ ...prev, open: openData.total || 0 }));
      }
    } catch {
      // silently ignore
    }
  };

  const fetchBalanceHistory = async () => {
    try {
      const res = await fetch("/api/wallet/transactions?limit=50");
      if (res.ok) {
        const data = await res.json();
        const txns = data.transactions || [];
        const history = [...txns].reverse().map((t: { createdAt: string; balanceAfter: number }) => ({
          date: new Date(t.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          balance: t.balanceAfter,
        }));
        setBalanceHistory(history);
      }
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    syncFromServer();
    fetchRecentBets();
    fetchBalanceHistory();
  }, [syncFromServer]);

  const settledBets = betSummary.total - betSummary.open;
  const winRate =
    settledBets > 0
      ? ((betSummary.won / settledBets) * 100).toFixed(1)
      : "0.0";

  // Net user position: (withdrawable_winnings + savings_vault) - total_deposited
  const netUserPosition =
    withdrawable_winnings + savings_vault - total_deposited;

  // House advantage or deficit
  const houseDiff = 1000000000 - virtual_house_balance;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your savings vault overview
        </p>
      </div>

      {/* UX Messaging */}
      <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/5 px-4 py-3">
        <p className="text-xs text-indigo-300/70 italic">
        &ldquo;Every loss becomes saved capital. The house is virtual. The discipline is real.&rdquo;
        </p>
      </div>

      {/* Four Primary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HouseBalanceCard balance={user_balance} />
        <StatCard
          title="Savings Vault"
          value={savings_vault}
          icon={<PiggyBank className="h-4 w-4 text-amber-400" />}
          trend={savings_vault > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Withdrawable Winnings"
          value={withdrawable_winnings}
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
          trend={withdrawable_winnings > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Virtual House"
          value={virtual_house_balance}
          icon={<BarChart3 className="h-4 w-4 text-indigo-400" />}
          formatter={(v) =>
            `$${(v / 1000000000).toFixed(2)}B`
          }
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">
            Total Deposited
          </p>
          <p className="text-sm font-semibold text-white tabular-nums">
            ${total_deposited.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">
            Total Wagered
          </p>
          <p className="text-sm font-semibold text-white tabular-nums">
            ${total_wagered.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">
            Saved From Losses
          </p>
          <p className="text-sm font-semibold text-amber-400 tabular-nums">
            ${total_saved_from_losses.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">
            Total Profit Won
          </p>
          <p className="text-sm font-semibold text-emerald-400 tabular-nums">
            ${total_profit_won.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Bets"
          value={betSummary.open}
          prefix=""
          icon={<Target className="h-4 w-4 text-amber-400" />}
          formatter={(v) => v.toString()}
        />
        <StatCard
          title="Win Rate"
          value={parseFloat(winRate)}
          prefix=""
          suffix="%"
          icon={<Activity className="h-4 w-4 text-indigo-400" />}
          trend={
            parseFloat(winRate) > 50
              ? "up"
              : parseFloat(winRate) > 0
                ? "down"
                : "neutral"
          }
          formatter={(v) => v.toFixed(1)}
        />
        <StatCard
          title="Net Position"
          value={netUserPosition}
          icon={<Award className="h-4 w-4 text-purple-400" />}
          trend={netUserPosition > 0 ? "up" : netUserPosition < 0 ? "down" : "neutral"}
        />
        <StatCard
          title="House Change"
          value={houseDiff}
          icon={<TrendingUp className="h-4 w-4 text-red-400" />}
          trend={houseDiff > 0 ? "down" : houseDiff < 0 ? "up" : "neutral"}
        />
      </div>

      {/* House vs User visual comparison */}
      <Card className="border-indigo-500/10">
        <CardHeader>
          <CardTitle className="text-sm">House vs User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* House bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Virtual House</span>
                <span className="text-indigo-400 font-semibold tabular-nums">
                  ${virtual_house_balance.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
                  style={{
                    width: `${Math.min((virtual_house_balance / 1000000000) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* User bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">User (Balance + Vault + Winnings)</span>
                <span className="text-emerald-400 font-semibold tabular-nums">
                  ${(user_balance + savings_vault + withdrawable_winnings).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(((user_balance + savings_vault + withdrawable_winnings) / Math.max(virtual_house_balance, 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">User Balance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceChart data={balanceHistory} />
        </CardContent>
      </Card>

      {/* Recent bets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Bets</CardTitle>
        </CardHeader>
        <CardContent>
          <BetTable bets={recentBets} />
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Elora is not a sportsbook. The house balance is virtual ($1B starting). This is a personal savings tool designed to gamify financial discipline. No real-money gambling occurs on this platform.
        </p>
      </div>
    </div>
  );
}
