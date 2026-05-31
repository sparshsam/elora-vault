"use client";

import { useMemo } from "react";
import { useCapitalState } from "@/lib/capital-state";
import { PageShell } from "@/components/layout/page-shell";
import {
  Lock,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Icon Maps — module scope, no render-time creation ── */

const SUMMARY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  protected: Lock,
  releasing: Clock,
  intent: Target,
};

const SUMMARY_COLORS: Record<string, string> = {
  protected: "text-green-700 bg-green-100 border-green-200",
  releasing: "text-amber-700 bg-amber-50 border-amber-200",
  intent: "text-text-secondary bg-surface-subtle border-border",
};

/* ── Summary Card ──────────────────────────── */

interface SummaryCardProps {
  label: string;
  value: string;
  subtext: string;
  iconType: string;
}

function SummaryCard({ label, value, subtext, iconType }: SummaryCardProps) {
  const Icon = SUMMARY_ICONS[iconType] || Target;
  const colorClass = SUMMARY_COLORS[iconType] || SUMMARY_COLORS.intent;
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
          {Icon && <Icon className="h-3.5 w-3.5" />}
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
          <Target className="h-5 w-5 text-text-tertiary" />
        </div>
        <p className="text-sm font-medium text-text-primary">
          Nothing requires attention right now.
        </p>
        <p className="text-small text-text-tertiary mt-2 max-w-xs">
          Protected capital continues according to its existing timelines.
        </p>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────── */

export default function IntentPage() {
  const capital = useCapitalState();

  const releasingCount = useMemo(
    () => capital.activeHorizons.filter((h) => h.released && !h.withdrawn).length,
    [capital.activeHorizons],
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-display text-text-primary">Intent</h1>
          <p className="text-body text-text-secondary mt-1">
            A place to slow down before capital moves.
          </p>
        </div>

        {/* ── Overview Summary Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <SummaryCard
            label="Protected"
            value={`$${capital.formatted.protected}`}
            subtext="Currently in protection"
            iconType="protected"
          />
          <SummaryCard
            label="Releasing"
            value={String(releasingCount)}
            subtext="Horizons ending soon"
            iconType="releasing"
          />
          <SummaryCard
            label="Intent"
            value="0"
            subtext="Decisions awaiting attention"
            iconType="intent"
          />
        </div>

        {/* ── Empty state — no decisions to show ── */}
        <EmptyState />
      </div>
    </PageShell>
  );
}
