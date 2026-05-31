"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { CapitalModal } from "./capital-modal";

/* ── Types ───────────────────────────────────────────── */

interface OperationResult {
  success: boolean;
  message: string;
}

/* ── Shared helpers ──────────────────────────────────── */

// Mock: Simulates an onchain operation with delay
function simulateOperation(delayMs = 1500): Promise<OperationResult> {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true, message: "" }), delayMs),
  );
}

/* ── Amount Input ────────────────────────────────────── */

interface AmountInputProps {
  value: string;
  onChange: (val: string) => void;
  max?: number;
  label?: string;
  disabled?: boolean;
}

function AmountInput({ value, onChange, max, label, disabled }: AmountInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-number text-text-muted font-light">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]{0,2}"
          value={value}
          onChange={(e) => {
            // Allow only valid decimal numbers
            const v = e.target.value.replace(/[^0-9.]/g, "");
            const parts = v.split(".");
            if (parts.length > 2) return;
            if (parts[1] && parts[1].length > 6) return;
            onChange(v);
          }}
          disabled={disabled}
          placeholder="0.00"
          className="w-full rounded-lg border border-border bg-surface-subtle px-10 py-3 text-number text-text-primary placeholder:text-text-muted focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400/40 transition-colors disabled:opacity-50"
        />
      </div>
      {max !== undefined && (
        <div className="flex justify-between text-tiny text-text-muted">
          <span>Available: ${max.toFixed(2)}</span>
          {parseFloat(value || "0") > max && (
            <span className="text-danger">Exceeds available balance</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Token Selector (USDC only, visual) ──────────────── */

function TokenSelector() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
        <span className="text-tiny font-bold text-green-700">U</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">USDC</p>
        <p className="text-tiny text-text-tertiary">USD Coin</p>
      </div>
    </div>
  );
}

/* ── Horizon Duration Selector ───────────────────────── */

const HORIZON_OPTIONS = [
  { days: 7, label: "7-day horizon" },
  { days: 30, label: "30-day horizon" },
  { days: 90, label: "90-day horizon" },
] as const;

interface HorizonSelectorProps {
  selected: number | null;
  onChange: (days: number) => void;
}

function HorizonSelector({ selected, onChange }: HorizonSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
        Select horizon
      </label>
      <div className="grid grid-cols-3 gap-3">
        {HORIZON_OPTIONS.map((opt) => (
          <button
            key={opt.days}
            type="button"
            onClick={() => onChange(opt.days)}
            className={cn(
              "rounded-lg border px-3 py-3 text-center transition-all duration-200",
              selected === opt.days
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-border bg-surface-subtle text-text-secondary hover:border-border-hover hover:text-text-primary",
            )}
          >
            <span className="text-sm font-medium block">{opt.days}</span>
            <span className="text-tiny text-text-muted block mt-0.5">days</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Status Display ──────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────── */
/*  DEPOSIT MODAL                                          */
/* ─────────────────────────────────────────────────────── */

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
}

export function DepositModal({ open, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "confirming" | "success">("input");

  const numericAmount = parseFloat(amount || "0");

  const handleConfirm = useCallback(async () => {
    if (numericAmount <= 0) return;
    setStep("confirming");
    await simulateOperation();
    setStep("success");
    onDeposit(numericAmount);
  }, [numericAmount, onDeposit]);

  const handleClose = useCallback(() => {
    setAmount("");
    setStep("input");
    onClose();
  }, [onClose]);

  return (
    <CapitalModal open={open} onClose={handleClose} title="Deposit">
      {step === "success" ? (
        <SuccessState message="Capital added to your available balance." />
      ) : (
        <div className="space-y-5">
          {/* Amount */}
          <AmountInput
            value={amount}
            onChange={setAmount}
            label="Amount to deposit"
          />

          {/* Token */}
          <div className="space-y-2">
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
              Asset
            </label>
            <TokenSelector />
          </div>

          {/* Calm copy */}
          <p className="text-small text-text-muted leading-relaxed">
            Deposited capital is held in your self-custodied vault onchain.
            No one else can access your funds.
          </p>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={numericAmount <= 0 || step === "confirming"}
              className={cn(
                "w-full rounded-lg py-2.5 text-small font-medium transition-all",
                numericAmount > 0 && step === "input"
                  ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                  : "bg-surface-hover text-text-muted cursor-not-allowed",
              )}
            >
              {step === "confirming" ? "Confirming..." : "Deposit"}
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

      {/* Final close button */}
      {step === "success" && (
        <div className="mt-6">
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

/* ─────────────────────────────────────────────────────── */
/*  WITHDRAW MODAL                                         */
/* ─────────────────────────────────────────────────────── */

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onWithdraw: (amount: number) => void;
  maxAmount: number;
}

export function WithdrawModal({ open, onClose, onWithdraw, maxAmount }: WithdrawModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "confirm" | "confirming" | "success">("input");

  const numericAmount = parseFloat(amount || "0");
  const isValid = numericAmount > 0 && numericAmount <= maxAmount;

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";

  const handleContinue = useCallback(() => {
    if (!isValid) return;
    setStep("confirm");
  }, [isValid]);

  const handleConfirm = useCallback(async () => {
    setStep("confirming");
    await simulateOperation();
    setStep("success");
    onWithdraw(numericAmount);
  }, [numericAmount, onWithdraw]);

  const handleClose = useCallback(() => {
    setAmount("");
    setStep("input");
    onClose();
  }, [onClose]);

  return (
    <CapitalModal open={open} onClose={handleClose} title="Withdraw">
      {step === "success" ? (
        <SuccessState message="Capital returned to your connected wallet." />
      ) : step === "confirm" ? (
        <div className="space-y-5">
          {/* Summary */}
          <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-3">
            <div className="flex justify-between text-small">
              <span className="text-text-secondary">Amount</span>
              <span className="font-medium text-text-primary">${numericAmount.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between text-small">
              <span className="text-text-secondary">Destination</span>
              <span className="font-mono text-tiny text-text-primary">{shortAddress}</span>
            </div>
          </div>

          <p className="text-small text-text-muted leading-relaxed">
            Double-check the destination address before confirming. Elora cannot reverse
            onchain transactions.
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full rounded-lg py-2.5 text-small font-medium bg-green-500 text-white hover:bg-green-600 shadow-sm transition-colors"
            >
              Confirm withdrawal
            </button>
            <button
              type="button"
              onClick={() => setStep("input")}
              className="w-full rounded-lg py-2.5 text-small font-medium text-text-secondary hover:text-text-primary bg-surface-subtle hover:bg-surface-hover transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <AmountInput
            value={amount}
            onChange={setAmount}
            max={maxAmount}
            label="Amount to withdraw"
          />

          <p className="text-small text-text-muted leading-relaxed">
            Withdrawn capital is sent directly to your connected wallet onchain.
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!isValid}
              className={cn(
                "w-full rounded-lg py-2.5 text-small font-medium transition-all",
                isValid
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
        <div className="mt-6">
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

/* ─────────────────────────────────────────────────────── */
/*  PROTECT CAPITAL MODAL                                   */
/* ─────────────────────────────────────────────────────── */

interface ProtectCapitalModalProps {
  open: boolean;
  onClose: () => void;
  onProtect: (amount: number, durationDays: number) => void;
  maxAmount: number;
}

export function ProtectCapitalModal({
  open,
  onClose,
  onProtect,
  maxAmount,
}: ProtectCapitalModalProps) {
  const [amount, setAmount] = useState("");
  const [horizon, setHorizon] = useState<number | null>(null);
  const [step, setStep] = useState<"input" | "confirming" | "success">("input");
  // Capture timestamp once when modal opens (lazy initializer)
  const [now] = useState(() => Date.now());

  const numericAmount = parseFloat(amount || "0");
  const isValid = numericAmount > 0 && numericAmount <= maxAmount && horizon !== null;

  const handleConfirm = useCallback(async () => {
    if (!isValid || horizon === null) return;
    setStep("confirming");
    await simulateOperation();
    setStep("success");
    onProtect(numericAmount, horizon);
  }, [isValid, numericAmount, horizon, onProtect]);

  const handleClose = useCallback(() => {
    setAmount("");
    setHorizon(null);
    setStep("input");
    onClose();
  }, [onClose]);

  return (
    <CapitalModal open={open} onClose={handleClose} title="Protect capital">
      {step === "success" ? (
        <SuccessState message="Capital protected within its chosen horizon." />
      ) : (
        <div className="space-y-5">
          <p className="text-small text-text-secondary leading-relaxed">
            Move available capital into a protected horizon. Capital becomes
            locked onchain for the duration you select — no early withdrawals.
          </p>

          <AmountInput
            value={amount}
            onChange={setAmount}
            max={maxAmount}
            label="Amount to protect"
          />

          <HorizonSelector
            selected={horizon}
            onChange={setHorizon}
          />

          {/* Horizon summary */}
          {horizon !== null && numericAmount > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-small text-green-700">
                <span className="font-medium">${numericAmount.toFixed(2)}</span> will be
                protected for <span className="font-medium">{horizon} days</span>.
              </p>
              <p className="text-tiny text-green-600/80 mt-1">
                Available again on{" "}
                {new Date(now + horizon * 86400000).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Calm copy */}
          <p className="text-small text-text-muted leading-relaxed">
            Protection periods are cryptographically enforced onchain. No early
            unlocks, no exceptions — by anyone, including Elora.
          </p>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || step === "confirming"}
              className={cn(
                "w-full rounded-lg py-2.5 text-small font-medium transition-all",
                isValid && step === "input"
                  ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                  : "bg-surface-hover text-text-muted cursor-not-allowed",
              )}
            >
              {step === "confirming" ? "Confirming..." : "Protect capital"}
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
        <div className="mt-6">
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
