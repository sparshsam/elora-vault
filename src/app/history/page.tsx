"use client";

import { useEffect, useState, useCallback } from "react";
import { BetTable } from "@/components/bets/bet-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "All", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Won", value: "WON" },
  { label: "Lost", value: "LOST" },
  { label: "Push", value: "PUSH" },
];

export default function HistoryPage() {
  const [bets, setBets] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchBets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "20",
        page: page.toString(),
      });
      if (activeTab) params.set("status", activeTab);

      const res = await fetch(`/api/bets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBets(data.bets || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bet History</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} {total === 1 ? "bet" : "bets"} total
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab.value
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {activeTab ? `${activeTab} Bets` : "All Bets"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <BetTable bets={bets} />
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
