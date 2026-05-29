"use client";

import { useEffect, useState, useCallback } from "react";
import { BetTable } from "@/components/bets/bet-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useWalletStore } from "@/store/useWalletStore";

export default function OpenBetsPage() {
  const { syncFromServer } = useWalletStore();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

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
      console.error("Settlement error:", err);
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
