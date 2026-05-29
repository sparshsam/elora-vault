"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, RotateCw, TrendingUp, PiggyBank, Ban } from "lucide-react";
import Link from "next/link";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  DEPOSIT: {
    label: "Deposit",
    icon: <ArrowDownRight className="h-3.5 w-3.5" />,
    color: "text-emerald-400",
  },
  BET_PLACED: {
    label: "Bet Placed",
    icon: <ArrowUpRight className="h-3.5 w-3.5" />,
    color: "text-red-400",
  },
  WIN_PROFIT: {
    label: "Win (Profit)",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    color: "text-emerald-400",
  },
  LOSS_TO_SAVINGS: {
    label: "Loss → Savings",
    icon: <PiggyBank className="h-3.5 w-3.5" />,
    color: "text-amber-400",
  },
  PUSH_RETURN: {
    label: "Push (Return)",
    icon: <RotateCw className="h-3.5 w-3.5" />,
    color: "text-gray-400",
  },
  WITHDRAWAL: {
    label: "Withdrawal",
    icon: <Ban className="h-3.5 w-3.5" />,
    color: "text-red-400",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        page: page.toString(),
      });
      const res = await fetch(`/api/wallet/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} {total === 1 ? "transaction" : "transactions"} total
          </p>
        </div>
      </div>

      {/* Transactions list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs mt-1">Deposit funds and place bets to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => {
                const config = typeConfig[tx.type] || {
                  label: tx.type,
                  icon: <ArrowUpRight className="h-3.5 w-3.5" />,
                  color: "text-gray-400",
                };

                const isCredit = ["DEPOSIT", "WIN_PROFIT", "PUSH_RETURN"].includes(tx.type);
                const isDebit = ["BET_PLACED", "LOSS_TO_SAVINGS", "WITHDRAWAL"].includes(tx.type);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 px-1 hover:bg-white/[0.02] transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg border",
                          config.color.replace("text-", "border-").replace("400", "500/20") +
                            " bg-white/5",
                        )}
                      >
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">
                          {config.label}
                        </p>
                        <p className="text-xs text-gray-500 max-w-[300px] truncate">
                          {tx.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          isCredit && "text-emerald-400",
                          isDebit && "text-red-400",
                          !isCredit && !isDebit && "text-white",
                        )}
                      >
                        {isCredit ? "+" : ""}${tx.amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
