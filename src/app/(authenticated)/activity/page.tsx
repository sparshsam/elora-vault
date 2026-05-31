"use client";

import { useState, useEffect, useMemo, createElement } from "react";
import type { ComponentType } from "react";
import { useCapitalState } from "@/lib/capital-state";
import { PageShell } from "@/components/layout/page-shell";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Lock,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  History,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────── */

type ActivityEvent = {
  id: string;
  type: "deposit" | "lock" | "release" | "withdrawal" | "bet-placed" | "bet-won" | "bet-lost" | "bet-pushed" | "pending" | "failed";
  amount: string;
  description: string;
  occurredAt: string;
  txHash?: string;
};

/* ── Icon Maps — module scope ──────────────── */

const EVENT_ICONS: Record<ActivityEvent["type"], ComponentType<{ className?: string }>> = {
  deposit: ArrowDownToLine,
  lock: Lock,
  release: CheckCircle,
  withdrawal: ArrowUpFromLine,
  "bet-placed": Clock,
  "bet-won": TrendingUp,
  "bet-lost": TrendingDown,
  "bet-pushed": Minus,
  pending: Clock,
  failed: AlertCircle,
};

const EVENT_COLORS: Record<ActivityEvent["type"], string> = {
  deposit: "text-green-600 bg-green-100 border-green-200",
  lock: "text-green-700 bg-green-50 border-green-200",
  release: "text-green-600 bg-green-100 border-green-200",
  withdrawal: "text-text-secondary bg-surface-subtle border-border",
  "bet-placed": "text-amber-700 bg-amber-50 border-amber-200",
  "bet-won": "text-green-600 bg-green-100 border-green-200",
  "bet-lost": "text-danger bg-danger/8 border-danger/20",
  "bet-pushed": "text-text-secondary bg-surface-subtle border-border",
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  failed: "text-danger bg-danger/8 border-danger/20",
};

const SUMMARY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  protected: Lock,
  locks: RefreshCw,
  released: CheckCircle,
  activity: History,
};

const SUMMARY_COLORS: Record<string, string> = {
  protected: "text-green-700 bg-green-100 border-green-200",
  locks: "text-green-600 bg-green-50 border-green-200",
  released: "text-green-600 bg-green-100 border-green-200",
  activity: "text-text-secondary bg-surface-subtle border-border",
};

/* ── Helpers ───────────────────────────────── */

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs === 0) return `${Math.floor(diffMs / 60000)}m ago`;
    return `${diffHrs}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Summary Card ──────────────────────────── */

interface SummaryCardProps {
  label: string;
  value: string;
  subtext: string;
  iconType: string;
}

function SummaryCard({ label, value, subtext, iconType }: SummaryCardProps) {
  const Icon = SUMMARY_ICONS[iconType] || History;
  const colorClass = SUMMARY_COLORS[iconType] || SUMMARY_COLORS.activity;
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-4 md:p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">{label}</span>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", colorClass)}>
          {createElement(Icon, { className: "h-3.5 w-3.5" })}
        </div>
      </div>
      <p className="text-heading font-medium text-text-primary">{value}</p>
      <p className="text-tiny text-text-muted mt-0.5">{subtext}</p>
    </div>
  );
}

/* ── Timeline Item ─────────────────────────── */

interface TimelineItemProps {
  event: ActivityEvent;
  isLast: boolean;
}

function TimelineItem({ event, isLast }: TimelineItemProps) {
  const Icon = EVENT_ICONS[event.type];
  const colorClass = EVENT_COLORS[event.type];

  return (
    <div className="relative flex gap-4 md:gap-5">
      <div className="flex flex-col items-center">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", colorClass)}>
          {createElement(Icon, { className: "h-4 w-4" })}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />}
      </div>

      <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-tiny font-medium capitalize", colorClass)}>
                {event.type === "bet-placed"
                  ? "Bet logged"
                  : event.type === "bet-won"
                    ? "Bet won"
                    : event.type === "bet-lost"
                      ? "Bet lost"
                      : event.type === "bet-pushed"
                        ? "Bet pushed"
                        : event.type === "release"
                          ? "Released"
                          : event.type === "withdrawal"
                            ? "Withdrawal"
                            : event.type === "deposit"
                              ? "Deposit"
                              : event.type}
              </span>
            </div>
          </div>

          <p className="text-small text-text-secondary leading-relaxed">{event.description}</p>

          <div className="flex items-center gap-3 text-tiny text-text-muted">
            <span>{formatDate(event.occurredAt)}</span>
            {event.txHash && (
              <a href={`https://sepolia.basescan.org/tx/${event.txHash}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-text-muted hover:text-green-600 transition-colors">
                {event.txHash} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ───────────────────────────── */

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-surface p-12 md:p-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-subtle">
          <History className="h-5 w-5 text-text-tertiary" />
        </div>
        <p className="text-sm font-medium text-text-primary">No movement yet.</p>
        <p className="text-small text-text-tertiary mt-2 max-w-xs">
          Your activity will appear here once capital is deposited, protected,
          released, bet on, or withdrawn.
        </p>
      </div>
    </div>
  );
}

/* ── Transaction → ActivityEvent ───────────── */

function txToEvent(tx: Record<string, unknown>): ActivityEvent | null {
  const typeMap: Record<string, ActivityEvent["type"]> = {
    DEPOSIT: "deposit",
    BET_PLACED: "bet-placed",
    WIN_PROFIT: "bet-won",
    LOSS_TO_SAVINGS: "bet-lost",
    PUSH_RETURN: "bet-pushed",
    WITHDRAWAL: "withdrawal",
    LOCK_CREATED: "lock",
    LOCK_RELEASED: "release",
    ONCHAIN_DEPOSIT: "deposit",
    ONCHAIN_LOCK_CREATED: "lock",
    ONCHAIN_LOCK_RELEASED: "release",
    ONCHAIN_WITHDRAWAL: "withdrawal",
  };

  const txType = tx.type as string;
  const mapped = typeMap[txType];
  if (!mapped) return null;

  const amount = typeof tx.amount === "number" ? tx.amount : 0;
  let description = (tx.description as string) || "";

  // Fallback descriptions for bet-related events
  if (!description) {
    if (txType === "BET_PLACED") description = "Bet logged. Stake moved to Committed.";
    else if (txType === "WIN_PROFIT") description = "Bet won. Return added to Available.";
    else if (txType === "LOSS_TO_SAVINGS") description = "Bet lost. Stake removed from active capital.";
    else if (txType === "PUSH_RETURN") description = "Bet pushed. Stake returned to Available.";
  }

  return {
    id: tx.id as string,
    type: mapped,
    amount: formatUSD(amount),
    description,
    occurredAt: (tx.createdAt as string) || new Date().toISOString(),
    txHash: (tx.tx_hash as string) || undefined,
  };
}

/* ── Page ──────────────────────────────────── */

export default function ActivityPage() {
  const capital = useCapitalState();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/wallet/transactions?limit=50");
        if (res.ok) {
          const data = await res.json();
          const txEvents: ActivityEvent[] = (data.transactions || [])
            .map(txToEvent)
            .filter(Boolean) as ActivityEvent[];
          setEvents(txEvents);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Summary counts ──
  const recentCount = useMemo(
    () => events.filter((e) => {
      const diff = now - new Date(e.occurredAt).getTime();
      return diff < 7 * 86400000;
    }).length,
    [events, now],
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-display text-text-primary">Activity</h1>
          <p className="text-body text-text-secondary mt-1">
            A quiet record of how your capital moves, protects, bets, and returns.
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <SummaryCard label="Protected" value={`$${capital.formatted.protected}`} subtext="Currently in protection" iconType="protected" />
          <SummaryCard
            label={`Active Horizon${capital.activeHorizonCount === 1 ? "" : "s"}`}
            value={String(capital.activeHorizonCount)}
            subtext="Protection periods active"
            iconType="locks"
          />
          <SummaryCard label="Committed" value={`$${capital.formatted.committed}`} subtext="Capital in open bets" iconType="released" />
          <SummaryCard label="Activity" value={String(recentCount)} subtext="Events this week" iconType="activity" />
        </div>

        {/* ── Timeline ── */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-6">
                <div className="h-4 w-48 bg-surface-hover rounded mb-3" />
                <div className="h-3 w-32 bg-surface-hover rounded" />
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="rounded-xl border border-border bg-surface shadow-sm p-6 md:p-8">
            <div className="space-y-0">
              {events.map((event, index) => (
                <TimelineItem key={event.id} event={event} isLast={index === events.length - 1} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </PageShell>
  );
}
