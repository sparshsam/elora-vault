"use client";

import { useState, useEffect, useMemo, useCallback, createElement } from "react";
import { useCapitalState } from "@/lib/capital-state";
import { useCreateLock } from "@/lib/web3/tx-hooks";
import { PageShell } from "@/components/layout/page-shell";
import { CapitalModal } from "@/components/capital/capital-modal";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  Plus,
  DollarSign,
  HelpCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BetRecord, PredictionType, PredictionStatus, PredictionSettleResult } from "@/types/prediction";

/* ── Summary Icons ─────────────────────────── */

const SUMMARY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  committed: HelpCircle,
  open: Target,
  potential: TrendingUp,
  settled: DollarSign,
};

const SUMMARY_COLORS: Record<string, string> = {
  committed: "text-amber-700 bg-amber-50 border-amber-200",
  open: "text-green-600 bg-green-50 border-green-200",
  potential: "text-green-700 bg-green-100 border-green-200",
  settled: "text-text-secondary bg-surface-subtle border-border",
};

/* ── Helpers ───────────────────────────────── */

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateProfit(odds: number, stake: number): number {
  if (odds > 0) return stake * odds / 100;
  return stake * 100 / Math.abs(odds);
}

function calculateTotalReturn(odds: number, stake: number): number {
  return stake + calculateProfit(odds, stake);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    const h = Math.floor(diffMs / 3600000);
    return h === 0 ? `${Math.floor(diffMs / 60000)}m ago` : `${h}h ago`;
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
  iconKey: string;
}

function SummaryCard({ label, value, subtext, iconKey }: SummaryCardProps) {
  const Icon = SUMMARY_ICONS[iconKey] || DollarSign;
  const colorClass = SUMMARY_COLORS[iconKey] || SUMMARY_COLORS.settled;
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-4 md:p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">{label}</span>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", colorClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-heading font-medium text-text-primary">{value}</p>
      <p className="text-tiny text-text-muted mt-0.5">{subtext}</p>
    </div>
  );
}

/* Prediction Card */

interface PredictionCardProps {
  bet: BetRecord;
  onSettle: (id: string, result: PredictionSettleResult) => void;
  onProtect: (predictionId: string, amount: number, horizon: number) => void;
  protectingId: string | null;
}

function PredictionCard({ bet, onSettle, onProtect, protectingId }: PredictionCardProps) {
  const isOpen = bet.status === "open";
  const isWin = bet.status === "won";
  const isLoss = bet.status === "lost";
  const isPush = bet.status === "push";
  const [showProtect, setShowProtect] = useState(false);
  const isProtecting = protectingId === bet.id;

  const statusBadge = isOpen
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : isWin
      ? "bg-green-50 text-green-700 border-green-200"
      : isLoss
        ? "bg-red-50 text-danger border-red-200"
        : "bg-surface-subtle text-text-secondary border-border";

  const statusLabel = isOpen ? "Open" : isWin ? "Won" : isLoss ? "Lost" : "Push";

  const pnl = isWin
    ? bet.potentialProfit
    : isLoss
      ? -bet.stake
      : 0;

  const oddsDisplay = bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 md:p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Status icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            isWin
              ? "border-green-200 bg-green-50"
              : isLoss
                ? "border-red-200 bg-red-50"
                : isPush
                  ? "border-border bg-surface-subtle"
                  : "border-amber-200 bg-amber-50",
          )}
        >
          {isOpen ? (
            <HelpCircle className="h-5 w-5 text-amber-600" />
          ) : (
            createElement(
              isWin ? TrendingUp : isLoss ? TrendingDown : Minus,
              { className: cn("h-5 w-5", isWin ? "text-green-600" : isLoss ? "text-danger" : "text-text-tertiary") },
            )
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-medium text-text-primary">
                  {bet.description || "Prediction"}
                </h3>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", statusBadge)}>
                  {statusLabel}
                </span>
                {bet.horizonProtected && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    <Shield className="h-3 w-3" />
                    Protected
                  </span>
                )}
              </div>
              <p className="text-small text-text-secondary mt-1 leading-relaxed">
                {bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1)} - {oddsDisplay} - ${formatUSD(bet.stake)} committed
              </p>
            </div>
            <span
              className={cn(
                "text-sm font-medium tabular-nums shrink-0",
                isWin ? "text-green-600" : isLoss ? "text-danger" : "text-text-primary",
              )}
            >
              ${formatUSD(isOpen ? bet.potentialReturn : bet.stake + pnl)}
            </span>
          </div>

          {/* Odds breakdown */}
          {isOpen && (
            <div className="mt-3 grid grid-cols-3 gap-4 max-w-xs">
              <div>
                <span className="text-tiny text-text-muted block">Stake</span>
                <span className="text-small font-medium text-text-primary">${formatUSD(bet.stake)}</span>
              </div>
              <div>
                <span className="text-tiny text-text-muted block">Profit</span>
                <span className="text-small font-medium text-green-600">${formatUSD(bet.potentialProfit)}</span>
              </div>
              <div>
                <span className="text-tiny text-text-muted block">Return</span>
                <span className="text-small font-medium text-text-primary">${formatUSD(bet.potentialReturn)}</span>
              </div>
            </div>
          )}

          {/* Settled PnL */}
          {!isOpen && (
            <p className={cn("text-small font-medium mt-2", isWin ? "text-green-600" : isLoss ? "text-danger" : "text-text-tertiary")}>
              {isWin ? `+$${formatUSD(pnl)}` : isLoss ? `-$${formatUSD(bet.stake)}` : "Stake returned"}
            </p>
          )}

          {/* Linked horizon indicator */}
          {bet.horizonProtected && (
            <p className="flex items-center gap-1.5 text-tiny text-green-600 mt-2">
              <CheckCircle className="h-3 w-3" />
              Return protected after prediction.
            </p>
          )}

          {/* Timestamp */}
          <p className="text-tiny text-text-muted mt-2">{formatDate(bet.createdAt)}</p>

          {/* Active prediction actions */}
          {isOpen && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => onSettle(bet.id, "WIN")}
                className="rounded-lg bg-green-500 text-white px-3 py-1.5 text-tiny font-medium hover:bg-green-600 transition-colors shadow-sm"
              >
                Won
              </button>
              <button
                type="button"
                onClick={() => onSettle(bet.id, "LOSS")}
                className="rounded-lg border border-border bg-surface-subtle text-text-secondary px-3 py-1.5 text-tiny font-medium hover:text-danger hover:border-danger/30 transition-colors"
              >
                Lost
              </button>
              <button
                type="button"
                onClick={() => onSettle(bet.id, "PUSH")}
                className="rounded-lg border border-border bg-surface-subtle text-text-muted px-3 py-1.5 text-tiny font-medium hover:text-text-secondary transition-colors"
              >
                Push
              </button>
            </div>
          )}

          {/* Post-win protection prompt (only if not already protected) */}
          {isWin && !bet.horizonProtected && !showProtect && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowProtect(true)}
                disabled={isProtecting}
                className="inline-flex items-center gap-1.5 text-tiny font-medium text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
              >
                <Shield className="h-3 w-3" />
                Protect part of this return
              </button>
            </div>
          )}

          {isWin && showProtect && (
            <ProtectPrompt
              betId={bet.id}
              profit={bet.potentialProfit}
              totalReturn={bet.potentialReturn}
              onProtect={onProtect}
              onDismiss={() => setShowProtect(false)}
              protecting={isProtecting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Protection Prompt (inline) ────────────── */

interface ProtectPromptProps {
  betId: string;
  profit: number;
  totalReturn: number;
  onProtect: (betId: string, amount: number, horizon: number) => void;
  onDismiss: () => void;
  protecting: boolean;
}

const HORIZONS = [7, 30, 90, 180];

function ProtectPrompt({ betId, profit, totalReturn, onProtect, onDismiss, protecting }: ProtectPromptProps) {
  const [horizon, setHorizon] = useState<number | null>(null);
  const [mode, setMode] = useState<"profit" | "full" | null>(null);

  const amount = mode === "full" ? totalReturn : mode === "profit" ? profit : 0;
  const canConfirm = mode !== null && horizon !== null;

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    onProtect(betId, amount, horizon);
  }, [betId, amount, horizon, canConfirm, onProtect]);

  return (
    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
      <p className="text-tiny font-medium text-green-700">Protect part of this return?</p>

      {/* Mode: Profit or Full Return */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("profit")}
          className={cn(
            "flex-1 rounded-lg border px-3 py-2 text-center transition-all",
            mode === "profit"
              ? "border-green-200 bg-surface text-green-700"
              : "border-green-200/50 bg-surface/50 text-text-secondary hover:bg-surface",
          )}
        >
          <span className="text-tiny font-medium block">Protect Profit</span>
          <span className="text-[10px] text-text-muted block mt-0.5">${formatUSD(profit)}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("full")}
          className={cn(
            "flex-1 rounded-lg border px-3 py-2 text-center transition-all",
            mode === "full"
              ? "border-green-200 bg-surface text-green-700"
              : "border-green-200/50 bg-surface/50 text-text-secondary hover:bg-surface",
          )}
        >
          <span className="text-tiny font-medium block">Full Return</span>
          <span className="text-[10px] text-text-muted block mt-0.5">${formatUSD(totalReturn)}</span>
        </button>
      </div>

      {/* Horizon selector */}
      {mode && (
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-green-700/80 mb-1.5 block">
            Horizon
          </label>
          <div className="grid grid-cols-4 gap-2">
            {HORIZONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setHorizon(d)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-center transition-all",
                  horizon === d
                    ? "border-green-200 bg-surface text-green-700"
                    : "border-green-200/50 bg-surface/50 text-text-secondary hover:bg-surface",
                )}
              >
                <span className="text-tiny font-medium block">{d}</span>
                <span className="text-[10px] text-text-muted block">days</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary + actions */}
      {canConfirm && (
        <p className="text-tiny text-green-700">
          ${formatUSD(amount)} protected for {horizon} days.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm || protecting}
          className={cn(
            "flex-1 rounded-lg px-3 py-1.5 text-tiny font-medium transition-all",
            canConfirm && !protecting
              ? "bg-green-500 text-white hover:bg-green-600"
              : protecting
                ? "bg-surface-hover text-text-muted cursor-not-allowed animate-pulse"
                : "bg-surface-hover text-text-muted cursor-not-allowed",
          )}
        >
          {protecting ? "Protecting..." : "Protect"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={protecting}
          className="rounded-lg px-3 py-1.5 text-tiny font-medium text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-50"
        >
          Keep available
        </button>
      </div>
    </div>
  );
}

/* Create Prediction Modal */

interface CreatePredictionModalProps {
  open: boolean;
  onClose: () => void;
  onPredictionLogged: () => void;
  availableBalance: number;
}

function CreatePredictionModal({ open, onClose, onPredictionLogged, availableBalance }: CreatePredictionModalProps) {
  const [description, setDescription] = useState("");
  const [betType, setBetType] = useState<PredictionType>("moneyline");
  const [odds, setOdds] = useState("");
  const [stake, setStake] = useState("");
  const [step, setStep] = useState<"input" | "submitting" | "success" | "error">("input");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) {
      setDescription("");
      setBetType("moneyline");
      setOdds("");
      setStake("");
      setStep("input");
      setErrorMsg("");
    }
  }, [open]);

  const numericOdds = parseInt(odds.replace(/[^0-9-]/g, ""), 10) || 0;
  const numericStake = parseFloat(stake || "0");
  const profit = numericOdds && numericStake ? calculateProfit(numericOdds, numericStake) : 0;
  const totalReturn = numericOdds && numericStake ? calculateTotalReturn(numericOdds, numericStake) : 0;
  const isValid = numericStake > 0 && numericOdds !== 0 && numericStake <= availableBalance;

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    setStep("submitting");
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          predictionType: betType,
          betType,
          odds: numericOdds,
          stake: numericStake,
        }),
      });
      if (res.ok) {
        setStep("success");
        onPredictionLogged();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to create prediction");
        setStep("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStep("error");
    }
  }, [isValid, description, betType, numericOdds, numericStake, onPredictionLogged]);

  const handleClose = useCallback(() => {
    setStep("input");
    onClose();
  }, [onClose]);

  return (
    <CapitalModal open={open} onClose={handleClose} title="Create Prediction">
      {step === "success" ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-text-primary">Prediction created successfully.</p>
          <p className="text-small text-text-tertiary mt-2">${formatUSD(numericStake)} committed.</p>
          <button type="button" onClick={handleClose}
            className="mt-6 rounded-lg bg-green-500 text-white px-5 py-2.5 text-small font-medium hover:bg-green-600 shadow-sm transition-colors">
            Done
          </button>
        </div>
      ) : step === "error" ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 mb-4">
            <Minus className="h-6 w-6 text-danger" />
          </div>
          <p className="text-sm font-medium text-text-primary">{errorMsg}</p>
          <button type="button" onClick={() => setStep("input")}
            className="mt-6 rounded-lg bg-surface-subtle text-text-secondary px-5 py-2.5 text-small font-medium hover:text-text-primary transition-colors border border-border">
            Try again
          </button>
        </div>
      ) : step === "submitting" ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle mb-4">
            <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-text-primary">Creating prediction...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Description */}
          <div>
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary mb-1.5 block">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Leafs moneyline vs Boston"
              className="w-full rounded-lg border border-border bg-surface-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors"
            />
          </div>

          {/* Prediction Type */}
          <div>
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary mb-1.5 block">
              Prediction type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["moneyline", "spread", "totals"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBetType(t)}
                  className={cn(
                    "rounded-lg border py-2 text-center text-small font-medium transition-all",
                    betType === t
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-border bg-surface-subtle text-text-secondary hover:border-border-hover",
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Odds + Stake row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary mb-1.5 block">
                Odds
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={odds}
                onChange={(e) => setOdds(e.target.value.replace(/[^0-9-]/g, ""))}
                placeholder="+150"
                className="w-full rounded-lg border border-border bg-surface-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary mb-1.5 block">
                Stake ($)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={stake}
                onChange={(e) => setStake(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="10.00"
                className="w-full rounded-lg border border-border bg-surface-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors"
              />
            </div>
          </div>

          {/* Calculated return */}
          {numericStake > 0 && numericOdds !== 0 && (
            <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-2">
              <div className="flex justify-between text-small">
                <span className="text-text-secondary">Stake</span>
                <span className="font-medium text-text-primary">${formatUSD(numericStake)}</span>
              </div>
              <div className="flex justify-between text-small">
                <span className="text-text-secondary">Potential profit</span>
                <span className="font-medium text-green-600">+${formatUSD(profit)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-small">
                <span className="font-medium text-text-primary">Potential return</span>
                <span className="font-medium text-text-primary">${formatUSD(totalReturn)}</span>
              </div>
            </div>
          )}

          {numericStake > availableBalance && (
            <p className="text-tiny text-danger">Stake exceeds available balance of ${formatUSD(availableBalance)}.</p>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              className={cn(
                "w-full rounded-lg py-2.5 text-small font-medium transition-all",
                isValid
                  ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                  : "bg-surface-hover text-text-muted cursor-not-allowed",
              )}
            >
              {numericStake > 0 && numericOdds !== 0
                ? `Create Prediction - $${formatUSD(numericStake)} at ${numericOdds > 0 ? "+" : ""}${numericOdds}`
                : "Create Prediction"}
            </button>
            <button type="button" onClick={handleClose}
              className="w-full rounded-lg py-2 text-small font-medium text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface-hover transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </CapitalModal>
  );
}

/* ── Empty State ───────────────────────────── */

function EmptyState({ onLogBet }: { onLogBet: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-12 md:p-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-subtle">
          <HelpCircle className="h-5 w-5 text-text-tertiary" />
        </div>
        <p className="text-sm font-medium text-text-primary">No predictions created yet.</p>
        <p className="text-small text-text-tertiary mt-2 max-w-xs">
          Create your first prediction to track committed capital, potential return, and settled results.
        </p>
        <button
          type="button"
          onClick={onLogBet}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-5 py-2.5 text-small font-medium hover:bg-green-600 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create your first prediction
        </button>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────── */

export default function SessionsPage() {
  const capital = useCapitalState();
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [protectingId, setProtectingId] = useState<string | null>(null);

  const loadBets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bets?limit=100");
      if (res.ok) {
        const data = await res.json();
        setBets(
          (data.predictions || data.bets || []).map((b: Record<string, unknown>) => {
            const desc = (b.description as string) || "";
            const predictionType = ((b.marketType as string)?.toLowerCase?.() || "moneyline") as PredictionType;
            return {
              id: b.id as string,
              description: desc.replace(/ — protected .*$/, ""), // strip protection suffix
              predictionType,
              betType: predictionType,
              odds: (b.odds as number) || 0,
              stake: (b.stake as number) || 0,
              potentialProfit: (b.potentialProfit as number) || 0,
              potentialReturn: (b.potential_return as number) || 0,
              status: ((b.status as string)?.toLowerCase?.() || "open") as PredictionStatus,
              createdAt: (b.createdAt as string) || new Date().toISOString(),
              settledAt: (b.settledAt as string) || undefined,
              horizonProtected: desc.includes("protected"),
            };
          }),
        );
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBets(); }, [loadBets]);

  // ── Summary ──
  const summary = useMemo(() => {
    const activePredictions = bets.filter((b) => b.status === "open");
    const committed = activePredictions.reduce((sum, b) => sum + b.stake, 0);
    const potentialReturn = activePredictions.reduce((sum, b) => sum + b.potentialReturn, 0);
    const settledPnl = bets
      .filter((b) => b.status !== "open")
      .reduce((sum, b) => {
        if (b.status === "won") return sum + b.potentialProfit;
        if (b.status === "lost") return sum - b.stake;
        return sum; // push — no change
      }, 0);

    return { committed, activeCount: activePredictions.length, potentialReturn, settledPnl };
  }, [bets]);

  const handleSettle = useCallback(async (id: string, result: PredictionSettleResult) => {
    try {
      await fetch(`/api/bets/${id}/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      await loadBets();
    } catch {
      // silently fail
    }
  }, [loadBets]);

  const createLock = useCreateLock();

  const handleProtect = useCallback(async (betId: string, amount: number, durationDays: number) => {
    setProtectingId(betId);
    try {
      // 1. Create onchain horizon
      createLock.createLock(amount, durationDays * 86400);
      // 2. Record in backend
      await fetch(`/api/bets/${betId}/protect`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, durationDays }),
      });
      // 3. Refresh
      await loadBets();
    } catch {
      // silently fail
    } finally {
      setProtectingId(null);
    }
  }, [createLock, loadBets]);

  const handleBetLogged = useCallback(() => {
    loadBets();
  }, [loadBets]);

  const activePredictions = bets.filter((b) => b.status === "open");
  const settledPredictions = bets.filter((b) => b.status !== "open");

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-display text-text-primary">Sessions</h1>
              <p className="text-body text-text-secondary mt-1">
                Track predictions and settle outcomes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-5 py-2.5 text-small font-medium hover:bg-green-600 shadow-sm transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              Create Prediction
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <SummaryCard label="Committed" value={`$${formatUSD(summary.committed)}`} subtext="Capital in active predictions" iconKey="committed" />
          <SummaryCard label="Active" value={String(summary.activeCount)} subtext="Awaiting settlement" iconKey="open" />
          <SummaryCard label="Potential Return" value={`$${formatUSD(summary.potentialReturn)}`} subtext="If active predictions win" iconKey="potential" />
          <SummaryCard
            label="Net result"
            value={`${summary.settledPnl >= 0 ? "+" : ""}$${formatUSD(summary.settledPnl)}`}
            subtext="Net from settled predictions"
            iconKey="settled"
          />
        </div>

        {/* Prediction List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-6">
                <div className="h-4 w-48 bg-surface-hover rounded mb-3" />
                <div className="h-3 w-32 bg-surface-hover rounded" />
              </div>
            ))}
          </div>
        ) : bets.length > 0 ? (
          <div className="space-y-6">
            {activePredictions.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-text-primary mb-4">Active</h2>
                <div className="space-y-4">
                  {activePredictions.map((bet) => (
                    <PredictionCard key={bet.id} bet={bet} onSettle={handleSettle} onProtect={handleProtect} protectingId={protectingId} />
                  ))}
                </div>
              </div>
            )}
            {settledPredictions.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-text-primary mb-4">Settled</h2>
                <div className="space-y-4">
                  {settledPredictions.map((bet) => (
                    <PredictionCard key={bet.id} bet={bet} onSettle={handleSettle} onProtect={handleProtect} protectingId={protectingId} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState onLogBet={() => setModalOpen(true)} />
        )}
      </div>

      {/* Create Prediction Modal */}
      <CreatePredictionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPredictionLogged={handleBetLogged}
        availableBalance={capital.balances.available}
      />
    </PageShell>
  );
}
