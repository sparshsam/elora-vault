"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateProfit, calculateTotalReturn, validateBet } from "@/lib/liability";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BetFormProps {
  userBalance: number;
  savingsVault: number;
  virtualHouseBalance: number;
}

export function BetForm({ userBalance, savingsVault, virtualHouseBalance }: BetFormProps) {
  const router = useRouter();
  const [sport, setSport] = useState("");
  const [league, setLeague] = useState("");
  const [eventName, setEventName] = useState("");
  const [marketType, setMarketType] = useState("MONEYLINE");
  const [selection, setSelection] = useState("");
  const [odds, setOdds] = useState<number | "">("");
  const [stake, setStake] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = useMemo(() => {
    if (odds === "" || stake === "" || odds === 0) {
      return null;
    }
    return validateBet(Number(odds), Number(stake), userBalance);
  }, [odds, stake, userBalance]);

  const profit = useMemo(() => {
    if (odds === "" || stake === "") return 0;
    return calculateProfit(Number(odds), Number(stake));
  }, [odds, stake]);

  const totalReturn = useMemo(() => {
    if (odds === "" || stake === "") return 0;
    return calculateTotalReturn(Number(odds), Number(stake));
  }, [odds, stake]);

  const displayLabel = useMemo(() => {
    if (odds === "" || stake === "" || odds === 0) return "";
    const o = Number(odds);
    return o > 0 ? `+${o}` : `${o}`;
  }, [odds, stake]);

  const canSubmit =
    sport.trim() &&
    selection.trim() &&
    odds !== "" &&
    stake !== "" &&
    Number(stake) > 0 &&
    validation?.valid === true &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          league: league || undefined,
          event_name: eventName || undefined,
          marketType,
          selection,
          odds: Number(odds),
          stake: Number(stake),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to place bet");
      }

      router.push("/bets/open");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Sport */}
          <div>
            <label
              htmlFor="sport"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Sport
            </label>
            <input
              id="sport"
              type="text"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              placeholder="e.g. NBA, NFL, Premier League"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* League & Event Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="league"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                League (optional)
              </label>
              <input
                id="league"
                type="text"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                placeholder="e.g. Eastern Conference"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="eventName"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Event (optional)
              </label>
              <input
                id="eventName"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Lakers vs Celtics"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Market Type */}
          <div>
            <label
              htmlFor="marketType"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Market Type
            </label>
            <select
              id="marketType"
              value={marketType}
              onChange={(e) => setMarketType(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="MONEYLINE">Moneyline</option>
              <option value="SPREAD">Spread</option>
              <option value="TOTAL">Total (Over/Under)</option>
            </select>
          </div>

          {/* Selection */}
          <div>
            <label
              htmlFor="selection"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Selection
            </label>
            <textarea
              id="selection"
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              placeholder="e.g. Lakers -4.5, Over 215.5, Team to win..."
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Odds & Stake */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="odds"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                American Odds
              </label>
              <input
                id="odds"
                type="number"
                value={odds}
                onChange={(e) =>
                  setOdds(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g. +200, -150"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="stake"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Stake ($)
              </label>
              <input
                id="stake"
                type="number"
                value={stake}
                onChange={(e) =>
                  setStake(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      {odds !== "" && stake !== "" && Number(odds) !== 0 && Number(stake) > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-medium text-white">Live Preview</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Potential Profit</p>
                <p className="text-lg font-semibold text-emerald-400 tabular-nums">
                  ${profit.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Return</p>
                <p className="text-lg font-semibold text-white tabular-nums">
                  ${totalReturn.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Loss → Vault</p>
                <p className="text-lg font-semibold text-amber-400 tabular-nums">
                  ${Number(stake).toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Odds</p>
                <p className="text-lg font-semibold text-indigo-400 tabular-nums">
                  {displayLabel}
                </p>
              </div>
            </div>

            {/* Projected balances */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                Projected Balances
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">You Win</p>
                  <p className="text-emerald-400 font-semibold tabular-nums">
                    +${totalReturn.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">You Lose</p>
                  <p className="text-amber-400 font-semibold tabular-nums">
                    ${Number(stake).toFixed(2)} → Vault
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">User Balance (win)</p>
                  <p className="text-white font-semibold tabular-nums">
                    ${(userBalance - Number(stake) + totalReturn).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Savings Vault (loss)</p>
                  <p className="text-amber-400 font-semibold tabular-nums">
                    ${(savingsVault + Number(stake)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Virtual house balance */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Virtual House Balance</span>
              <span className="text-white font-semibold tabular-nums">
                ${virtualHouseBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {!validation?.valid && validation?.reason && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                <p className="text-sm text-red-400">{validation.reason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* UX Messaging */}
      <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/5 px-4 py-3">
        <p className="text-xs text-indigo-300/70 italic">
          &ldquo;Your losing bets do not disappear. They move into your vault.&rdquo;
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 text-base"
      >
        {loading ? "Placing bet..." : "Place Bet"}
      </Button>
    </form>
  );
}
