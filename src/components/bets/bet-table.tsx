"use client";

import { cn } from "@/lib/utils";

interface Bet {
  id: string;
  sport: string;
  league: string | null;
  event_name: string | null;
  marketType: string;
  selection: string;
  odds: number;
  stake: number;
  potentialProfit: number;
  potential_return: number;
  status: string;
  createdAt: string;
  settledAt: string | null;
  house_balance_after: number | null;
  user_balance_after: number | null;
  savings_vault_after: number | null;
}

interface BetTableProps {
  bets: Bet[];
  showActions?: boolean;
  onSettle?: (id: string, result: "WIN" | "LOSS" | "PUSH") => void;
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

export function BetTable({ bets, showActions, onSettle }: BetTableProps) {
  if (bets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p className="text-sm font-medium">No bets yet</p>
        <p className="text-xs mt-1">Place your first bet to get started</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Event
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
                P&L
              </th>
              <th className="text-center py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                Result
              </th>
              {showActions && (
                <th className="text-center py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Settle
                </th>
              )}
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
                <td className="py-3 px-3">
                  <div className="text-white text-sm">{bet.sport}</div>
                  {bet.league && (
                    <div className="text-[11px] text-gray-500">{bet.league}</div>
                  )}
                  {bet.event_name && (
                    <div className="text-[11px] text-gray-600">{bet.event_name}</div>
                  )}
                  <span className="text-[10px] text-gray-600 uppercase">{bet.marketType}</span>
                </td>
                <td className="py-3 px-3 text-white max-w-[180px] truncate">
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
                          : bet.status === "PUSH"
                            ? "text-gray-400"
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
                {showActions && bet.status === "OPEN" && onSettle && (
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSettle(bet.id, "WIN")}
                        className="px-3 py-1.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        Win
                      </button>
                      <button
                        onClick={() => onSettle(bet.id, "LOSS")}
                        className="px-3 py-1.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        Loss
                      </button>
                      <button
                        onClick={() => onSettle(bet.id, "PUSH")}
                        className="px-3 py-1.5 rounded text-[11px] font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20 transition-colors"
                      >
                        Push
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm p-4 space-y-3"
          >
            {/* Header row: date + status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{formatDate(bet.createdAt)}</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  statusColors[bet.status] || statusColors.OPEN,
                )}
              >
                {bet.status}
              </span>
            </div>

            {/* Event info */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-white">{bet.sport}</span>
                <span className="text-[10px] text-gray-600 uppercase">{bet.marketType}</span>
              </div>
              {bet.league && (
                <p className="text-xs text-gray-500">{bet.league}</p>
              )}
              {bet.event_name && (
                <p className="text-xs text-gray-600">{bet.event_name}</p>
              )}
            </div>

            {/* Selection */}
            <div className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-xs text-gray-500 mb-0.5">Selection</p>
              <p className="text-sm text-white">{bet.selection}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/5 p-2">
                <p className="text-[10px] text-gray-500">Odds</p>
                <p className="text-sm font-semibold text-indigo-400 tabular-nums">
                  {formatOdds(bet.odds)}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <p className="text-[10px] text-gray-500">Stake</p>
                <p className="text-sm font-semibold text-white tabular-nums">
                  ${bet.stake.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <p className="text-[10px] text-gray-500">P&L</p>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    bet.status === "WON"
                      ? "text-emerald-400"
                      : bet.status === "LOST"
                        ? "text-red-400"
                        : bet.status === "PUSH"
                          ? "text-gray-400"
                          : "text-amber-400",
                  )}
                >
                  {bet.status === "WON"
                    ? `+$${bet.potentialProfit.toFixed(2)}`
                    : bet.status === "LOST"
                      ? `-$${bet.stake.toFixed(2)}`
                      : bet.status === "PUSH"
                        ? "$0.00"
                        : `$${bet.potentialProfit.toFixed(2)}`}
                </p>
              </div>
            </div>

            {/* Settlement actions */}
            {showActions && bet.status === "OPEN" && onSettle && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => onSettle(bet.id, "WIN")}
                  className="py-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-[0.97] transition-all"
                >
                  Win ✓
                </button>
                <button
                  onClick={() => onSettle(bet.id, "LOSS")}
                  className="py-2.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.97] transition-all"
                >
                  Loss ✗
                </button>
                <button
                  onClick={() => onSettle(bet.id, "PUSH")}
                  className="py-2.5 rounded-lg text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20 active:scale-[0.97] transition-all"
                >
                  Push ↔
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
