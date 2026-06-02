"use client";

import { useState, useEffect, useMemo, createElement } from "react";
import type { ComponentType } from "react";
import { useCapitalState } from "@/lib/capital-state";
import { PageShell } from "@/components/layout/page-shell";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Lock,
  Unlock,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  History,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TX_TYPES, normalizeTransactionType } from "@/lib/transaction-types";
import { readPolicyActivity } from "@/lib/policies/policy-suggestions";
import type { PolicyActivityEvent } from "@/app/api/policies/activity/route";
import type { PolicyActivityEvent as SuggestionEvent } from "@/lib/policies/policy-suggestions";

// ── Reconciliation Status ────────────────────────

type ReconciliationStatus =
  | "confirmed"      // Has tx_hash — onchain confirmed
  | "pending"        // No tx_hash, created recently
  | "local-record"   // No tx_hash, created >1 hour ago
  | "failed"         // Explicitly marked as failed
  | "needs-review";  // Unusual state

const RECONCILIATION_CONFIG: Record<ReconciliationStatus, {
  label: string;
  dot: string;
  bg: string;
  text: string;
}> = {
  confirmed: {
    label: "Confirmed",
    dot: "bg-green-500",
    bg: "bg-green-50/60",
    text: "text-green-700",
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    bg: "bg-amber-50/40",
    text: "text-amber-700",
  },
  "local-record": {
    label: "Local record",
    dot: "bg-text-muted",
    bg: "bg-surface-subtle",
    text: "text-text-tertiary",
  },
  failed: {
    label: "Failed",
    dot: "bg-danger",
    bg: "bg-red-50/40",
    text: "text-danger",
  },
  "needs-review": {
    label: "Needs review",
    dot: "bg-amber-500",
    bg: "bg-amber-50/60",
    text: "text-amber-700",
  },
};

function determineStatus(txHash?: string, createdAt?: string, now: number = Date.now()): ReconciliationStatus {
  if (txHash) return "confirmed";
  if (!createdAt) return "needs-review";
  const createdAtMs = safeDateMs(createdAt);
  if (createdAtMs === null) return "needs-review";
  const age = now - createdAtMs;
  if (age < 60 * 60 * 1000) return "pending";
  return "local-record";
}

// ── Event Types ──────────────────────────────────

type ActivityEventType =
  | "deposit"
  | "withdrawal"
  | "protection-created"
  | "protection-released"
  | "profit-protected"
  | "prediction-created"
  | "prediction-won"
  | "prediction-lost"
  | "prediction-pushed"
  | "policy-created"
  | "policy-activated"
  | "policy-paused"
  | "policy-suggestion-generated"
  | "policy-suggestion-accepted"
  | "policy-suggestion-dismissed"
  | "pending"
  | "failed";

interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  amount: string;
  rawAmount: number;
  description: string;
  occurredAt: string;
  occurredAtMs: number;
  txHash?: string;
  status: ReconciliationStatus;
  balanceBefore?: number;
  balanceAfter?: number;
}

// ── Icon & Color Maps ────────────────────────────

const EVENT_ICONS: Record<ActivityEventType, ComponentType<{ className?: string }>> = {
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  "protection-created": Lock,
  "protection-released": Unlock,
  "profit-protected": ShieldCheck,
  "prediction-created": Clock,
  "prediction-won": TrendingUp,
  "prediction-lost": TrendingDown,
  "prediction-pushed": Minus,
  "policy-created": ShieldCheck,
  "policy-activated": ShieldCheck,
  "policy-paused": History,
  "policy-suggestion-generated": AlertCircle,
  "policy-suggestion-accepted": CheckCircle,
  "policy-suggestion-dismissed": Minus,
  pending: Clock,
  failed: AlertCircle,
};

const EVENT_COLORS: Record<ActivityEventType, string> = {
  deposit: "text-green-600 bg-green-100 border-green-200",
  withdrawal: "text-text-secondary bg-surface-subtle border-border",
  "protection-created": "text-green-700 bg-green-50 border-green-200",
  "protection-released": "text-green-600 bg-green-100 border-green-200",
  "profit-protected": "text-green-700 bg-green-100 border-green-200",
  "prediction-created": "text-amber-700 bg-amber-50 border-amber-200",
  "prediction-won": "text-green-600 bg-green-100 border-green-200",
  "prediction-lost": "text-danger bg-danger/8 border-danger/20",
  "prediction-pushed": "text-text-secondary bg-surface-subtle border-border",
  "policy-created": "text-green-700 bg-green-50 border-green-200",
  "policy-activated": "text-green-600 bg-green-100 border-green-200",
  "policy-paused": "text-text-secondary bg-surface-subtle border-border",
  "policy-suggestion-generated": "text-amber-700 bg-amber-50 border-amber-200",
  "policy-suggestion-accepted": "text-green-600 bg-green-100 border-green-200",
  "policy-suggestion-dismissed": "text-text-secondary bg-surface-subtle border-border",
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  failed: "text-danger bg-danger/8 border-danger/20",
};

const EVENT_LABELS: Record<ActivityEventType, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  "protection-created": "Protected",
  "protection-released": "Released",
  "profit-protected": "Profit protected",
  "prediction-created": "Prediction created",
  "prediction-won": "Prediction won",
  "prediction-lost": "Prediction lost",
  "prediction-pushed": "Prediction pushed",
  "policy-created": "Policy created",
  "policy-activated": "Policy activated",
  "policy-paused": "Policy paused",
  "policy-suggestion-generated": "Suggestion",
  "policy-suggestion-accepted": "Suggestion accepted",
  "policy-suggestion-dismissed": "Suggestion dismissed",
  pending: "Pending",
  failed: "Failed",
};

const SUMMARY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  protected: Lock,
  locks: RefreshCw,
  released: Unlock,
  activity: History,
};

const SUMMARY_COLORS: Record<string, string> = {
  protected: "text-green-700 bg-green-100 border-green-200",
  locks: "text-green-600 bg-green-50 border-green-200",
  released: "text-green-600 bg-green-100 border-green-200",
  activity: "text-text-secondary bg-surface-subtle border-border",
};

// ── Helpers ──────────────────────────────────────

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatShortDate(dateStr: string): string {
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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return "Unknown";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return "Undated";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - eventDay.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function capitalizeType(type: ActivityEventType): string {
  return EVENT_LABELS[type] || type;
}

function safeDateMs(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

// ── Summary Card ────────────────────────────────

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

// ── Reconciliation Badge (inline) ────────────────

function EventReconciliationBadge({ status }: { status: ReconciliationStatus }) {
  const cfg = RECONCILIATION_CONFIG[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
      status === "confirmed" ? "border-green-200" :
      status === "pending" ? "border-amber-200" :
      status === "failed" ? "border-red-200" :
      "border-border",
      cfg.bg,
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      <span className={cn("text-[10px] font-medium", cfg.text)}>{cfg.label}</span>
    </span>
  );
}

// ── Capital Movement ────────────────────────────

function CapitalMovement({ before, after }: { before?: number; after?: number }) {
  if (before === undefined || after === undefined) return null;
  const diff = after - before;
  const isPositive = diff >= 0;
  return (
    <span className="text-[11px] font-medium tabular-nums text-text-muted">
      <span className="text-text-tertiary">Balance:</span> ${formatUSD(before)} → ${formatUSD(after)}
      <span className={cn(isPositive ? "text-green-600" : "text-danger", "ml-1")}>
        {isPositive ? "+" : ""}{formatUSD(diff)}
      </span>
    </span>
  );
}

// ── Timeline Item ───────────────────────────────

interface TimelineItemProps {
  event: ActivityEvent;
  isLastInGroup: boolean;
  isLast: boolean;
}

function TimelineItem({ event, isLastInGroup, isLast }: TimelineItemProps) {
  const Icon = EVENT_ICONS[event.type];
  const colorClass = EVENT_COLORS[event.type];
  const showConnector = !isLast;
  const showGroupConnector = !isLastInGroup;

  return (
    <div className="relative flex gap-4 md:gap-5">
      {/* Icon column */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
          colorClass,
        )}>
          {createElement(Icon, { className: "h-4 w-4" })}
        </div>
        {showConnector && showGroupConnector && (
          <div className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1", isLast ? "pb-0" : "pb-6")}>
        <div className="flex flex-col gap-1.5">
          {/* Top row: type badge + amount + reconciliation */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-tiny font-medium",
                colorClass,
              )}>
                {capitalizeType(event.type)}
              </span>
              <EventReconciliationBadge status={event.status} />
            </div>
            <span className={cn(
              "text-sm font-semibold tabular-nums shrink-0",
              event.type === "deposit" || event.type === "prediction-won" || event.type === "protection-released"
                ? "text-green-700"
                : event.type === "withdrawal" || event.type === "prediction-lost"
                  ? "text-text-primary"
                  : "text-text-primary",
            )}>
              {event.type === "withdrawal" || event.type === "prediction-lost" ? "-" : ""}${event.amount}
            </span>
          </div>

          {/* Description */}
          <p className="text-small text-text-secondary leading-relaxed">{event.description}</p>

          {/* Capital movement */}
          {(event.balanceBefore !== undefined || event.balanceAfter !== undefined) && (
            <p className="mt-0.5">
              <CapitalMovement before={event.balanceBefore} after={event.balanceAfter} />
            </p>
          )}

          {/* Time + tx hash */}
          <div className="flex items-center gap-3 text-tiny text-text-muted">
            <span>{formatShortDate(event.occurredAt)} · {formatTime(event.occurredAt)}</span>
            {event.txHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${event.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-green-600 transition-colors"
              >
                {event.txHash.slice(0, 10)}…
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Date Group Section ───────────────────────────

interface DateGroupSectionProps {
  label: string;
  events: ActivityEvent[];
  isLastGroup: boolean;
}

function DateGroupSection({ label, events, isLastGroup }: DateGroupSectionProps) {
  if (events.length === 0) return null;
  return (
    <div className={cn(isLastGroup ? "" : "mb-8")}>
      <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-4 px-1">
        {label}
      </h2>
      <div className="rounded-xl border border-border bg-surface shadow-sm p-6 md:p-8">
        {events.map((event, index) => (
          <TimelineItem
            key={event.id}
            event={event}
            isLastInGroup={index === events.length - 1}
            isLast={index === events.length - 1 && isLastGroup}
          />
        ))}
      </div>
    </div>
  );
}

// ── Empty State ─────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-surface p-12 md:p-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-subtle">
          <History className="h-6 w-6 text-text-tertiary" />
        </div>
        <p className="text-sm font-medium text-text-primary">No capital movement yet</p>
        <p className="text-small text-text-tertiary mt-2 max-w-sm leading-relaxed">
          Your activity timeline will record every deposit, protection, release, and prediction as it happens. Elora builds a quiet chronicle of how your capital moves over time.
        </p>
      </div>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-6">
          <div className="flex gap-4">
            <div className="h-9 w-9 rounded-full bg-surface-hover shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 bg-surface-hover rounded" />
                <div className="h-4 w-16 bg-surface-hover rounded" />
              </div>
              <div className="h-3 w-3/4 bg-surface-hover rounded" />
              <div className="h-3 w-1/3 bg-surface-hover rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Policy Activity → ActivityEvent ─────────────

/**
 * Convert a PolicyActivityEvent (from DB-derived API) to an ActivityEvent.
 */
function policyEventToActivity(policy: PolicyActivityEvent): ActivityEvent {
  const occurredAtMs = safeDateMs(policy.occurredAt) ?? Date.now();
  const occurredAt = safeDateMs(policy.occurredAt) === null
    ? new Date(occurredAtMs).toISOString()
    : policy.occurredAt;

  return {
    id: `policy:${policy.id}`,
    type: policy.type as ActivityEventType,
    amount: "—",
    rawAmount: 0,
    description: policy.description || "Policy activity recorded.",
    occurredAt,
    occurredAtMs,
    status: "local-record",
  };
}

/**
 * Convert a PolicyActivityEvent (localStorage suggestion event) to an ActivityEvent.
 * Returns null if the suggestion status doesn't map to a timeline event.
 */
function suggestionEventToActivity(event: SuggestionEvent): ActivityEvent | null {
  const typeMap: Record<string, ActivityEventType> = {
    generated: "policy-suggestion-generated",
    accepted: "policy-suggestion-accepted",
    dismissed: "policy-suggestion-dismissed",
  };

  const mapped = typeMap[event.status];
  if (!mapped) return null;

  // Skip "expired" and "snoozed" — they're not useful timeline entries
  if (event.status === "expired" || event.status === "snoozed") return null;

  const occurredAtMs = safeDateMs(event.timestamp);
  if (occurredAtMs === null) return null;

  return {
    id: `suggestion:${event.id}`,
    type: mapped,
    amount: "—",
    rawAmount: 0,
    description: `${event.title} — ${event.sourcePolicy}`,
    occurredAt: event.timestamp,
    occurredAtMs,
    status: "local-record",
  };
}

// ── Transaction → ActivityEvent ─────────────────

function txToEvent(tx: Record<string, unknown>): ActivityEvent | null {
  const typeMap: Record<string, ActivityEventType> = {
    [TX_TYPES.depositCompleted]: "deposit",
    [TX_TYPES.predictionCreated]: "prediction-created",
    [TX_TYPES.predictionWon]: "prediction-won",
    [TX_TYPES.predictionLost]: "prediction-lost",
    [TX_TYPES.predictionPushed]: "prediction-pushed",
    [TX_TYPES.withdrawalCompleted]: "withdrawal",
    [TX_TYPES.protectionCreated]: "protection-created",
    [TX_TYPES.protectionReleased]: "protection-released",
  };

  const txType = normalizeTransactionType(tx.type as string);
  let mapped = typeMap[txType];
  if (!mapped) return null;

  const amount = typeof tx.amount === "number" ? tx.amount : 0;
  const description = (tx.description as string) || "";
  const createdAt = (tx.createdAt as string) || new Date().toISOString();
  const occurredAtMs = safeDateMs(createdAt) ?? Date.now();
  const txHash = (tx.tx_hash as string) || undefined;
  const now = Date.now();

  // Detect profit-protected: a protection created after a win
  // Inferred from description keywords since there's no separate DB type
  if (mapped === "protection-created" && description.toLowerCase().includes("profit")) {
    mapped = "profit-protected";
  }

  let displayDescription = description;
  if (!displayDescription) {
    if (mapped === "deposit") displayDescription = "Capital deposited into Elora.";
    else if (mapped === "withdrawal") displayDescription = "Capital withdrawn from Elora.";
    else if (mapped === "protection-created") displayDescription = "Capital moved into a protection horizon.";
    else if (mapped === "profit-protected") displayDescription = "Profit from a prediction moved into protection.";
    else if (mapped === "protection-released") displayDescription = "Protected capital returned to availability.";
    else if (mapped === "prediction-created") displayDescription = "Capital committed to a prediction.";
    else if (mapped === "prediction-won") displayDescription = "Prediction won. Return added to available capital.";
    else if (mapped === "prediction-lost") displayDescription = "Prediction lost.";
    else if (mapped === "prediction-pushed") displayDescription = "Prediction pushed. Stake returned.";
  }

  return {
    id: `tx:${tx.id as string}`,
    type: mapped,
    amount: formatUSD(amount),
    rawAmount: amount,
    description: displayDescription,
    occurredAt: createdAt,
    occurredAtMs,
    txHash,
    status: determineStatus(txHash, createdAt, now),
    balanceBefore: typeof tx.balanceBefore === "number" ? tx.balanceBefore : undefined,
    balanceAfter: typeof tx.balanceAfter === "number" ? tx.balanceAfter : undefined,
  };
}

// ── Page ────────────────────────────────────────

export default function ActivityPage() {
  const capital = useCapitalState();
  const [rawEvents, setRawEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    (async () => {
      const allEvents: ActivityEvent[] = [];

      try {
        // 1. Financial transactions from the database
        const txRes = await fetch("/api/wallet/transactions?limit=100");
        if (txRes.ok) {
          const data = await txRes.json();
          const txEvents: ActivityEvent[] = (data.transactions || [])
            .map(txToEvent)
            .filter(Boolean) as ActivityEvent[];
          allEvents.push(...txEvents);
        }
      } catch {
        // silently fail
      }

      try {
        // 2. Policy lifecycle events (created, activated, paused)
        const policyRes = await fetch("/api/policies/activity");
        if (policyRes.ok) {
          const data = await policyRes.json();
          const policyEvents: ActivityEvent[] = (data.events || [])
            .map(policyEventToActivity)
            .filter(Boolean) as ActivityEvent[];
          allEvents.push(...policyEvents);
        }
      } catch {
        // silently fail
      }

      // 3. Policy suggestion events from localStorage
      //    (generated, accepted, dismissed — tracked client-side)
      const suggestionRecords = readPolicyActivity();
      const suggestionEvents: ActivityEvent[] = suggestionRecords
        .map(suggestionEventToActivity)
        .filter(Boolean) as ActivityEvent[];
      allEvents.push(...suggestionEvents);

      const uniqueEvents = Array.from(new Map(allEvents.map((event) => [event.id, event])).values());

      // Sort all events by time, most recent first
      uniqueEvents.sort((a, b) => b.occurredAtMs - a.occurredAtMs);

      setRawEvents(uniqueEvents);
      setLoading(false);
    })();
  }, []);

  // ── Group by date ──
  const dateGroups = useMemo(() => {
    const groups: { label: string; events: ActivityEvent[] }[] = [];
    const groupMap = new Map<string, ActivityEvent[]>();

    for (const event of rawEvents) {
      const label = getDateGroup(event.occurredAt);
      if (!groupMap.has(label)) groupMap.set(label, []);
      groupMap.get(label)!.push(event);
    }

    // Preserve chronological order within groups, groups in reverse chronological
    const order = ["Today", "Yesterday"];
    const sorted = Array.from(groupMap.entries()).sort((a, b) => {
      const aIdx = order.indexOf(a[0]);
      const bIdx = order.indexOf(b[0]);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0; // For weekday/month groups, keep insertion order
    });

    for (const [label, evts] of sorted) {
      groups.push({ label, events: evts });
    }

    return groups;
  }, [rawEvents]);

  // ── Summary counts ──
  const summary = useMemo(() => {
    const recentCount = rawEvents.filter((e) => now - e.occurredAtMs < 7 * 86400000).length;
    const pendingCount = rawEvents.filter((e) => e.status === "pending").length;
    return { recentCount, pendingCount };
  }, [rawEvents, now]);

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-display text-text-primary">Activity</h1>
          <p className="text-body text-text-secondary mt-1">
            A quiet record of how your capital moves and returns.
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <SummaryCard label="Protected" value={`$${capital.formatted.protected}`} subtext="Currently in protection" iconType="protected" />
          <SummaryCard
            label={`Active Horizon${capital.activeHorizonCount === 1 ? "" : "s"}`}
            value={String(capital.activeHorizonCount)}
            subtext="Horizons active"
            iconType="locks"
          />
          <SummaryCard label="Committed" value={`$${capital.formatted.committed}`} subtext="Capital in active predictions" iconType="released" />
          <SummaryCard label="Activity" value={String(summary.recentCount)} subtext="Events this week" iconType="activity" />
        </div>

        {/* ── Timeline ── */}
        {loading ? (
          <TimelineSkeleton />
        ) : rawEvents.length > 0 ? (
          <div className="space-y-0">
            {dateGroups.map((group, idx) => (
              <DateGroupSection
                key={group.label}
                label={group.label}
                events={group.events}
                isLastGroup={idx === dateGroups.length - 1}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {/* ── Pending notice ── */}
        {!loading && summary.pendingCount > 0 && (
          <p className="text-tiny text-text-muted text-center mt-6 leading-relaxed max-w-md mx-auto">
            {summary.pendingCount} event{summary.pendingCount === 1 ? "" : "s"} pending onchain confirmation.
            Records update automatically when transactions are confirmed.
          </p>
        )}
      </div>
    </PageShell>
  );
}
