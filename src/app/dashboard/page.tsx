"use client";

import { useEffect, useState, useCallback } from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { HouseBalanceCard } from "@/components/dashboard/house-balance-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BalanceChart } from "@/components/dashboard/balance-chart";
import { BetTable } from "@/components/bets/bet-table";
import { LockCard } from "@/components/vault/lock-card";
import { VaultTimeline } from "@/components/vault/vault-timeline";
import { LockModal } from "@/components/vault/lock-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  PiggyBank,
  Target,
  DollarSign,
  BarChart3,
  Award,
  Activity,
  ClipboardList,
  Shield,
  Lock,
  Clock,
} from "lucide-react";

interface BetSummary {
  total: number;
  won: number;
  open: number;
  lost: number;
  pushed: number;
}

interface VaultLock {
  id: string;
  amount: number;
  createdAt: string;
  unlockAt: string;
  status: "ACTIVE" | "UNLOCKED" | "CANCELLED";
  notes?: string | null;
}

interface TimelineEvent {
  id: string;
  type: "LOCK_CREATED" | "LOCK_RELEASED" | "LOSS_TO_SAVINGS" | "DEPOSIT";
  amount: number;
  description: string;
  createdAt: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
    <Icon className="h-8 w-8 mb-2 opacity-30" />
    <p className="text-sm font-medium">{title}</p>
    <p className="text-xs mt-1 text-center max-w-xs">{description}</p>
  </div>
);

function getNextUnlock(locks: VaultLock[]): { days: number; date: string } | null {
  const active = locks.filter((l) => l.status === "ACTIVE");
  if (active.length === 0) return null;
  const next = active.reduce((earliest, current) =>
    new Date(current.unlockAt) < new Date(earliest.unlockAt) ? current : earliest,
  );
  const diff = new Date(next.unlockAt).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  return { days, date: next.unlockAt };
}

export default function DashboardPage() {
  const {
    user_balance,
    savings_vault,
    locked_vault_balance,
    available_vault_balance,
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
    pushed: 0,
  });
  const [recentBets, setRecentBets] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState<
    { date: string; balance: number }[]
  >([]);
  const [locks, setLocks] = useState<VaultLock[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLocks = useCallback(async () => {
    try {
      const res = await fetch("/api/vault/locks");
      if (res.ok) {
        const data = await res.json();
        setLocks(data.locks || []);
      }
    } catch {
      // silently ignore
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    try {
      const txnRes = await fetch("/api/wallet/transactions?limit=50");
      if (txnRes.ok) {
        const txnData = await txnRes.json();
        const txns = txnData.transactions || [];
        // Transform to timeline events
        const vaultEvents: TimelineEvent[] = txns
          .filter((t: { type: string }) =>
            ["LOCK_CREATED", "LOCK_RELEASED", "LOSS_TO_SAVINGS", "DEPOSIT"].includes(t.type),
          )
          .slice(0, 15)
          .map((t: { id: string; type: string; amount: number; description: string; createdAt: string }) => ({
            id: t.id,
            type: t.type as TimelineEvent["type"],
            amount: t.amount,
            description: t.description,
            createdAt: t.createdAt,
          }));
        setTimelineEvents(vaultEvents);
      }
    } catch {
      // silently ignore
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Fetch all bets for analytics summary
      const allRes = await fetch("/api/bets?limit=500");
      if (allRes.ok) {
        const allData = await allRes.json();
        const allBets = allData.bets || [];
        setRecentBets(allBets.slice(0, 5));
        setBetSummary({
          total: allData.total || 0,
          won: allBets.filter((b: { status: string }) => b.status === "WON").length,
          open: allBets.filter((b: { status: string }) => b.status === "OPEN").length,
          lost: allBets.filter((b: { status: string }) => b.status === "LOST").length,
          pushed: allBets.filter((b: { status: string }) => b.status === "PUSH").length,
        });
      }

      // Fetch balance history
      const txnRes = await fetch("/api/wallet/transactions?limit=100");
      if (txnRes.ok) {
        const txnData = await txnRes.json();
        const txns = txnData.transactions || [];
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncFromServer();
    fetchData();
    fetchLocks();
    fetchTimeline();
  }, [syncFromServer, fetchData, fetchLocks, fetchTimeline]);

  const settledBets = betSummary.won + betSummary.lost + betSummary.pushed;
  const winRate =
    settledBets > 0
      ? ((betSummary.won / settledBets) * 100).toFixed(1)
      : "0.0";

  const netUserPosition =
    withdrawable_winnings + savings_vault - total_deposited;

  const houseDiff = 1000000000 - virtual_house_balance;

  const activeLockCount = locks.filter((l) => l.status === "ACTIVE").length;
  const nextUnlock = getNextUnlock(locks);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

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
          title="Savings Vault (Total)"
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
          title="Virtual House Balance"
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

      {/* Vault Breakdown + Locked Capital Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Available Vault */}
        <StatCard
          title="Available Vault Capital"
          value={available_vault_balance}
          icon={<PiggyBank className="h-4 w-4 text-amber-400" />}
          trend={available_vault_balance > 0 ? "up" : "neutral"}
        />
        {/* Locked Capital */}
        <StatCard
          title="Locked Capital"
          value={locked_vault_balance}
          icon={<Lock className="h-4 w-4 text-indigo-400" />}
          trend={locked_vault_balance > 0 ? "up" : "neutral"}
        />
        {/* Active Locks */}
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 flex flex-col justify-center">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Active Locks
              </p>
              <p className="text-2xl font-bold text-white tabular-nums">
                {activeLockCount}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/20">
              <Shield className="h-4 w-4 text-indigo-400" />
            </div>
          </div>
          {nextUnlock && (
            <div className="flex items-center gap-1.5 mt-3">
              <Clock className="h-3 w-3 text-gray-500" />
              <p className="text-[10px] text-gray-500">
                Next unlocks in {nextUnlock.days} day{nextUnlock.days !== 1 ? "s" : ""}
              </p>
            </div>
          )}
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
          title="Net User Position"
          value={netUserPosition}
          icon={<Award className="h-4 w-4 text-purple-400" />}
          trend={netUserPosition > 0 ? "up" : netUserPosition < 0 ? "down" : "neutral"}
        />
        <StatCard
          title="Loss-to-Savings"
          value={houseDiff > 0 ? houseDiff : 0}
          icon={<Shield className="h-4 w-4 text-red-400" />}
          trend="neutral"
        />
      </div>

      {/* Protected Capital Section */}
      <Card className="border-indigo-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-400" />
              Protected Capital
            </CardTitle>
            {available_vault_balance > 0 && (
              <Button
                onClick={() => setLockModalOpen(true)}
                variant="outline"
                size="sm"
                className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 text-xs h-8"
              >
                <Shield className="h-3 w-3 mr-1.5" />
                Protect Capital
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {locks.length === 0 ? (
            <EmptyState
              icon={Lock}
              title="No protected capital yet"
              description="Lock savings vault funds for 7, 30, or 90 days to prevent impulsive use. Discipline compounds quietly."
            />
          ) : (
            <div className="space-y-3">
              {locks.filter((l) => l.status === "ACTIVE").map((lock) => (
                <LockCard key={lock.id} {...lock} />
              ))}
              {/* Show recently unlocked */}
              {locks.filter((l) => l.status !== "ACTIVE").length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">History</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  {locks.filter((l) => l.status !== "ACTIVE").map((lock) => (
                    <LockCard key={lock.id} {...lock} />
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vault Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-400" />
            Vault Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VaultTimeline events={timelineEvents} />
        </CardContent>
      </Card>

      {/* Bet Analytics Section */}
      {betSummary.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-400" />
              Bet Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Settled Bets</p>
                <p className="text-xl font-bold text-white tabular-nums">{settledBets}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/5 p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Won</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">{betSummary.won}</p>
              </div>
              <div className="rounded-lg bg-red-500/5 p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Lost</p>
                <p className="text-xl font-bold text-red-400 tabular-nums">{betSummary.lost}</p>
              </div>
              <div className="rounded-lg bg-gray-500/5 p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Push</p>
                <p className="text-xl font-bold text-gray-400 tabular-nums">{betSummary.pushed}</p>
              </div>
            </div>

            {/* Win/Loss bar */}
            {settledBets > 0 && (
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden flex">
                {betSummary.won > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${(betSummary.won / settledBets) * 100}%`,
                    }}
                  />
                )}
                {betSummary.lost > 0 && (
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${(betSummary.lost / settledBets) * 100}%`,
                    }}
                  />
                )}
                {betSummary.pushed > 0 && (
                  <div
                    className="h-full bg-gray-500 transition-all duration-500"
                    style={{
                      width: `${(betSummary.pushed / settledBets) * 100}%`,
                    }}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vault Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Vault Growth (User Balance Trend)</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceHistory.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No balance history yet"
              description="Deposit funds and place bets to see your vault growth over time."
            />
          ) : (
            <BalanceChart data={balanceHistory} />
          )}
        </CardContent>
      </Card>

      {/* House vs User comparison */}
      <Card className="border-indigo-500/10">
        <CardHeader>
          <CardTitle className="text-sm">House vs User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Virtual House Balance</span>
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

      {/* Recent bets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Bets</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBets.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No bets placed yet"
              description="Head to the New Bet page to place your first wager against the virtual house."
            />
          ) : (
            <BetTable bets={recentBets} />
          )}
        </CardContent>
      </Card>

      {/* Lock Modal */}
      <LockModal
        open={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        availableVaultBalance={available_vault_balance}
        onSuccess={() => {
          syncFromServer();
          fetchLocks();
          fetchTimeline();
        }}
      />

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Elora Vault is not a sportsbook. The house balance is virtual ($1B starting). This is a personal savings tool designed to gamify financial discipline. No real-money gambling occurs on this platform.
        </p>
      </div>
    </div>
  );
}
