"use client";

import { useState, useMemo, useEffect, useCallback, createElement } from "react";
import type { ComponentType } from "react";
import { useCapitalState } from "@/lib/capital-state";
import { PageShell } from "@/components/layout/page-shell";
import {
  Lock,
  CheckCircle,
  Clock,
  Target,
  ArrowRight,
  ArrowUpFromLine,
  Timer,
  Shield,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────── */

type DecisionType =
  | "release-ready"
  | "lock-ending"
  | "extend-option"
  | "withdrawal-review"
  | "pending-unlock";

type DecisionStatus = "actionable" | "pending" | "completed";

interface IntentDecision {
  id: string;
  type: DecisionType;
  title: string;
  description: string;
  amount: string;
  asset: "USDC";
  status: DecisionStatus;
  primaryAction: string | null;
  secondaryAction: string | null;
  timeRemaining: string | null;
  outcome?: string;
}

interface ReflectionPrompt {
  id: string;
  text: string;
}

interface ConfirmationState {
  visible: boolean;
  decisionId: string | null;
  countdown: number;
  confirmed: boolean;
}

/* ── Icon Maps — module scope, no render-time creation ── */

const DECISION_ICONS: Record<DecisionType, ComponentType<{ className?: string }>> = {
  "release-ready": CheckCircle,
  "lock-ending": Timer,
  "extend-option": RefreshCw,
  "withdrawal-review": ArrowUpFromLine,
  "pending-unlock": Clock,
};

const DECISION_COLORS: Record<DecisionType, string> = {
  "release-ready": "text-green-600 bg-green-100 border-green-200",
  "lock-ending": "text-amber-700 bg-amber-50 border-amber-200",
  "extend-option": "text-green-600 bg-green-50 border-green-200",
  "withdrawal-review": "text-text-secondary bg-surface-subtle border-border",
  "pending-unlock": "text-amber-700 bg-amber-50 border-amber-200",
};

const SUMMARY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  available: Lock,
  releasing: Timer,
  intent: Clock,
  activity: ArrowRight,
};

const SUMMARY_COLORS: Record<string, string> = {
  available: "text-green-700 bg-green-100 border-green-200",
  releasing: "text-amber-700 bg-amber-50 border-amber-200",
  intent: "text-green-600 bg-green-50 border-green-200",
  activity: "text-text-secondary bg-surface-subtle border-border",
};

/* ── Mock Data ─────────────────────────────── */
/* Updated microcopy: betting-origin references as subtle infrastructure. */

const MOCK_DECISIONS: IntentDecision[] = [
  {
    id: "dec-01",
    type: "release-ready",
    title: "Capital available for release",
    description:
      "$500 has completed its 7-day protection period and is ready to be released to your available balance.",
    amount: "500.00",
    asset: "USDC",
    status: "actionable",
    primaryAction: "Release capital",
    secondaryAction: "Extend protection",
    timeRemaining: null,
  },
  {
    id: "dec-02",
    type: "lock-ending",
    title: "Protection period ending",
    description:
      "$1,000 of session gains protected 28 days ago will become available in 2 days.",
    amount: "1000.00",
    asset: "USDC",
    status: "pending",
    primaryAction: "Extend protection",
    secondaryAction: "Let it release",
    timeRemaining: "2 days",
  },
  {
    id: "dec-03",
    type: "extend-option",
    title: "Extension available",
    description:
      "$2,000 currently in a 90-day horizon can be extended for additional protection.",
    amount: "2000.00",
    asset: "USDC",
    status: "actionable",
    primaryAction: "Extend to 180 days",
    secondaryAction: "No thanks",
    timeRemaining: "62 days remaining",
  },
  {
    id: "dec-04",
    type: "withdrawal-review",
    title: "Withdrawal to review",
    description:
      "$400 from a completed release is ready to be withdrawn to your wallet.",
    amount: "400.00",
    asset: "USDC",
    status: "actionable",
    primaryAction: "Review withdrawal",
    secondaryAction: "Keep in vault",
    timeRemaining: null,
  },
  {
    id: "dec-05",
    type: "pending-unlock",
    title: "Unlock in progress",
    description:
      "Your release request for $300 has been submitted and is being processed onchain.",
    amount: "300.00",
    asset: "USDC",
    status: "pending",
    primaryAction: null,
    secondaryAction: null,
    timeRemaining: "Confirming...",
  },
  {
    id: "dec-06",
    type: "release-ready",
    title: "Capital released",
    description:
      "$750 was released to your available balance after its 30-day horizon ended.",
    amount: "750.00",
    asset: "USDC",
    status: "completed",
    primaryAction: null,
    secondaryAction: null,
    timeRemaining: null,
    outcome: "Released 3 days ago",
  },
  {
    id: "dec-07",
    type: "extend-option",
    title: "Protection extended",
    description:
      "$1,200 protection was extended from 30 to 60 days.",
    amount: "1200.00",
    asset: "USDC",
    status: "completed",
    primaryAction: null,
    secondaryAction: null,
    timeRemaining: null,
    outcome: "Extended 5 days ago",
  },
];

const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  {
    id: "ref-01",
    text: "Why are you releasing this capital?",
  },
  {
    id: "ref-02",
    text: "Will this decision matter in 7 days?",
  },
  {
    id: "ref-03",
    text: "Would future you protect this capital again?",
  },
  {
    id: "ref-04",
    text: "Is this capital needed immediately?",
  },
];

/* ── Helpers ───────────────────────────────── */

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
  const Icon = SUMMARY_ICONS[iconType] || RefreshCw;
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

/* ── Decision Card ─────────────────────────── */

interface DecisionCardProps {
  decision: IntentDecision;
  onPrimaryAction: (id: string) => void;
  onSecondaryAction: (id: string) => void;
  showReflection: boolean;
  onToggleReflection: (id: string) => void;
}

function DecisionCard({
  decision,
  onPrimaryAction,
  onSecondaryAction,
  showReflection,
  onToggleReflection,
}: DecisionCardProps) {
  const Icon = DECISION_ICONS[decision.type];
  const colorClass = DECISION_COLORS[decision.type];

  const isCompleted = decision.status === "completed";

  return (
    <div
      className={cn(
        "rounded-xl border bg-surface shadow-sm p-5 md:p-6 transition-all duration-200",
        isCompleted
          ? "border-border"
          : "border-border hover:border-border-hover hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            isCompleted
              ? "text-text-tertiary bg-surface-subtle border-border"
              : colorClass,
          )}
        >
          {createElement(Icon, { className: "h-5 w-5" })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={cn(
                    "text-sm font-medium",
                    isCompleted ? "text-text-tertiary" : "text-text-primary",
                  )}
                >
                  {decision.title}
                </h3>
                {decision.status === "pending" && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    Pending
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "text-small mt-1 leading-relaxed",
                  isCompleted
                    ? "text-text-muted"
                    : "text-text-secondary",
                )}
              >
                {decision.description}
              </p>
            </div>
            {!isCompleted && (
              <span className="text-sm font-medium tabular-nums text-text-primary shrink-0">
                ${formatAmount(decision.amount)}
              </span>
            )}
          </div>

          {/* Time remaining */}
          {decision.timeRemaining && !isCompleted && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock className="h-3 w-3 text-text-muted" />
              <span className="text-tiny text-text-muted">
                {decision.timeRemaining}
              </span>
            </div>
          )}

          {/* Outcome (completed) */}
          {isCompleted && decision.outcome && (
            <p className="text-tiny text-text-muted mt-2">{decision.outcome}</p>
          )}

          {/* Actions */}
          {!isCompleted && (
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {decision.primaryAction && (
                <button
                  type="button"
                  onClick={() => onPrimaryAction(decision.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-4 py-2 text-small font-medium hover:bg-green-600 transition-colors shadow-sm"
                >
                  {decision.primaryAction}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
              {decision.secondaryAction && (
                <button
                  type="button"
                  onClick={() => onSecondaryAction(decision.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-subtle text-text-secondary px-4 py-2 text-small font-medium hover:text-text-primary hover:border-border-hover transition-colors"
                >
                  {decision.secondaryAction}
                </button>
              )}

              {/* Reflection toggle */}
              {decision.type === "release-ready" && (
                <button
                  type="button"
                  onClick={() => onToggleReflection(decision.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-tiny font-medium transition-colors",
                    showReflection
                      ? "text-green-600"
                      : "text-text-muted hover:text-text-tertiary",
                  )}
                >
                  <BookOpen className="h-3 w-3" />
                  Reflect
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reflection section (expandable) */}
      {showReflection && (
        <div className="mt-4 pt-4 border-t border-border">
          <ReflectionSection />
        </div>
      )}
    </div>
  );
}

/* ── Reflection Section ────────────────────── */

function ReflectionSection() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-3">
      <p className="text-tiny font-medium text-text-tertiary uppercase tracking-wider">
        A moment to consider
      </p>
      <div className="flex flex-wrap gap-2">
        {REFLECTION_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() =>
              setSelectedPrompt(
                selectedPrompt === prompt.id ? null : prompt.id,
              )
            }
            className={cn(
              "rounded-lg border px-3 py-1.5 text-tiny font-medium transition-all duration-200 text-left",
              selectedPrompt === prompt.id
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-surface text-text-muted border-border hover:border-border-hover hover:text-text-tertiary",
            )}
          >
            {prompt.text}
          </button>
        ))}
      </div>

      {/* Textarea for notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional — your thoughts remain private and are not stored."
        rows={2}
        className="w-full rounded-lg border border-border bg-surface-subtle px-3 py-2 text-small text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors resize-none"
      />
    </div>
  );
}

/* ── Confirmation Modal ────────────────────── */

interface ConfirmationModalProps {
  decision: IntentDecision | null;
  countdown: number;
  confirmed: boolean;
  onConfirm: () => void;
  onKeepProtected: () => void;
}

function ConfirmationModal({
  decision,
  countdown,
  confirmed,
  onConfirm,
  onKeepProtected,
}: ConfirmationModalProps) {
  if (!decision) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm capital release"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Close indicator — quiet */}
        <div className="flex justify-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-200 bg-green-50">
            <Shield className="h-5 w-5 text-green-700" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-heading font-medium text-text-primary mb-2">
          Confirm release of ${formatAmount(decision.amount)}?
        </h2>

        {/* Description */}
        <p className="text-center text-small text-text-secondary leading-relaxed mb-6">
          Protected capital becomes immediately available after confirmation.
          No penalties. No fees.
        </p>

        {/* Countdown indicator */}
        {!confirmed && (
          <div className="flex flex-col items-center mb-6">
            <div className="relative flex items-center justify-center mb-2">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  className="text-green-500"
                  strokeWidth="2"
                  strokeDasharray={`${(countdown / 10) * 100} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-medium tabular-nums text-text-primary">
                {countdown}s
              </span>
            </div>
            <span className="text-tiny text-text-muted">
              Confirmations are intentionally unhurried.
            </span>
          </div>
        )}

        {/* Confirmed state */}
        {confirmed && (
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-tiny font-medium text-green-600">
              Confirmed
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed}
            className={cn(
              "w-full rounded-lg py-2.5 text-small font-medium transition-all",
              confirmed
                ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                : "bg-surface-hover text-text-muted cursor-not-allowed",
            )}
          >
            {confirmed
              ? "Confirm release"
              : `Wait ${countdown}s to confirm`}
          </button>
          <button
            type="button"
            onClick={onKeepProtected}
            disabled={confirmed}
            className={cn(
              "w-full rounded-lg py-2.5 text-small font-medium transition-colors",
              confirmed
                ? "text-text-muted cursor-not-allowed"
                : "text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface-hover",
            )}
          >
            Keep protected
          </button>
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

type TabType = "active" | "history";

export default function IntentPage() {
  const capital = useCapitalState();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [showReflectionFor, setShowReflectionFor] = useState<string | null>(
    null,
  );

  // Confirmation state
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    visible: false,
    decisionId: null,
    countdown: 10,
    confirmed: false,
  });

  // Countdown timer
  useEffect(() => {
    if (!confirmation.visible || confirmation.confirmed) return;
    if (confirmation.countdown <= 0) return;

    const timer = setInterval(() => {
      setConfirmation((prev) => {
        if (prev.countdown <= 1) {
          clearInterval(timer);
          return { ...prev, countdown: 0, confirmed: true };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [confirmation.visible, confirmation.countdown, confirmation.confirmed]);

  const activeDecisions = useMemo(
    () => MOCK_DECISIONS.filter((d) => d.status !== "completed"),
    [],
  );

  const completedDecisions = useMemo(
    () => MOCK_DECISIONS.filter((d) => d.status === "completed"),
    [],
  );

  const displayedDecisions = useMemo(
    () => (activeTab === "active" ? activeDecisions : completedDecisions),
    [activeTab, activeDecisions, completedDecisions],
  );

  // ── Summary derived from shared capital state + mock decisions ──
  const summary = useMemo(() => {
    const active = MOCK_DECISIONS.filter((d) => d.status !== "completed");
    const releasing = active
      .filter((d) => d.type === "lock-ending" || d.type === "release-ready")
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const pendingCount = active.filter((d) => d.status === "pending").length;
    const extendedCount = MOCK_DECISIONS.filter(
      (d) => d.type === "extend-option" && d.status === "completed",
    ).length;

    return {
      protected: capital.formatted.protected,
      releasing: releasing.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      pendingCount,
      extendedCount,
    };
  }, [capital.formatted.protected]);

  const handlePrimaryAction = useCallback((id: string) => {
    const decision = MOCK_DECISIONS.find((d) => d.id === id);
    if (!decision) return;

    if (decision.type === "release-ready") {
      setConfirmation({
        visible: true,
        decisionId: id,
        countdown: 10,
        confirmed: false,
      });
    }
  }, []);

  const handleSecondaryAction = useCallback(() => {
    // Handle secondary actions (extend, keep, etc.)
  }, []);

  const handleConfirm = useCallback(() => {
    setConfirmation((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleKeepProtected = useCallback(() => {
    setConfirmation((prev) => ({ ...prev, visible: false }));
  }, []);

  const toggleReflection = useCallback((id: string) => {
    setShowReflectionFor((prev) => (prev === id ? null : id));
  }, []);

  const confirmingDecision = useMemo(
    () => MOCK_DECISIONS.find((d) => d.id === confirmation.decisionId) || null,
    [confirmation.decisionId],
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

        {/* ── Overview Summary Cards — unified terminology ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <SummaryCard
            label="Protected"
            value={`$${summary.protected}`}
            subtext="Currently in protection"
            iconType="available"
          />
          <SummaryCard
            label="Releasing"
            value={`$${summary.releasing}`}
            subtext="Protection ending soon"
            iconType="releasing"
          />
          <SummaryCard
            label="Intent"
            value={String(summary.pendingCount)}
            subtext="Decisions awaiting attention"
            iconType="intent"
          />
          <SummaryCard
            label="Extensions"
            value={String(summary.extendedCount)}
            subtext="Protection periods extended"
            iconType="activity"
          />
        </div>

        {/* ── Tab Toggle ── */}
        <div className="mb-6 flex gap-2">
          {(
            [
              { key: "active" as const, label: "Active" },
              { key: "history" as const, label: "History" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-small font-medium transition-all duration-200",
                activeTab === tab.key
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-surface text-text-tertiary border border-border hover:border-border-hover hover:text-text-secondary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Decisions List ── */}
        {displayedDecisions.length > 0 ? (
          <div className="space-y-4">
            {displayedDecisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                onPrimaryAction={handlePrimaryAction}
                onSecondaryAction={handleSecondaryAction}
                showReflection={showReflectionFor === decision.id}
                onToggleReflection={toggleReflection}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmation.visible && (
        <ConfirmationModal
          decision={confirmingDecision}
          countdown={confirmation.countdown}
          confirmed={confirmation.confirmed}
          onConfirm={handleConfirm}
          onKeepProtected={handleKeepProtected}
        />
      )}
    </PageShell>
  );
}
