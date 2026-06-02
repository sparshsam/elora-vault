"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useCapitalState } from "@/lib/capital-state";
import { useReleaseLock } from "@/lib/web3/tx-hooks";
import { useWalletStore } from "@/store/useWalletStore";
import { PageShell } from "@/components/layout/page-shell";
import { ProtectCapitalModal } from "@/components/capital/capital-operations";
import {
  evaluatePolicySuggestions,
  readPolicyActivity,
  recordPolicyActivity,
  type PolicyActivityEvent,
  type PolicySuggestion,
} from "@/lib/policies/policy-suggestions";
import {
  Lock,
  Clock,
  Target,
  ArrowRight,
  CheckCircle,
  Timer,
  Shield,
  TrendingUp,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DelayedReleaseDemo,
  ScheduledReleaseDemo,
  ReviewedReleaseDemo,
  StagedReleaseDemo,
} from "@/components/capital/delayed-release-mocks";

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

/* ── Helpers ───────────────────────────────── */

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
        <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">{label}</span>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", colorClass)}>
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
  onReleaseAndProtect: (id: string, amount: number) => void;
  isReleasing: boolean;
}

function ReleaseCard({ horizon, onRelease, onReleaseAndProtect, isReleasing }: ReleaseCardProps) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50/30 shadow-sm p-5 md:p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-medium text-text-primary">Capital ready for release</h3>
              <p className="text-small text-text-secondary mt-1 leading-relaxed">
                {horizon.amountFormatted} from a {horizon.durationDays}-day
                horizon has completed its protection period.
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums text-green-700 shrink-0">${horizon.amountFormatted}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-tiny text-text-muted">
              Horizon ended {new Date(horizon.unlockAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
            <button
              type="button"
              onClick={() => onReleaseAndProtect(horizon.id, horizon.amount)}
              disabled={isReleasing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-2 text-small font-medium hover:bg-green-100 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Release &amp; protect
            </button>
          </div>
          <p className="text-tiny text-text-muted mt-3">
            Capital enters availability after confirmation. From there, it can move into a new protection horizon or remain available.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Active Horizon Card ───────────────────── */

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
              <h3 className="text-sm font-medium text-text-primary">{horizon.durationDays}-day horizon active</h3>
              <p className="text-small text-text-secondary mt-1 leading-relaxed">
                ${horizon.amountFormatted} is protected until {horizon.releaseDate}.
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums text-text-primary shrink-0">${horizon.amountFormatted}</span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-tiny text-text-muted mb-1.5">
              <span>{Math.round(horizon.progress)}% complete</span>
              <span>{horizon.releaseDate}</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${horizon.progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ───────────────────────────── */

interface PolicySuggestionCardProps {
  suggestion: PolicySuggestion;
  onAccept: (suggestion: PolicySuggestion) => void;
  onDismiss: (suggestion: PolicySuggestion) => void;
  onSnooze: (suggestion: PolicySuggestion) => void;
}

function PolicySuggestionCard({ suggestion, onAccept, onDismiss, onSnooze }: PolicySuggestionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-200 bg-green-50">
          <Lightbulb className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-medium text-text-primary">{suggestion.title}</h3>
              <p className="text-small text-text-secondary mt-1 leading-relaxed">{suggestion.body}</p>
            </div>
            <span className="rounded-full border border-border bg-surface-subtle px-2.5 py-1 text-tiny text-text-tertiary">
              {suggestion.sourcePolicy}
            </span>
          </div>
          {suggestion.releaseTiming && (
            <p className="text-tiny text-text-muted mt-3">Timing: {suggestion.releaseTiming}</p>
          )}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => onAccept(suggestion)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-4 py-2 text-small font-medium hover:bg-green-600 transition-colors shadow-sm"
            >
              Accept
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSnooze(suggestion)}
              className="rounded-lg border border-border bg-surface-subtle px-4 py-2 text-small font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Snooze
            </button>
            <button
              type="button"
              onClick={() => onDismiss(suggestion)}
              className="rounded-lg px-4 py-2 text-small font-medium text-text-tertiary hover:text-text-primary hover:bg-surface-subtle transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-surface p-12 md:p-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-subtle">
          <Target className="h-5 w-5 text-text-tertiary" />
        </div>
        <p className="text-sm font-medium text-text-primary">No decisions need your attention right now.</p>
        <p className="text-small text-text-tertiary mt-2 max-w-sm leading-relaxed">
          Intent is where releases, protections, and decisions converge.
          Completed horizons, protection opportunities, and policy suggestions
          will appear here when there is something to consider.
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
  onProtectInstead: () => void;
  onKeepProtected: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

function ReleaseConfirmModal({ open, amount, countdown, confirmed, onConfirm, onProtectInstead, onKeepProtected, isSubmitting, errorMessage }: ReleaseConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-xl p-6 md:p-8 pb-safe animate-in fade-in duration-200">
        <div className="flex justify-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-200 bg-green-50">
            <Shield className="h-5 w-5 text-green-700" />
          </div>
        </div>
        <h2 className="text-center text-heading font-medium text-text-primary mb-2">Release ${amount} to available?</h2>
        <p className="text-center text-small text-text-secondary leading-relaxed mb-6">
          Capital becomes available after confirmation. Consider whether it might serve you better in a new protection horizon.
        </p>
        {!confirmed && (
          <div className="flex flex-col items-center mb-6">
            <div className="relative flex items-center justify-center mb-2">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-border" strokeWidth="2" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-green-500"
                  strokeWidth="2" strokeDasharray={`${(countdown / 10) * 100} 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute text-sm font-medium tabular-nums text-text-primary">{countdown}s</span>
            </div>
            <span className="text-tiny text-text-muted">Confirmations are intentionally unhurried.</span>
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
        {errorMessage && (
          <p className="mb-4 rounded-lg border border-danger/20 bg-danger/8 px-3 py-2 text-center text-small text-danger">
            {errorMessage}
          </p>
        )}
        <div className="space-y-2">
          <button type="button" onClick={onConfirm} disabled={!confirmed || isSubmitting}
            className={cn("w-full rounded-lg py-2.5 text-small font-medium transition-all",
              confirmed && !isSubmitting ? "bg-green-500 text-white hover:bg-green-600 shadow-sm" : "bg-surface-hover text-text-muted cursor-not-allowed")}>
            {isSubmitting ? "Releasing..." : confirmed ? "Release to available" : `Wait ${countdown}s to confirm`}
          </button>
          <button type="button" onClick={onProtectInstead} disabled={!confirmed || isSubmitting}
            className={cn("w-full rounded-lg py-2.5 text-small font-medium transition-all border",
              confirmed && !isSubmitting
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-border bg-surface-subtle text-text-muted cursor-not-allowed")}>
            <Shield className="inline h-3.5 w-3.5 -ml-0.5 mr-1" />
            Release &amp; protect
          </button>
          <button type="button" onClick={onKeepProtected} disabled={isSubmitting}
            className={cn("w-full rounded-lg py-2.5 text-small font-medium transition-colors",
              isSubmitting ? "text-text-muted cursor-not-allowed" : "text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface-hover")}>
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
  const { syncFromServer } = useWalletStore();
  const loggedReleaseHash = useRef<`0x${string}` | undefined>(undefined);

  // ── Release confirmation state ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [confirmed, setConfirmed] = useState(false);
  const [isReleasing, setIsReleasing] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [releaseSubmitting, setReleaseSubmitting] = useState(false);
  const releaseSubmittingRef = useRef(false);

  // "Release & protect" flow: after release succeeds, auto-open protect modal
  const [releaseThenProtectAmount, setReleaseThenProtectAmount] = useState<number | null>(null);
  // "Protect this win" flow: open protect modal for a specific win amount
  const [protectWinAmount, setProtectWinAmount] = useState<number | null>(null);

  // Recent won predictions for protection prompt.
  const [recentWins, setRecentWins] = useState<{ id: string; description: string; amount: number }[]>([]);
  const [policyActivity, setPolicyActivity] = useState<PolicyActivityEvent[]>([]);
  const [protectSuggestion, setProtectSuggestion] = useState<{ amount: number; durationDays: number } | null>(null);
  const [protectModalOpen, setProtectModalOpen] = useState(false);
  const [defaultDurationDays, setDefaultDurationDays] = useState(30);

  useEffect(() => {
    if (!confirmOpen || confirmed) return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); setConfirmed(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [confirmOpen, countdown, confirmed]);

  useEffect(() => {
    setPolicyActivity(readPolicyActivity());
    const savedDuration = window.localStorage.getItem("elora_vault_default_duration");
    const parsedDuration = savedDuration ? parseInt(savedDuration, 10) : 30;
    if ([7, 30, 90].includes(parsedDuration)) setDefaultDurationDays(parsedDuration);
  }, []);

  useEffect(() => {
    if (isReleasing && releaseLock.isConfirmed) {
      const shouldProtect = releaseThenProtectAmount !== null;
      setConfirmOpen(false);
      setReleaseError(null);
      setReleaseSubmitting(false);
      if (shouldProtect) {
        setProtectModalOpen(true);
        setReleaseThenProtectAmount(null);
      }
    }
    if (isReleasing && releaseLock.error) {
      setIsReleasing(null);
      setReleaseError(releaseLock.lifecycle.calmError ?? "Release was not completed.");
      releaseSubmittingRef.current = false;
      setReleaseSubmitting(false);
      setReleaseThenProtectAmount(null);
    }
  }, [isReleasing, releaseLock.isConfirmed, releaseLock.error, releaseLock.lifecycle.calmError, releaseThenProtectAmount]);

  useEffect(() => {
    if (!isReleasing || !releaseLock.isConfirmed || !releaseLock.hash || loggedReleaseHash.current === releaseLock.hash) return;

    const horizon = capital.activeHorizons.find((h) => h.id === isReleasing);
    if (!horizon) return;

    loggedReleaseHash.current = releaseLock.hash;
    (async () => {
      await fetch("/api/onchain/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ONCHAIN_LOCK_RELEASED",
          amount: horizon.amount,
          txHash: releaseLock.hash,
          lockId: parseInt(isReleasing, 10),
        }),
      });
      await syncFromServer();
      setIsReleasing(null);
      releaseSubmittingRef.current = false;
      setReleaseSubmitting(false);
    })().catch(() => {
      loggedReleaseHash.current = undefined;
      setReleaseError("Capital state could not be updated. Please refresh before trying again.");
      releaseSubmittingRef.current = false;
      setReleaseSubmitting(false);
    });
  }, [capital.activeHorizons, isReleasing, releaseLock.hash, releaseLock.isConfirmed, syncFromServer]);

  // Load recent won predictions.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/bets?status=WON&limit=10");
        if (res.ok) {
          const data = await res.json();
          const oneDayAgo = Date.now() - 48 * 60 * 60 * 1000; // 48 hours
          const recent = (data.predictions || data.bets || [])
            .filter((b: Record<string, unknown>) => {
              const settledAt = b.settledAt ? new Date(b.settledAt as string).getTime() : 0;
              return settledAt > oneDayAgo;
            })
            .map((b: Record<string, unknown>) => ({
              id: b.id as string,
              description: (b.description as string) || "Prediction",
              amount: (b.potentialProfit as number) || 0,
            }));
          setRecentWins(recent);
        }
      } catch { /* silently fail */ }
    })();
  }, []);

  const releasableHorizons = useMemo(() => capital.activeHorizons.filter((h) => h.canRelease), [capital.activeHorizons]);
  const activeHorizons = useMemo(() => capital.activeHorizons.filter((h) => !h.canRelease), [capital.activeHorizons]);
  const recentGainsAmount = useMemo(() => recentWins.reduce((sum, win) => sum + win.amount, 0), [recentWins]);
  const releasableAmount = useMemo(() => releasableHorizons.reduce((sum, horizon) => sum + horizon.amount, 0), [releasableHorizons]);
  const policySuggestions = useMemo(() => evaluatePolicySuggestions({
    available: capital.balances.availableCapital,
    protected: capital.balances.protectedCapital,
    releasing: capital.balances.releasingCapital,
    committed: capital.balances.committedCapital,
    recentGains: recentGainsAmount,
    releasableAmount,
    activeHorizonCount: activeHorizons.length,
    defaultDurationDays,
  }, policyActivity), [
    capital.balances.availableCapital,
    capital.balances.protectedCapital,
    capital.balances.releasingCapital,
    capital.balances.committedCapital,
    recentGainsAmount,
    releasableAmount,
    activeHorizons.length,
    defaultDurationDays,
    policyActivity,
  ]);

  const summary = useMemo(() => ({
    protected: capital.formatted.protected,
    releasing: String(releasableHorizons.length),
    intent: String(capital.pendingReleaseCount + recentWins.length + policySuggestions.length),
  }), [capital.formatted.protected, releasableHorizons.length, capital.pendingReleaseCount, recentWins.length, policySuggestions.length]);

  useEffect(() => {
    const untracked = policySuggestions.filter((suggestion) => (
      !policyActivity.some((event) => event.suggestionId === suggestion.id && event.status === "generated")
    ));
    if (untracked.length === 0) return;

    setPolicyActivity((current) => {
      let next = current;
      for (const suggestion of untracked) {
        if (next.some((event) => event.suggestionId === suggestion.id && event.status === "generated")) continue;
        next = recordPolicyActivity(next, suggestion, "generated");
      }
      return next;
    });
  }, [policySuggestions, policyActivity]);

  const handleReleaseClick = useCallback((id: string) => {
    if (releaseLock.lifecycle.isActive || releaseSubmittingRef.current) return;
    setReleaseError(null); setConfirmingId(id); setCountdown(10); setConfirmed(false); setConfirmOpen(true);
  }, [releaseLock.lifecycle.isActive]);

  const handleSuggestionAccept = useCallback((suggestion: PolicySuggestion) => {
    setPolicyActivity((current) => recordPolicyActivity(current, suggestion, "accepted"));
    if (
      (suggestion.action === "protect-capital" || suggestion.action === "reprotect-capital") &&
      suggestion.amount &&
      suggestion.durationDays
    ) {
      setProtectSuggestion({ amount: suggestion.amount, durationDays: suggestion.durationDays });
      setProtectModalOpen(true);
    }
  }, []);

  const handleSuggestionDismiss = useCallback((suggestion: PolicySuggestion) => {
    setPolicyActivity((current) => recordPolicyActivity(current, suggestion, "dismissed"));
  }, []);

  const handleSuggestionSnooze = useCallback((suggestion: PolicySuggestion) => {
    setPolicyActivity((current) => recordPolicyActivity(current, suggestion, "snoozed"));
  }, []);

  const handleConfirmRelease = useCallback(() => {
    if (!confirmingId || releaseSubmittingRef.current || releaseLock.lifecycle.isActive) return;
    const lockId = parseInt(confirmingId, 10);
    if (isNaN(lockId)) return;
    releaseSubmittingRef.current = true;
    setReleaseSubmitting(true);
    setReleaseError(null);
    setIsReleasing(confirmingId);
    releaseLock.releaseLock(lockId);
  }, [confirmingId, releaseLock]);

  const handleKeepProtected = useCallback(() => {
    if (releaseLock.lifecycle.isActive || releaseSubmittingRef.current) return;
    setConfirmOpen(false); setConfirmingId(null); setReleaseError(null);
  }, [releaseLock.lifecycle.isActive]);

  const handleReleaseAndProtect = useCallback((_id: string, amount: number) => {
    if (releaseLock.lifecycle.isActive || releaseSubmittingRef.current) return;
    setReleaseThenProtectAmount(amount);
    setReleaseError(null); setConfirmingId(_id); setCountdown(10); setConfirmed(false); setConfirmOpen(true);
  }, [releaseLock.lifecycle.isActive]);

  const handleProtectInstead = useCallback(() => {
    if (!confirmingId) return;
    const h = capital.activeHorizons.find((h) => h.id === confirmingId);
    setReleaseThenProtectAmount(h?.amount ?? null);
    setConfirmOpen(false);
    setConfirmingId(null);
  }, [confirmingId, capital.activeHorizons]);

  const handleProtectWin = useCallback((amount: number) => {
    setProtectWinAmount(amount);
    setProtectModalOpen(true);
  }, []);

  const handleProtectModalClose = useCallback(() => {
    setProtectModalOpen(false);
    setProtectSuggestion(null);
    setProtectWinAmount(null);
    setReleaseThenProtectAmount(null);
  }, []);

  const confirmingAmount = useMemo(() => {
    if (!confirmingId) return "0.00";
    const h = capital.activeHorizons.find((h) => h.id === confirmingId);
    return h?.amountFormatted ?? "0.00";
  }, [confirmingId, capital.activeHorizons]);

  const hasContent = releasableHorizons.length > 0 || activeHorizons.length > 0 || recentWins.length > 0 || policySuggestions.length > 0;

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-display text-text-primary">Intent</h1>
          <p className="text-body text-text-secondary mt-1">A place to slow down before capital moves.</p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <SummaryCard label="Protected" value={`$${summary.protected}`} subtext="Currently in protection" iconType="protected" />
          <SummaryCard label="Releasing" value={summary.releasing} subtext={releasableHorizons.length === 1 ? "Horizon completed" : "Horizons completed"} iconType="releasing" />
          <SummaryCard label="Intent" value={summary.intent} subtext="Decisions awaiting attention" iconType="intent" />
        </div>

        {policySuggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-600" />
              Suggestions based on your protection settings
            </h2>
            <div className="space-y-4">
              {policySuggestions.map((suggestion) => (
                <PolicySuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={handleSuggestionAccept}
                  onDismiss={handleSuggestionDismiss}
                  onSnooze={handleSuggestionSnooze}
                />
              ))}
            </div>
          </div>
        )}

        {/* Protection opportunities from won predictions */}
        {recentWins.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Protection opportunities
            </h2>
            <div className="space-y-4">
              {recentWins.map((win) => (
                <div key={win.id} className="rounded-xl border border-green-200 bg-green-50/30 shadow-sm p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-200 bg-green-50">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-text-primary">Return available for protection</h3>
                      <p className="text-small text-text-secondary mt-1 leading-relaxed">
                        {win.description} — <span className="text-green-600 font-medium">+${formatUSD(win.amount)}</span> profit available.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleProtectWin(win.amount)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-green-100 text-green-700 px-4 py-2 text-small font-medium hover:bg-green-200 transition-colors border border-green-200"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Protect this amount
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pending Release Section ── */}
        {releasableHorizons.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Ready to release
            </h2>
            <div className="space-y-4">
              {releasableHorizons.map((horizon) => (
                <ReleaseCard key={horizon.id} horizon={horizon} onRelease={handleReleaseClick} onReleaseAndProtect={handleReleaseAndProtect} isReleasing={isReleasing === horizon.id} />
              ))}
            </div>
          </div>
        )}

        {/* ── Active Horizons Section ── */}
        {activeHorizons.length > 0 && (
          <div className="mb-8">
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

        {/* ── Delayed Release Previews (research concepts) ── */}
        <div className="mt-12 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-sm font-medium text-text-primary">
              Future release options
            </h2>
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-tiny text-text-muted ml-auto">
              research
            </span>
          </div>
          <p className="text-tiny text-text-tertiary mb-6 leading-relaxed">
            Protected capital release could support intentional timing.
            These are architectural concepts — not yet available.
          </p>
        </div>

        <div className="space-y-8 mb-8">
          {/* Delayed release — 12-hour window */}
          <div className="rounded-xl border border-dashed border-border bg-surface-subtle/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
                Delayed release
              </span>
            </div>
            <p className="text-tiny text-text-tertiary mb-4">
              Capital becomes available after a fixed waiting period.
              No further action required after confirmation.
            </p>
            <DelayedReleaseDemo />
          </div>

          {/* Scheduled release — pick the time */}
          <div className="rounded-xl border border-dashed border-border bg-surface-subtle/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
                Scheduled release
              </span>
            </div>
            <p className="text-tiny text-text-tertiary mb-4">
              Choose the exact moment capital becomes available.
            </p>
            <ScheduledReleaseDemo />
          </div>

          {/* Reviewed release — reflection period */}
          <div className="rounded-xl border border-dashed border-border bg-surface-subtle/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
                Reviewed release
              </span>
            </div>
            <p className="text-tiny text-text-tertiary mb-4">
              Confirm intent, then reflect. Cancel during the review
              period if your plans have changed.
            </p>
            <ReviewedReleaseDemo />
          </div>

          {/* Staged release — gradual return */}
          <div className="rounded-xl border border-dashed border-border bg-surface-subtle/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
                Staged release
              </span>
            </div>
            <p className="text-tiny text-text-tertiary mb-4">
              Capital returns in tranches over time. Each portion becomes
              available automatically.
            </p>
            <StagedReleaseDemo />
          </div>
        </div>
      </div>

      {/* ── Release Confirmation Modal ── */}
      <ReleaseConfirmModal
        open={confirmOpen} amount={confirmingAmount} countdown={countdown}
        confirmed={confirmed} onConfirm={handleConfirmRelease}
        onProtectInstead={handleProtectInstead} onKeepProtected={handleKeepProtected}
        isSubmitting={releaseLock.lifecycle.isActive || releaseSubmitting}
        errorMessage={releaseError}
      />

      <ProtectCapitalModal
        open={protectModalOpen}
        onClose={handleProtectModalClose}
        maxAmount={capital.balances.available}
        initialAmount={protectWinAmount ?? protectSuggestion?.amount ?? null}
        initialHorizon={protectSuggestion?.durationDays ?? null}
      />
    </PageShell>
  );
}
