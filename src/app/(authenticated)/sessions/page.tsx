"use client";

import { useState, useEffect, useMemo, useCallback, createElement } from "react";
import { useCreateLock } from "@/lib/web3/tx-hooks";
import { PageShell } from "@/components/layout/page-shell";
import { CapitalModal } from "@/components/capital/capital-modal";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Timer,
  History,
  Plus,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BettingSession,
  SessionOutcome,
  SessionAction,
  CreateSessionRequest,
} from "@/types/session";

/* ── Summary Icons — module scope ───────────── */

const SUMMARY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  balance: TrendingUp,
  protected: Shield,
  horizons: Timer,
  recent: History,
};

const SUMMARY_COLORS: Record<string, string> = {
  balance: "text-green-700 bg-green-100 border-green-200",
  protected: "text-green-600 bg-green-50 border-green-200",
  horizons: "text-text-secondary bg-surface-subtle border-border",
  recent: "text-text-tertiary bg-surface-subtle border-border",
};

/* ── Helpers ───────────────────────────────── */

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    const h = Math.floor(diffMs / 3600000);
    if (h === 0) {
      const m = Math.floor(diffMs / 60000);
      return `${m}m ago`;
    }
    return `${h}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Types ─────────────────────────────────── */

type NewSessionStep = "outcome" | "details" | "action" | "pending" | "success";

const CATEGORIES = ["NBA", "MLB", "UFC", "Soccer", "Trading", "Crypto", "Other"];

const HORIZON_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

/* ── Summary Card ──────────────────────────── */

interface SummaryCardProps {
  label: string;
  value: string;
  subtext: string;
  iconKey: string;
}

function SummaryCard({ label, value, subtext, iconKey }: SummaryCardProps) {
  const Icon = SUMMARY_ICONS[iconKey] || History;
  const colorClass = SUMMARY_COLORS[iconKey] || SUMMARY_COLORS.recent;
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-4 md:p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </span>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", colorClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-heading font-medium text-text-primary">{value}</p>
      <p className="text-tiny text-text-muted mt-0.5">{subtext}</p>
    </div>
  );
}

/* ── Session Card (timeline) ────────────────── */

interface SessionCardProps {
  session: BettingSession;
}

function SessionCard({ session }: SessionCardProps) {
  const isWin = session.pnl > 0;
  const isLoss = session.pnl < 0;
  const pnlColor = isWin ? "text-green-600" : isLoss ? "text-danger" : "text-text-tertiary";
  const outcomeIcon = isWin ? TrendingUp : isLoss ? TrendingDown : Minus;

  const actionLabels: Record<string, string> = {
    "kept-available": "Kept available",
    "protected-gains": "Protected for " + (session.horizonId ? "horizon" : "protection"),
    "moved-to-horizon": "Moved into horizon",
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 md:p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Outcome icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            isWin
              ? "border-green-200 bg-green-50"
              : isLoss
                ? "border-red-200 bg-red-50"
                : "border-border bg-surface-subtle",
          )}
        >
          {createElement(outcomeIcon, { className: cn("h-5 w-5", pnlColor) })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-medium text-text-primary">
                  {session.title || session.category || "Session"}
                </h3>
                {session.category && (
                  <span className="rounded-full border border-border bg-surface-subtle px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
                    {session.category}
                  </span>
                )}
              </div>
              <p className="text-small text-text-secondary mt-1 leading-relaxed">
                {actionLabels[session.actionTaken] || "Session recorded"}
                {session.notes && ` — ${session.notes}`}
              </p>
            </div>

            {/* PnL */}
            <span className={cn("text-sm font-medium tabular-nums shrink-0", pnlColor)}>
              {isWin ? "+" : ""}${formatUSD(session.pnl)}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-3 text-tiny text-text-muted">
            <span>{formatDate(session.createdAt)}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="capitalize">{session.outcome}</span>
            {session.horizonId && (
              <>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-green-600">Horizon linked</span>
              </>
            )}
          </div>

          {/* Bankroll bar */}
          {session.bankrollBefore > 0 && (
            <div className="mt-3 flex items-center gap-2 text-tiny text-text-muted">
              <span>${formatUSD(session.bankrollBefore)}</span>
              <ArrowRight className="h-3 w-3" />
              <span className={pnlColor}>${formatUSD(session.bankrollAfter)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ───────────────────────────── */

function EmptyState({ onStartSession }: { onStartSession: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-12 md:p-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-subtle">
          <BookOpen className="h-5 w-5 text-text-tertiary" />
        </div>
        <p className="text-sm font-medium text-text-primary">
          No sessions recorded yet.
        </p>
        <p className="text-small text-text-tertiary mt-2 max-w-xs">
          Sessions provide a reflective bridge between decisions and capital
          movement. Log your first session to begin.
        </p>
        <button
          type="button"
          onClick={onStartSession}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-5 py-2.5 text-small font-medium hover:bg-green-600 shadow-sm transition-colors"
        >
          Start a session
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── New Session Modal ─────────────────────── */

interface NewSessionModalProps {
  open: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
}

function NewSessionModal({ open, onClose, onSessionCreated }: NewSessionModalProps) {
  const createLock = useCreateLock();

  const [step, setStep] = useState<NewSessionStep>("outcome");
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [category, setCategory] = useState("");
  const [bankrollBefore, setBankrollBefore] = useState("");
  const [bankrollAfter, setBankrollAfter] = useState("");
  const [pnl, setPnl] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<SessionAction | null>(null);
  const [horizonDays, setHorizonDays] = useState<number | null>(null);
  const [horizonAmount, setHorizonAmount] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("outcome");
      setOutcome(null);
      setCategory("");
      setBankrollBefore("");
      setBankrollAfter("");
      setPnl(0);
      setNotes("");
      setAction(null);
      setHorizonDays(null);
      setHorizonAmount("");
    }
  }, [open]);

  // Track createLock tx
  useEffect(() => {
    if (step === "pending" && createLock.isConfirmed) {
      setStep("success");
    }
  }, [step, createLock.isConfirmed]);

  // Compute pnl when bankroll values change
  useEffect(() => {
    const before = parseFloat(bankrollBefore || "0");
    const after = parseFloat(bankrollAfter || "0");
    setPnl(after - before);
  }, [bankrollBefore, bankrollAfter]);

  const handleOutcomeNext = useCallback(() => {
    if (!outcome) return;
    setStep("details");
  }, [outcome]);

  const handleDetailsNext = useCallback(() => {
    setStep("action");
  }, []);

  const handleSaveSession = useCallback(
    async (horizonId?: string) => {
      try {
        const payload: CreateSessionRequest = {
          outcome: outcome || "break-even",
          pnl,
          bankrollBefore: parseFloat(bankrollBefore || "0"),
          bankrollAfter: parseFloat(bankrollAfter || "0"),
          actionTaken: action || "kept-available",
          category: category || undefined,
          title: category ? `${category} Session` : undefined,
          notes: notes || undefined,
          horizonId,
        };

        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        onSessionCreated();
      } catch {
        // Silent — session save is non-critical
      }
    },
    [outcome, pnl, bankrollBefore, bankrollAfter, action, category, notes, onSessionCreated],
  );

  const handleActionConfirm = useCallback(async () => {
    if (action === "protected-gains" || action === "moved-to-horizon") {
      const amount = parseFloat(horizonAmount || "0");
      const days = horizonDays || 30;
      if (amount > 0 && days > 0) {
        setStep("pending");
        createLock.createLock(amount, days * 86400);
        // After lock is confirmed, save session with horizon
        return;
      }
    }

    // No horizon needed — save session directly
    setStep("success");
    await handleSaveSession();
  }, [action, horizonAmount, horizonDays, createLock, handleSaveSession]);

  // Save session after horizon confirmed
  useEffect(() => {
    if (createLock.isConfirmed && step === "success") {
      // Session will be saved with horizon link
      // For now, just refetch
      onSessionCreated();
    }
  }, [createLock.isConfirmed, step, onSessionCreated]);

  const handleClose = useCallback(() => {
    setStep("outcome");
    onClose();
  }, [onClose]);

  const numericBankrollBefore = parseFloat(bankrollBefore || "0");
  const numericBankrollAfter = parseFloat(bankrollAfter || "0");

  return (
    <CapitalModal open={open} onClose={handleClose} title="End session">
      {step === "success" ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-text-primary">
            {action === "protected-gains"
              ? "Session gains protected."
              : action === "moved-to-horizon"
                ? "Capital moved into a horizon."
                : "Session recorded."}
          </p>
          <p className="text-small text-text-tertiary mt-2">
            {action === "protected-gains" || action === "moved-to-horizon"
              ? "Bankroll preserved after session."
              : "Remaining bankroll kept available."}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-6 rounded-lg bg-green-500 text-white px-5 py-2.5 text-small font-medium hover:bg-green-600 shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      ) : step === "pending" ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle mb-4">
            <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-text-primary">Capital entering protection.</p>
          <p className="text-tiny text-text-muted mt-2">Confirm in your wallet when prompted.</p>
        </div>
      ) : step === "action" ? (
        <div className="space-y-5">
          <p className="text-small text-text-secondary leading-relaxed">
            {outcome === "won"
              ? "You have session gains. What would you like to do?"
              : outcome === "lost"
                ? "The session is over. How would you like to proceed with your remaining bankroll?"
                : "The session is done. Choose your next step."}
          </p>

          {/* Actions */}
          <div className="space-y-2">
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
              Next step
            </label>

            <button
              type="button"
              onClick={() => { setAction("kept-available"); }}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left transition-all duration-200",
                action === "kept-available"
                  ? "border-green-200 bg-green-50"
                  : "border-border bg-surface hover:border-border-hover hover:shadow-sm",
              )}
            >
              <span className="text-sm font-medium text-text-primary block">Keep available</span>
              <span className="text-tiny text-text-muted block mt-0.5">Capital stays in your available balance.</span>
            </button>

            <button
              type="button"
              onClick={() => { setAction("protected-gains"); }}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left transition-all duration-200",
                action === "protected-gains"
                  ? "border-green-200 bg-green-50"
                  : "border-border bg-surface hover:border-border-hover hover:shadow-sm",
              )}
            >
              <span className="text-sm font-medium text-text-primary block">Protect gains</span>
              <span className="text-tiny text-text-muted block mt-0.5">Move session gains into a protected horizon.</span>
            </button>

            <button
              type="button"
              onClick={() => { setAction("moved-to-horizon"); }}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left transition-all duration-200",
                action === "moved-to-horizon"
                  ? "border-green-200 bg-green-50"
                  : "border-border bg-surface hover:border-border-hover hover:shadow-sm",
              )}
            >
              <span className="text-sm font-medium text-text-primary block">Move to horizon</span>
              <span className="text-tiny text-text-muted block mt-0.5">Secure remaining capital in a new horizon.</span>
            </button>
          </div>

          {/* Horizon options (shown when protecting or moving) */}
          {(action === "protected-gains" || action === "moved-to-horizon") && (
            <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div>
                <label className="text-tiny font-medium uppercase tracking-wider text-green-700/80 mb-1.5 block">
                  Amount to protect
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted font-light">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={horizonAmount}
                    onChange={(e) => setHorizonAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-green-200 bg-surface px-8 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-tiny font-medium uppercase tracking-wider text-green-700/80 mb-1.5 block">
                  Horizon duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {HORIZON_OPTIONS.map((o) => (
                    <button
                      key={o.days}
                      type="button"
                      onClick={() => setHorizonDays(o.days)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-center transition-all duration-200",
                        horizonDays === o.days
                          ? "border-green-200 bg-surface text-green-700"
                          : "border-green-200/50 bg-surface text-text-secondary hover:border-green-200",
                      )}
                    >
                      <span className="text-xs font-medium block">{o.days}</span>
                      <span className="text-[10px] text-text-muted block">days</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleActionConfirm}
              disabled={!action}
              className={cn(
                "w-full rounded-lg py-2.5 text-small font-medium transition-all",
                action
                  ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                  : "bg-surface-hover text-text-muted cursor-not-allowed",
              )}
            >
              {action === "protected-gains" || action === "moved-to-horizon"
                ? "Confirm & protect"
                : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="w-full rounded-lg py-2 text-small font-medium text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface-hover transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      ) : step === "details" ? (
        <div className="space-y-5">
          <p className="text-small text-text-secondary leading-relaxed">
            Enter your bankroll state before and after the session.
          </p>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
              Category (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(category === c ? "" : c)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-tiny font-medium transition-all duration-200",
                    category === c
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-surface text-text-muted border-border hover:border-border-hover hover:text-text-tertiary",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Bankroll inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary mb-1.5 block">
                Bankroll before
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted font-light">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={bankrollBefore}
                  onChange={(e) => setBankrollBefore(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-surface-subtle px-8 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary mb-1.5 block">
                Bankroll after
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted font-light">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={bankrollAfter}
                  onChange={(e) => setBankrollAfter(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-surface-subtle px-8 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Computed PnL */}
          {(numericBankrollBefore > 0 || numericBankrollAfter > 0) && (
            <div className="rounded-lg border border-border bg-surface-subtle p-3 flex items-center justify-between">
              <span className="text-tiny font-medium text-text-tertiary uppercase tracking-wider">Session result</span>
              <span
                className={cn(
                  "text-sm font-medium tabular-nums",
                  pnl > 0 ? "text-green-600" : pnl < 0 ? "text-danger" : "text-text-tertiary",
                )}
              >
                {pnl > 0 ? "+" : ""}${formatUSD(pnl)}
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary mb-1.5 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="A quiet note about the session..."
              rows={2}
              className="w-full rounded-lg border border-border bg-surface-subtle px-3 py-2 text-small text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors resize-none"
            />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDetailsNext}
              disabled={!outcome}
              className="w-full rounded-lg py-2.5 text-small font-medium bg-green-500 text-white hover:bg-green-600 shadow-sm transition-colors"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => setStep("outcome")}
              className="w-full rounded-lg py-2 text-small font-medium text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface-hover transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        // ── Outcome step ──
        <div className="space-y-5">
          <p className="text-small text-text-secondary leading-relaxed">
            Before you move on — reflect on how the session went.
          </p>

          <div className="space-y-2">
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
              Session outcome
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["won", "lost", "break-even"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o === outcome ? null : o)}
                  className={cn(
                    "rounded-lg border py-3 text-center transition-all duration-200 text-sm",
                    outcome === o
                      ? "border-green-200 bg-green-50 text-green-700 font-medium"
                      : "border-border bg-surface-subtle text-text-secondary hover:border-border-hover hover:text-text-primary",
                  )}
                >
                  {o === "won" ? "Won" : o === "lost" ? "Lost" : "Break even"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleOutcomeNext}
              disabled={!outcome}
              className={cn(
                "w-full rounded-lg py-2.5 text-small font-medium transition-all",
                outcome
                  ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                  : "bg-surface-hover text-text-muted cursor-not-allowed",
              )}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg py-2 text-small font-medium text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </CapitalModal>
  );
}

/* ── Page ──────────────────────────────────── */

export default function SessionsPage() {
  const [sessions, setSessions] = useState<BettingSession[]>([]);
  const [now] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── Summary derived from sessions ──
  const summary = useMemo(() => {
    const totalPnl = sessions.reduce((sum, s) => sum + s.pnl, 0);
    const protectedPnl = sessions
      .filter((s) => s.actionTaken === "protected-gains" || s.actionTaken === "moved-to-horizon")
      .reduce((sum, s) => sum + Math.max(0, s.pnl), 0);
    const horizonCount = sessions.filter((s) => s.horizonId).length;
    const recentCount = sessions.filter((s) => {
      const diff = now - new Date(s.createdAt).getTime();
      return diff < 7 * 86400000;
    }).length;

    return {
      totalPnl: formatUSD(totalPnl),
      protectedPnl: formatUSD(protectedPnl),
      horizonCount,
      recentCount,
    };
  }, [sessions, now]);

  const handleSessionCreated = useCallback(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-display text-text-primary">Sessions</h1>
              <p className="text-body text-text-secondary mt-1">
                A quiet record of how decisions became capital movement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-5 py-2.5 text-small font-medium hover:bg-green-600 shadow-sm transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              End Session
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <SummaryCard
            label="Session Balance"
            value={`$${summary.totalPnl}`}
            subtext="Net from all sessions"
            iconKey="balance"
          />
          <SummaryCard
            label="Protected After"
            value={`$${summary.protectedPnl}`}
            subtext="Gains moved into protection"
            iconKey="protected"
          />
          <SummaryCard
            label="Horizons From Sessions"
            value={String(summary.horizonCount)}
            subtext="Horizons linked to sessions"
            iconKey="horizons"
          />
          <SummaryCard
            label="Recent Activity"
            value={String(summary.recentCount)}
            subtext="Sessions this week"
            iconKey="recent"
          />
        </div>

        {/* ── Session Timeline ── */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-6">
                <div className="h-4 w-48 bg-surface-hover rounded mb-3" />
                <div className="h-3 w-32 bg-surface-hover rounded" />
              </div>
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <EmptyState onStartSession={() => setModalOpen(true)} />
        )}
      </div>

      {/* ── New Session Modal ── */}
      <NewSessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSessionCreated={handleSessionCreated}
      />
    </PageShell>
  );
}
