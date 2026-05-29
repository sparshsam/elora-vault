"use client";

import { useEffect, useState } from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { HouseBalanceCard } from "@/components/dashboard/house-balance-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BalanceChart } from "@/components/dashboard/balance-chart";
import { BetTable } from "@/components/bets/bet-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PiggyBank, Target, DollarSign } from "lucide-react";

interface BetSummary {
  total: number;
  won: number;
  open: number;
}

export default function DashboardPage() {
  const { houseBalance, withdrawableProfit, totalSavedFromLosses, syncFromServer } =
    useWalletStore();
  const [betSummary, setBetSummary] = useState<BetSummary>({
    total: 0,
    won: 0,
    open: 0,
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
        });
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

  const winRate =
    betSummary.total > 0
      ? ((betSummary.won / betSummary.total) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your bankroll vault overview
        </p>
      </div>

      {/* Main house balance */}
      <HouseBalanceCard balance={houseBalance} />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Withdrawable Profit"
          value={withdrawableProfit}
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
          trend={withdrawableProfit > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="Saved from Losses"
          value={totalSavedFromLosses}
          icon={<PiggyBank className="h-4 w-4 text-purple-400" />}
          trend={totalSavedFromLosses > 0 ? "up" : "neutral"}
        />
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
          icon={<TrendingUp className="h-4 w-4 text-indigo-400" />}
          trend={
            parseFloat(winRate) > 50
              ? "up"
              : parseFloat(winRate) > 0
                ? "down"
                : "neutral"
          }
          formatter={(v) => v.toFixed(1)}
        />
      </div>

      {/* Balance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Vault Balance Trend</CardTitle>
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
    </div>
  );
}
