"use client";

import { useEffect, useState, useCallback } from "react";
import { BetTable } from "@/components/bets/bet-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, List } from "lucide-react";
import Link from "next/link";
import { useWalletStore } from "@/store/useWalletStore";

export default function OpenBetsPage() {
  const { syncFromServer } = useWalletStore();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bets?status=OPEN&limit=50");
      if (res.ok) {
        const data = await res.json();
        setBets(data.bets || []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBets();
    syncFromServer();
  }, [fetchBets, syncFromServer]);

  const handleSettle = async (id: string, result: "WIN" | "LOSS" | "PUSH") => {
    setError(null);
    try {
      const res = await fetch(`/api/bets/${id}/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to settle bet");
      }

      syncFromServer();
      fetchBets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement failed");
    } finally {
      // ignore
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Open Bets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Settle your open bets
          </p>
        </div>
      </div>

      {/* UX Messaging */}
      <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/5 px-4 py-3">
        <p className="text-xs text-indigo-300/70 italic">
        &ldquo;Every loss becomes saved capital.&rdquo;
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Open bets table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {bets.length} {bets.length === 1 ? "Bet" : "Bets"} Pending Settlement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <List className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">No open bets</p>
              <p className="text-xs mt-1 text-center max-w-xs">
                All your bets are settled. Place a new bet to track your discipline against the virtual house.
              </p>
            </div>
          ) : (
            <BetTable
              bets={bets}
              showActions={true}
              onSettle={handleSettle}
            />
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Link
          href="/bets/new"
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Place a new bet
        </Link>
      </div>
    </div>
  );
}
