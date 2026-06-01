"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { useCapitalState } from "@/lib/capital-state";
import { useWalletStore } from "@/store/useWalletStore";
import { PageShell } from "@/components/layout/page-shell";
import { CapitalRhythmCard } from "@/components/insights/capital-rhythm-card";
import { BehavioralObservationCard } from "@/components/insights/behavioral-observation-card";
import { EventTimeline, type TimelineEvent } from "@/components/insights/event-timeline";
import { generateObservations } from "@/lib/insights/behavioral-observations";
import { getCapitalStateMetrics } from "@/lib/capital/capital-state";
import { normalizeTransactionType, TX_TYPES } from "@/lib/transaction-types";
import { Activity } from "lucide-react";

/* ── Helpers ───────────────────────────────── */

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ── Page ──────────────────────────────────── */

export default function InsightsPage() {
  const { isConnected } = useAccount();
  const capital = useCapitalState();
  const walletStore = useWalletStore();
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  // ── Fetch transaction history ──
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/wallet/transactions?limit=100");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Transform transactions to timeline events ──
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const eventMap: Record<string, TimelineEvent["type"]> = {
      [TX_TYPES.depositCompleted]: "deposit",
      [TX_TYPES.protectionCreated]: "protection-created",
      [TX_TYPES.protectionReleased]: "protection-released",
      [TX_TYPES.withdrawalCompleted]: "withdrawal",
      [TX_TYPES.predictionCreated]: "committed",
      [TX_TYPES.predictionWon]: "return",
      [TX_TYPES.predictionPushed]: "return",
    };

    return transactions
      .filter((tx) => {
        const type = normalizeTransactionType(tx.type as string);
        return type in eventMap;
      })
      .map((tx) => ({
        id: tx.id as string,
        type: eventMap[normalizeTransactionType(tx.type as string)],
        amount: formatUSD(typeof tx.amount === "number" ? tx.amount : 0),
        date: (tx.createdAt as string) || new Date().toISOString(),
        label: (tx.description as string) || "",
      }))
      .slice(-40); // show most recent 40 events
  }, [transactions]);

  // ── Compute rhythm metrics ──
  const rhythmMetrics = useMemo(() => {
    const { balances, activeHorizons } = capital;
    const stateMetrics = getCapitalStateMetrics(balances);

    // Average protection horizon
    const durations = activeHorizons.map((h) => h.durationDays).filter(Boolean);
    const avgHorizon =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    // Release frequency — count releases in the last 30 days
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentReleases = transactions.filter((tx) => {
      const type = normalizeTransactionType(tx.type as string);
      const txDate = new Date(tx.createdAt as string).getTime();
      return type === TX_TYPES.protectionReleased && txDate > thirtyDaysAgo;
    }).length;

    // Protection consistency — how many active horizons exist
    const horizonCount = activeHorizons.length;

    return {
      avgHorizon,
      protectedPct: stateMetrics.protectedPct,
      recentReleases,
      horizonCount,
      commitVsProtect: stateMetrics.committedProtectedRatio,
      activeStatesCount: stateMetrics.activeStatesCount,
      total: balances.totalEloraCapital,
      hasCapital: stateMetrics.hasAnyCapital,
    };
  }, [capital, transactions, now]);

  // ── Generate behavioral observations ──
  const observations = useMemo(() => {
    return generateObservations({
      protectedAmount: capital.balances.protectedCapital,
      availableAmount: capital.balances.availableCapital,
      committedAmount: capital.balances.committedCapital,
      releasingAmount: capital.balances.releasingCapital,
      totalCapital: rhythmMetrics.total,
      activeHorizons: capital.activeHorizons.map((h) => ({
        amount: h.amount,
        durationDays: h.durationDays,
        progress: h.progress,
        canRelease: h.canRelease,
      })),
      totalDeposited: walletStore.total_deposited ?? 0,
      totalSavedFromLosses: walletStore.total_saved_from_losses ?? 0,
      totalProfitWon: walletStore.total_profit_won ?? 0,
      hasTransactions: transactions.length > 0,
      hasAnyActivity: transactions.length > 0 || capital.activeHorizons.length > 0,
    });
  }, [capital, rhythmMetrics, walletStore, transactions]);

  // ── Not connected ──
  if (!isConnected) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-display text-text-primary">Insights</h1>
            <p className="text-body text-text-secondary mt-1">
              Quiet patterns in capital flow.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-12 md:p-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-subtle">
                <Activity className="h-5 w-5 text-text-tertiary" />
              </div>
              <p className="text-sm font-medium text-text-primary">
                Connect your wallet to view insights.
              </p>
              <p className="text-small text-text-tertiary mt-2 max-w-xs">
                Behavioral patterns appear once there is capital activity to observe.
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-display text-text-primary">Insights</h1>
          <p className="text-body text-text-secondary mt-1">
            Quiet patterns in how capital moves, rests, and returns.
          </p>
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-6">
                  <div className="h-3 w-24 bg-surface-hover rounded mb-4" />
                  <div className="h-6 w-16 bg-surface-hover rounded mb-2" />
                  <div className="h-3 w-32 bg-surface-hover rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── No activity state ── */}
        {!loading && !rhythmMetrics.hasCapital && (
          <div className="rounded-xl border border-border bg-surface p-12 md:p-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-subtle">
                <Activity className="h-5 w-5 text-text-tertiary" />
              </div>
              <p className="text-sm font-medium text-text-primary">
                No capital activity yet.
              </p>
              <p className="text-small text-text-tertiary mt-2 max-w-xs">
                Insights will emerge as patterns form through deposits,
                protections, releases, and commitments.
              </p>
            </div>
          </div>
        )}

        {!loading && rhythmMetrics.hasCapital && (
          <>
            {/* ═══════════════════════════════════════ */}
            {/* CAPITAL RHYTHM CARDS                     */}
            {/* ═══════════════════════════════════════ */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-text-primary mb-4">
                Capital rhythm
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                {/* Average protection horizon */}
                {rhythmMetrics.avgHorizon !== null && (
                  <CapitalRhythmCard
                    label="Protection horizon"
                    value={`${rhythmMetrics.avgHorizon} days`}
                    description={`Average across ${rhythmMetrics.horizonCount} horizon${rhythmMetrics.horizonCount === 1 ? "" : "s"}`}
                  />
                )}

                {/* Percentage protected */}
                {rhythmMetrics.protectedPct > 0 && (
                  <CapitalRhythmCard
                    label="Capital protected"
                    value={`${rhythmMetrics.protectedPct}%`}
                    description={`$${formatUSD(capital.balances.protectedCapital)} in protection`}
                  />
                )}

                {/* Release frequency */}
                <CapitalRhythmCard
                  label="Release frequency"
                  value={
                    rhythmMetrics.recentReleases === 0
                      ? "None recent"
                      : `${rhythmMetrics.recentReleases} in 30d`
                  }
                  description={
                    rhythmMetrics.recentReleases === 0
                      ? "No releases in the last 30 days"
                      : `Protection${rhythmMetrics.recentReleases === 1 ? "" : "s"} completed`
                  }
                />

                {/* Protection consistency */}
                <CapitalRhythmCard
                  label="Protection consistency"
                  value={
                    rhythmMetrics.horizonCount === 0
                      ? "None active"
                      : `${rhythmMetrics.horizonCount} active`
                  }
                  description={
                    rhythmMetrics.horizonCount === 0
                      ? "No active protection horizons"
                      : `Horizon${rhythmMetrics.horizonCount === 1 ? "" : "s"} currently in progress`
                  }
                />

                {/* Committed vs protected */}
                {rhythmMetrics.commitVsProtect !== null && (
                  <CapitalRhythmCard
                    label="Committed vs protected"
                    value={`${rhythmMetrics.commitVsProtect}%`}
                    description={`$${formatUSD(capital.balances.committedCapital)} committed to predictions`}
                  />
                )}

                {/* Capital separation */}
                <CapitalRhythmCard
                  label="Capital separation"
                  value={`${rhythmMetrics.activeStatesCount} states`}
                  description="Active capital distribution layers"
                />
              </div>
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* TIMELINE                                 */}
            {/* ═══════════════════════════════════════ */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-text-primary mb-4">
                Capital rhythm
              </h2>
              <EventTimeline events={timelineEvents} />
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* BEHAVIORAL OBSERVATIONS                  */}
            {/* ═══════════════════════════════════════ */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-text-primary mb-4">
                Observations
              </h2>
              {observations.length > 0 ? (
                <div className="space-y-3">
                  {observations.map((obs) => (
                    <BehavioralObservationCard
                      key={obs.id}
                      category={obs.category}
                      text={obs.text}
                      detail={obs.detail}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface p-8">
                  <p className="text-small text-text-tertiary text-center">
                    Observations will appear as more patterns emerge.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
