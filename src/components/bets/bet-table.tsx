"use client";

import { cn } from "@/lib/utils";

interface Bet {
  id: string;
  sport: string;
  marketType: string;
  selection: string;
  odds: number;
  stake: number;
  potentialProfit: number;
  status: string;
  createdAt: string;
  houseBalanceAfter: number | null;
}

interface BetTableProps {
  bets: Bet[];
}

const statusColors: Record<string, string> = {
  OPEN: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  WON: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  LOST: "text-red-400 bg-red-500/10 border-red-500/20",
  PUSH: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BetTable({ bets }: BetTableProps) {
  if (bets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p className="text-sm font-medium">No bets yet</p>
        <p className="text-xs mt-1">Place your first bet to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Date
            </th>
            <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Market
            </th>
            <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Selection
            </th>
            <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Odds
            </th>
            <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Stake
            </th>
            <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Profit
            </th>
            <th className="text-center py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Result
            </th>
            <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Vault After
            </th>
          </tr>
        </thead>
        <tbody>
          {bets.map((bet) => (
            <tr
              key={bet.id}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                {formatDate(bet.createdAt)}
              </td>
              <td className="py-3 px-3 text-white">
                <span className="text-xs text-gray-500">{bet.sport}</span>
                <span className="ml-1.5 text-xs text-gray-600">
                  {bet.marketType}
                </span>
              </td>
              <td className="py-3 px-3 text-white max-w-[200px] truncate">
                {bet.selection}
              </td>
              <td className="py-3 px-3 text-right text-white tabular-nums">
                {formatOdds(bet.odds)}
              </td>
              <td className="py-3 px-3 text-right text-white tabular-nums">
                ${bet.stake.toFixed(2)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums">
                <span
                  className={cn(
                    bet.status === "WON"
                      ? "text-emerald-400"
                      : bet.status === "LOST"
                        ? "text-red-400"
                        : "text-gray-400",
                  )}
                >
                  {bet.status === "WON"
                    ? `+$${bet.potentialProfit.toFixed(2)}`
                    : bet.status === "LOST"
                      ? `-$${bet.stake.toFixed(2)}`
                      : bet.status === "PUSH"
                        ? "$0.00"
                        : `$${bet.potentialProfit.toFixed(2)}`}
                </span>
              </td>
              <td className="py-3 px-3 text-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    statusColors[bet.status] || statusColors.OPEN,
                  )}
                >
                  {bet.status}
                </span>
              </td>
              <td className="py-3 px-3 text-right text-gray-400 tabular-nums">
                {bet.houseBalanceAfter !== null
                  ? `$${bet.houseBalanceAfter.toFixed(2)}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
