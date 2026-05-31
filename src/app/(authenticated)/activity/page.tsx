"use client";

import { createElement } from "react";
import { useCapitalState } from "@/lib/capital-state";
import { PageShell } from "@/components/layout/page-shell";
import {
  Lock,
  CheckCircle,
  History,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUMMARY_ICONS: Record<string, import("lucide-react").LucideIcon> = {
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
            label={`Active Horizon${capital.activeHorizonCount === 1 ? "" : "s"}`}
            value={String(capital.activeHorizonCount)}
            subtext="Protection periods active"
            iconType="locks"
          />
          <SummaryCard
            label="Released"
            value="$0.00"
            subtext="Horizons completed"
            iconType="released"
          />
          <SummaryCard
            label="Activity"
            value="0"
            subtext="Events this week"
            iconType="activity"
          />
        </div>

        {/* ── Timeline (empty until real events flow) ── */}
        <EmptyState />
      </div>
    </PageShell>
  );
}
