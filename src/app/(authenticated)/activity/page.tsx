"use client";

import { useState, useMemo, useEffect, createElement } from "react";
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
  ExternalLink,
  History,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────── */

type ActivityEvent = {
  id: string;
  type: "deposit" | "lock" | "release" | "withdrawal" | "pending" | "failed";
  amount: string;
  asset: "USDC";
  occurredAt: string;
  status: "complete" | "pending" | "failed";
  description: string;
  txHash?: string;
};

type FilterType = "all" | "deposit" | "lock" | "release" | "withdrawal";

/* ── Icon Maps — module scope, no render-time creation ── */

const EVENT_ICONS: Record<ActivityEvent["type"], ComponentType<{ className?: string }>> = {
  deposit: ArrowDownToLine,
  lock: Lock,
  release: CheckCircle,
  withdrawal: ArrowUpFromLine,
  pending: Clock,
  failed: AlertCircle,
};

const EVENT_COLORS: Record<ActivityEvent["type"], string> = {
  deposit: "text-green-600 bg-green-100 border-green-200",
  lock: "text-green-700 bg-green-50 border-green-200",
  release: "text-green-600 bg-green-100 border-green-200",
  withdrawal: "text-text-secondary bg-surface-subtle border-border",
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

/* ── Mock Data ─────────────────────────────── */
/* Updated microcopy: betting-origin references are subtle, mature, restrained. */

const MOCK_EVENTS: ActivityEvent[] = [
  {
    id: "evt-01",
    type: "deposit",
    amount: "2500.00",
    asset: "USDC",
    occurredAt: "2026-05-28T14:30:00Z",
    status: "complete",
    description: "Bankroll allocation deposited.",
    txHash: "0xabcd...ef01",
  },
  {
    id: "evt-02",
    type: "lock",
    amount: "1000.00",
    asset: "USDC",
    occurredAt: "2026-05-28T14:35:00Z",
    status: "complete",
    description: "Session gains protected for 30 days.",
    txHash: "0xabcd...ef02",
  },
  {
    id: "evt-03",
    type: "deposit",
    amount: "500.00",
    asset: "USDC",
    occurredAt: "2026-05-29T09:15:00Z",
    status: "complete",
    description: "Bankroll allocation deposited.",
    txHash: "0xabcd...ef03",
  },
  {
    id: "evt-04",
    type: "lock",
    amount: "500.00",
    asset: "USDC",
    occurredAt: "2026-05-29T09:20:00Z",
    status: "complete",
    description: "Session balance moved into protection.",
    txHash: "0xabcd...ef04",
  },
  {
    id: "evt-05",
    type: "release",
    amount: "1000.00",
    asset: "USDC",
    occurredAt: "2026-05-30T14:35:00Z",
    status: "complete",
    description: "30-day horizon ended. Capital returning to available balance.",
    txHash: "0xabcd...ef05",
  },
  {
    id: "evt-06",
    type: "withdrawal",
    amount: "400.00",
    asset: "USDC",
    occurredAt: "2026-05-31T06:00:00Z",
    status: "complete",
    description: "Capital returned to connected wallet.",
    txHash: "0xabcd...ef06",
  },
  {
    id: "evt-07",
    type: "deposit",
    amount: "3000.00",
    asset: "USDC",
    occurredAt: "2026-05-31T12:00:00Z",
    status: "complete",
    description: "Bankroll allocation deposited.",
    txHash: "0xabcd...ef07",
  },
  {
    id: "evt-08",
    type: "lock",
    amount: "2000.00",
    asset: "USDC",
    occurredAt: "2026-05-31T12:05:00Z",
    status: "pending",
    description: "Capital preserved — 90-day horizon requested.",
  },
  {
    id: "evt-09",
    type: "pending",
    amount: "1000.00",
    asset: "USDC",
    occurredAt: "2026-05-31T12:10:00Z",
    status: "pending",
    description: "Onchain transaction submitted. Confirming...",
  },
  {
    id: "evt-10",
    type: "failed",
    amount: "500.00",
    asset: "USDC",
    occurredAt: "2026-05-31T10:30:00Z",
    status: "failed",
    description: "Protection failed. Insufficient balance.",
  },
];

/* ── Helpers ───────────────────────────────── */

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "deposit", label: "Deposits" },
  { key: "lock", label: "Protections" },
  { key: "release", label: "Releases" },
  { key: "withdrawal", label: "Withdrawals" },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs === 0) {
      const diffMin = Math.floor(diffMs / 60000);
      return `${diffMin}m ago`;
    }
    return `${diffHrs}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: string): string {
  const n = parseFloat(amount);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
        <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </span>
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg border",
            colorClass,
          )}
        >
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

  const statusLabel =
    event.status === "pending"
      ? "Pending"
      : event.status === "failed"
        ? "Failed"
        : null;

  return (
    <div className="relative flex gap-4 md:gap-5">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
            colorClass,
          )}
        >
          {createElement(Icon, { className: "h-4 w-4" })}
        </div>
        {/* Line */}
        {!isLast && (
          <div className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
        <div className="flex flex-col gap-1.5">
          {/* Top row: type badge + amount */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-tiny font-medium capitalize",
                  colorClass,
                )}
              >
                {event.type === "release"
                  ? "Released"
                  : event.type === "withdrawal"
                    ? "Withdrawal"
                    : event.type === "deposit"
                      ? "Deposit"
                      : event.type === "lock"
                        ? "Protected"
                        : event.type}
              </span>
              {statusLabel && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                    event.status === "pending"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-danger/8 text-danger border border-danger/20",
                  )}
                >
                  {statusLabel}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                event.type === "deposit" || event.type === "release"
                  ? "text-green-600"
                  : event.type === "withdrawal"
                    ? "text-text-primary"
                    : "text-text-primary",
              )}
            >
              {event.type === "deposit" || event.type === "release"
                ? "+"
                : event.type === "withdrawal"
                  ? "–"
                  : ""}
              ${formatAmount(event.amount)}
            </span>
          </div>

          {/* Description */}
          <p className="text-small text-text-secondary leading-relaxed">
            {event.description}
          </p>

          {/* Bottom row: date + tx link */}
          <div className="flex items-center gap-3 text-tiny text-text-muted">
            <span>{formatDate(event.occurredAt)}</span>
            {event.txHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${event.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-text-muted hover:text-green-600 transition-colors"
              >
                {event.txHash}
                <ExternalLink className="h-3 w-3" />
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
        <p className="text-sm font-medium text-text-primary">
          No movement yet.
        </p>
        <p className="text-small text-text-tertiary mt-2 max-w-xs">
          Your activity will appear here once capital is deposited, protected,
          released, or withdrawn.
        </p>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────── */

export default function ActivityPage() {
  const capital = useCapitalState();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return MOCK_EVENTS;
    return MOCK_EVENTS.filter((e) => e.type === activeFilter);
  }, [activeFilter]);

  // ── Summary derived from SHARED capital state + mock history ──
  const summary = useMemo(() => {
    const completed = MOCK_EVENTS.filter((e) => e.status === "complete");
    const totalProtected = completed
      .filter((e) => e.type === "lock")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const releasedFunds = completed
      .filter((e) => e.type === "release")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const recentMovement = MOCK_EVENTS.filter((e) => {
      const diff = now - new Date(e.occurredAt).getTime();
      return diff < 7 * 86400000;
    }).length;

    return {
      totalProtected: totalProtected.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      activeLocks: capital.activeHorizonCount,
      releasedFunds: releasedFunds.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      recentMovement,
    };
  }, [now, capital.activeHorizonCount]);

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-display text-text-primary">Activity</h1>
          <p className="text-body text-text-secondary mt-1">
            A quiet record of how your capital moves, protects, and returns.
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <SummaryCard
            label="Protected"
            value={`$${capital.formatted.protected}`}
            subtext="Currently in protection"
            iconType="protected"
          />
          <SummaryCard
            label={`Active Horizon${capital.activeHorizonCount === 1 ? '' : 's'}`}
            value={String(capital.activeHorizonCount)}
            subtext="Protection periods active"
            iconType="locks"
          />
          <SummaryCard
            label="Released"
            value={`$${summary.releasedFunds}`}
            subtext="Horizons completed"
            iconType="released"
          />
          <SummaryCard
            label="Activity"
            value={String(summary.recentMovement)}
            subtext="Events this week"
            iconType="activity"
          />
        </div>

        {/* ── Filter Chips ── */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-small font-medium transition-all duration-200",
                activeFilter === f.key
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-surface text-text-tertiary border border-border hover:border-border-hover hover:text-text-secondary",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Timeline ── */}
        {filteredEvents.length > 0 ? (
          <div className="rounded-xl border border-border bg-surface shadow-sm p-6 md:p-8">
            <div className="space-y-0">
              {filteredEvents.map((event, index) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  isLast={index === filteredEvents.length - 1}
                />
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
