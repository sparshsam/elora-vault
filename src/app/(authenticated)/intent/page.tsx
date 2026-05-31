"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useCapitalState } from "@/lib/capital-state";
import { useReleaseLock } from "@/lib/web3/tx-hooks";
import { PageShell } from "@/components/layout/page-shell";
import {
  Lock,
  Clock,
  Target,
  ArrowRight,
  CheckCircle,
  Timer,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Summary Icons ────────────────────────── */

const SUMMARY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  protected: Lock,
  releasing: Timer,
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

/* ── Release Ready Horizon Card ─────────────── */

interface ReleaseCardProps {
  horizon: ReturnType<typeof useCapitalState>["activeHorizons"][number];
  onRelease: (id: string) => void;
  isReleasing: boolean;
}

function ReleaseCard({ horizon, onRelease, isReleasing }: ReleaseCardProps) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50/30 shadow-sm p-5 md:p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-medium text-text-primary">
                Capital ready for release
              </h3>
              <p className="text-small text-text-secondary mt-1 leading-relaxed">
                {horizon.amountFormatted} from a {horizon.durationDays}-day
                horizon has completed its protection period.
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums text-green-700 shrink-0">
              ${horizon.amountFormatted}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-tiny text-text-muted">
              Horizon ended{" "}
              {new Date(horizon.unlockAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => onRelease(horizon.id)}
              disabled={isReleasing}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-small font-medium transition-all",
                isReleasing
                  ? "bg-surface-hover text-text-muted cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600 shadow-sm",
              )}
            >
              {isReleasing ? "Releasing..." : "Release to available"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Active Horizon Card (not yet releasable) ── */

function ActiveHorizonCard({ horizon }: { horizon: ReturnType<typeof useCapitalState>["activeHorizons"][number] }) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-subtle">
          <Timer className="h-5 w-5 text-text-tertiary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-medium text-text-primary">
                {horizon.durationDays}-day horizon active
              </h3>
              <p className="text-small text-text-secondary mt-1 leading-relaxed">
                ${horizon.amountFormatted} is protected until{" "}
                {horizon.releaseDate}.
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums text-text-primary shrink-0">
              ${horizon.amountFormatted}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-tiny text-text-muted mb-1.5">
              <span>{Math.round(horizon.progress)}% complete</span>
              <span>{horizon.releaseDate}</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${horizon.progress}%` }}
              />
            </div>
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

/* ── Release Confirmation Modal ──────────────── */

interface ReleaseConfirmModalProps {
  open: boolean;
  amount: string;
  countdown: number;
  confirmed: boolean;
  onConfirm: () => void;
  onKeepProtected: () => void;
}

function ReleaseConfirmModal({
  open,
  amount,
  countdown,
  confirmed,
  onConfirm,
  onKeepProtected,
}: ReleaseConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-200 bg-green-50">
            <Shield className="h-5 w-5 text-green-700" />
          </div>
        </div>

        <h2 className="text-center text-heading font-medium text-text-primary mb-2">
          Confirm release of ${amount}?
        </h2>

        <p className="text-center text-small text-text-secondary leading-relaxed mb-6">
          Protected capital becomes immediately available after confirmation.
          No penalties. No fees.
        </p>

        {!confirmed && (
          <div className="flex flex-col items-center mb-6">
            <div className="relative flex items-center justify-center mb-2">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-border" strokeWidth="2" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-green-500"
                  strokeWidth="2" strokeDasharray={`${(countdown / 10) * 100} 100`} strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-medium tabular-nums text-text-primary">{countdown}s</span>
            </div>
            <span className="text-tiny text-text-muted">
              Confirmations are intentionally unhurried.
            </span>
          </div>
        )}

        {confirmed && (
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-tiny font-medium text-green-600">Confirmed</span>
          </div>
        )}

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
            {confirmed ? "Confirm release" : `Wait ${countdown}s to confirm`}
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

/* ── Page ──────────────────────────────────── */

export default function IntentPage() {
  const capital = useCapitalState();
  const releaseLock = useReleaseLock();

  // ── Release confirmation state ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [confirmed, setConfirmed] = useState(false);
  const [isReleasing, setIsReleasing] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!confirmOpen || confirmed) return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setConfirmed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [confirmOpen, countdown, confirmed]);

  // Track releaseLock tx
  useEffect(() => {
    if (isReleasing && releaseLock.isConfirmed) {
      setIsReleasing(null);
      setConfirmOpen(false);
    }
    if (isReleasing && releaseLock.error) {
      setIsReleasing(null);
    }
  }, [isReleasing, releaseLock.isConfirmed, releaseLock.error]);

  const releasableHorizons = useMemo(
    () => capital.activeHorizons.filter((h) => h.canRelease),
    [capital.activeHorizons],
  );

  const activeHorizons = useMemo(
    () => capital.activeHorizons.filter((h) => !h.canRelease),
    [capital.activeHorizons],
  );

  const summary = useMemo(
    () => ({
      protected: capital.formatted.protected,
      releasing: String(releasableHorizons.length),
      intent: String(capital.pendingReleaseCount),
    }),
    [capital.formatted.protected, releasableHorizons.length, capital.pendingReleaseCount],
  );

  const handleReleaseClick = useCallback((id: string) => {
    setConfirmingId(id);
    setCountdown(10);
    setConfirmed(false);
    setConfirmOpen(true);
  }, []);

  const handleConfirmRelease = useCallback(() => {
    if (!confirmingId) return;
    const lockId = parseInt(confirmingId, 10);
    if (isNaN(lockId)) return;

    setIsReleasing(confirmingId);
    releaseLock.releaseLock(lockId);
  }, [confirmingId, releaseLock]);

  const handleKeepProtected = useCallback(() => {
    setConfirmOpen(false);
    setConfirmingId(null);
  }, []);

  const confirmingAmount = useMemo(() => {
    if (!confirmingId) return "0.00";
    const h = capital.activeHorizons.find((h) => h.id === confirmingId);
    return h?.amountFormatted ?? "0.00";
  }, [confirmingId, capital.activeHorizons]);

  const hasContent = releasableHorizons.length > 0 || activeHorizons.length > 0;

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
            value={`$${summary.protected}`}
            subtext="Currently in protection"
            iconType="protected"
          />
          <SummaryCard
            label="Releasing"
            value={summary.releasing}
            subtext={releasableHorizons.length === 1 ? "Horizon completed" : "Horizons completed"}
            iconType="releasing"
          />
          <SummaryCard
            label="Intent"
            value={summary.intent}
            subtext="Decisions awaiting attention"
            iconType="intent"
          />
        </div>

        {/* ── Pending Release Section ── */}
        {releasableHorizons.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Ready to release
            </h2>
            <div className="space-y-4">
              {releasableHorizons.map((horizon) => (
                <ReleaseCard
                  key={horizon.id}
                  horizon={horizon}
                  onRelease={handleReleaseClick}
                  isReleasing={isReleasing === horizon.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Active Horizons Section ── */}
        {activeHorizons.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
              <Timer className="h-4 w-4 text-text-tertiary" />
              Active horizons
            </h2>
            <div className="space-y-4">
              {activeHorizons.map((horizon) => (
                <ActiveHorizonCard key={horizon.id} horizon={horizon} />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!hasContent && <EmptyState />}
      </div>

      {/* ── Release Confirmation Modal ── */}
      <ReleaseConfirmModal
        open={confirmOpen}
        amount={confirmingAmount}
        countdown={countdown}
        confirmed={confirmed}
        onConfirm={handleConfirmRelease}
        onKeepProtected={handleKeepProtected}
      />
    </PageShell>
  );
}
