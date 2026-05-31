"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CapitalModal } from "./capital-modal";
import { useCreateLock } from "@/lib/web3/tx-hooks";

/* ── Types ───────────────────────────────────────────── */

type SessionOutcome = "won" | "lost" | "break-even" | null;

type PostSessionAction = "keep-available" | "protect-gains" | "move-horizon" | null;

/* ── Outcome selector ────────────────────────────────── */

const OUTCOMES: { key: SessionOutcome; label: string; emoji: string }[] = [
  { key: "won", label: "Won", emoji: "—" },
  { key: "lost", label: "Lost", emoji: "—" },
  { key: "break-even", label: "Break even", emoji: "—" },
];

interface OutcomeSelectorProps {
  selected: SessionOutcome;
  onChange: (o: SessionOutcome) => void;
}

function OutcomeSelector({ selected, onChange }: OutcomeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
        Session result
      </label>
      <div className="grid grid-cols-3 gap-3">
        {OUTCOMES.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key === selected ? null : o.key)}
            className={cn(
              "rounded-lg border px-3 py-3 text-center transition-all duration-200 text-sm",
              selected === o.key
                ? "border-green-200 bg-green-50 text-green-700 font-medium"
                : "border-border bg-surface-subtle text-text-secondary hover:border-border-hover hover:text-text-primary",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Horizon Selector (for post-session protection) ──── */

const HORIZON_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

interface HorizonSelectProps {
  selected: number | null;
  onChange: (d: number) => void;
}

function HorizonSelect({ selected, onChange }: HorizonSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
        Choose horizon
      </label>
      <div className="grid grid-cols-3 gap-3">
        {HORIZON_OPTIONS.map((o) => (
          <button
            key={o.days}
            type="button"
            onClick={() => onChange(o.days)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-center transition-all duration-200",
              selected === o.days
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-border bg-surface-subtle text-text-secondary hover:border-border-hover hover:text-text-primary",
            )}
          >
            <span className="text-sm font-medium block">{o.days}</span>
            <span className="text-tiny text-text-muted block mt-0.5">days</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Success / Pending / Error states ────────────────── */

function SuccessState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
        <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none">
          <path d="M7 13l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-text-primary">{message}</p>
    </div>
  );
}

function PendingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle mb-4">
        <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-text-primary">{message}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  END SESSION MODAL                                       */
/* ─────────────────────────────────────────────────────── */

interface EndSessionModalProps {
  open: boolean;
  onClose: () => void;
  availableBalance: number;
}

export function EndSessionModal({ open, onClose, availableBalance }: EndSessionModalProps) {
  const [step, setStep] = useState<"reflect" | "action" | "pending" | "success">("reflect");
  const [outcome, setOutcome] = useState<SessionOutcome>(null);
  const [action, setAction] = useState<PostSessionAction>(null);
  const [protectAmount, setProtectAmount] = useState("");
  const [horizon, setHorizon] = useState<number | null>(null);

  const createLock = useCreateLock();

  // Reflection prompts
  const reflections = [
    "How does this session feel?",
    "Would your future self approve of this action?",
    "Is this capital needed before the horizon ends?",
  ];
  const [selectedReflection, setSelectedReflection] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setStep("reflect");
      setOutcome(null);
      setAction(null);
      setProtectAmount("");
      setHorizon(null);
      setSelectedReflection(null);
    }
  }, [open]);

  // Track createLock tx
  useEffect(() => {
    if (step === "pending" && createLock.isConfirmed) {
      setStep("success");
    }
  }, [step, createLock.isConfirmed]);

  const numericProtectAmount = parseFloat(protectAmount || "0");
  const hasBalance = availableBalance > 0;

  const handleContinue = useCallback(() => {
    if (!outcome) return;
    setStep("action");
  }, [outcome]);

  const handleProtectConfirm = useCallback(() => {
    if (!horizon || numericProtectAmount <= 0) return;
    const durationSeconds = horizon * 86400;
    createLock.createLock(numericProtectAmount, durationSeconds);
    setStep("pending");
  }, [horizon, numericProtectAmount, createLock]);

  const handleSkipToSuccess = useCallback(() => {
    setStep("success");
  }, []);

  const handleClose = useCallback(() => {
    setStep("reflect");
    onClose();
  }, [onClose]);

  // Determine the success message based on the action
  const successMessage = action === "protect-gains"
    ? "Session gains protected within their horizon."
    : action === "move-horizon"
      ? "Bankroll capital secured in a new horizon."
      : "Session recorded. Bankroll remains available.";

  return (
    <CapitalModal open={open} onClose={handleClose} title="End session">
      {step === "success" ? (
        <SuccessState message={successMessage} />
      ) : step === "pending" ? (
        <PendingState message="Capital entering protection." />
      ) : step === "action" ? (
        <div className="space-y-5">
          <p className="text-small text-text-secondary leading-relaxed">
            {outcome === "won"
              ? "You have gains from your session. What would you like to do?"
              : outcome === "lost"
                ? "The session is over. How would you like to proceed with your remaining bankroll?"
                : "The session is done. Your bankroll is where it is."}
          </p>

          {/* Action options */}
          <div className="space-y-2">
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
              Next step
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => { setAction("keep-available"); handleSkipToSuccess(); }}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left transition-all duration-200",
                  "border-border bg-surface hover:border-border-hover hover:shadow-sm",
                )}
              >
                <span className="text-sm font-medium text-text-primary block">Keep available</span>
                <span className="text-tiny text-text-muted block mt-0.5">
                  Capital stays in your available balance.
                </span>
              </button>

              <div className={cn(
                "rounded-lg border transition-all duration-200 overflow-hidden",
                action === "protect-gains"
                  ? "border-green-200 bg-green-50"
                  : "border-border bg-surface hover:border-border-hover hover:shadow-sm",
              )}>
                <button
                  type="button"
                  onClick={() => setAction("protect-gains")}
                  className="w-full px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-text-primary block">Protect gains</span>
                  <span className="text-tiny text-text-muted block mt-0.5">
                    Move capital into a protected horizon.
                  </span>
                </button>

                {action === "protect-gains" && (
                  <div className="px-4 pb-4 space-y-4 border-t border-green-200 pt-4 mt-1">
                    <div>
                      <label className="text-tiny font-medium uppercase tracking-wider text-green-700/80 mb-1.5 block">
                        Amount to protect
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted font-light">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={protectAmount}
                          onChange={(e) => setProtectAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-green-200 bg-surface px-8 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors"
                        />
                      </div>
                    </div>
                    <HorizonSelect selected={horizon} onChange={setHorizon} />
                    <button
                      type="button"
                      onClick={handleProtectConfirm}
                      disabled={!horizon || numericProtectAmount <= 0}
                      className={cn(
                        "w-full rounded-lg py-2.5 text-small font-medium transition-all",
                        horizon && numericProtectAmount > 0
                          ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                          : "bg-surface-hover text-text-muted cursor-not-allowed",
                      )}
                    >
                      Protect ${numericProtectAmount > 0 ? numericProtectAmount.toFixed(2) : "0.00"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("reflect")}
            className="w-full rounded-lg py-2 text-small font-medium text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface-hover transition-colors"
          >
            Back
          </button>
        </div>
      ) : (
        // ── Reflect step ──
        <div className="space-y-5">
          <p className="text-small text-text-secondary leading-relaxed">
            Before you move on — reflect on how the session went.
          </p>

          <OutcomeSelector selected={outcome} onChange={setOutcome} />

          {/* Reflection prompts — optional */}
          <div className="space-y-2">
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
              Optional — a moment to consider
            </label>
            <div className="flex flex-wrap gap-2">
              {reflections.map((r, i) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedReflection(selectedReflection === i ? null : i)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-tiny font-medium transition-all duration-200 text-left",
                    selectedReflection === i
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-surface text-text-muted border-border hover:border-border-hover hover:text-text-tertiary",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {!hasBalance && (
            <p className="text-tiny text-text-tertiary text-center">
              No available balance to protect. You can still log your session.
            </p>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleContinue}
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
              className="w-full rounded-lg py-2.5 text-small font-medium text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg py-2.5 text-small font-medium bg-green-500 text-white hover:bg-green-600 shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </CapitalModal>
  );
}
