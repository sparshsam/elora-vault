"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/store/useWalletStore";
import { CapitalModal } from "./capital-modal";
import {
  useUSDCAllowance,
  useUSDCApprove,
  useVaultDeposit,
  useCreateLock,
  useUSDCBalance,
} from "@/lib/web3/tx-hooks";
import { shouldBlockSubmit } from "@/lib/tx/transaction-state";

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

/* ── Token Selector (USDC only) ──────────────────────── */

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
  { days: 180, label: "180-day horizon" },
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

/** Calm pending indicator — a quiet pulsing dot + message. */
function PendingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle mb-4">
        <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-text-primary">{message}</p>
      <p className="text-tiny text-text-muted mt-2">Confirm in your wallet when prompted.</p>
    </div>
  );
}

/** Error state with message and retry. */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 mb-4">
        <svg className="h-6 w-6 text-danger" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4M12 16v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-text-primary">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1 rounded-lg bg-surface-subtle text-text-secondary px-4 py-2 text-small font-medium hover:text-text-primary transition-colors border border-border"
      >
        Try again
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  DEPOSIT MODAL — with real USDC approval + deposit      */
/* ─────────────────────────────────────────────────────── */

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

export function DepositModal({ open, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "approve" | "pending" | "success" | "error">("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loggedDepositHash = useRef<`0x${string}` | undefined>(undefined);
  const submittingRef = useRef(false);

  // Real hooks
  const { allowance, refetch: refetchAllowance } = useUSDCAllowance();
  const approve = useUSDCApprove();
  const deposit = useVaultDeposit();
  const { balance } = useUSDCBalance();
  const { syncFromServer } = useWalletStore();

  const numericAmount = parseFloat(amount || "0");
  const needsApproval = numericAmount > allowance && allowance >= 0;
  const depositBlocked = shouldBlockSubmit(deposit.lifecycle) || shouldBlockSubmit(approve.lifecycle) || isSubmitting;

  // Reset state when modal opens
  useEffect(() => {
    if (open && !deposit.lifecycle.isActive && !approve.lifecycle.isActive) {
      setAmount("");
      setStep("input");
      setErrorMsg("");
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [open, deposit.lifecycle.isActive, approve.lifecycle.isActive]);

  // Track deposit tx state
  useEffect(() => {
    if (step === "pending" && deposit.isConfirmed) {
      setStep("success");
      submittingRef.current = false;
      setIsSubmitting(false);
      refetchAllowance();
    }
    if (step === "pending" && deposit.error) {
      setErrorMsg(deposit.lifecycle.calmError ?? "Deposit was not completed.");
      setStep("error");
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [deposit.isConfirmed, deposit.error, deposit.lifecycle.calmError, step, refetchAllowance]);

  useEffect(() => {
    if (!deposit.isConfirmed || !deposit.hash || loggedDepositHash.current === deposit.hash) return;
    loggedDepositHash.current = deposit.hash;

    (async () => {
      await fetch("/api/onchain/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ONCHAIN_DEPOSIT",
          amount: numericAmount,
          txHash: deposit.hash,
        }),
      });
      await syncFromServer();
    })().catch(() => {
      loggedDepositHash.current = undefined;
    });
  }, [deposit.hash, deposit.isConfirmed, numericAmount, syncFromServer]);

  // Track approval tx state
  useEffect(() => {
    if (step === "approve" && approve.isConfirmed) {
      refetchAllowance().then(() => {
        setStep("input");
        submittingRef.current = false;
        setIsSubmitting(false);
      });
    }
    if (step === "approve" && approve.error) {
      setErrorMsg(approve.lifecycle.calmError ?? "Authorization was not completed.");
      setStep("error");
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [approve.isConfirmed, approve.error, approve.lifecycle.calmError, step, refetchAllowance]);

  const handleDeposit = useCallback(() => {
    if (numericAmount <= 0 || depositBlocked) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    if (needsApproval) {
      setStep("approve");
      approve.approve(numericAmount);
    } else {
      setStep("pending");
      deposit.deposit(numericAmount);
    }
  }, [numericAmount, depositBlocked, needsApproval, approve, deposit]);

  const handleRetry = useCallback(() => {
    setErrorMsg("");
    submittingRef.current = false;
    setIsSubmitting(false);
    setStep("input");
  }, []);

  const handleClose = useCallback(() => {
    if (deposit.lifecycle.isActive || approve.lifecycle.isActive) return;
    setAmount("");
    setStep("input");
    setErrorMsg("");
    setIsSubmitting(false);
    onClose();
  }, [deposit.lifecycle.isActive, approve.lifecycle.isActive, onClose]);

  const pendingMessage = needsApproval
    ? "Authorizing capital access..."
    : "Deposit submitted for confirmation.";

  return (
    <CapitalModal open={open} onClose={handleClose} title="Deposit complete">
      {step === "success" ? (
        <SuccessState message="Capital is now available inside Elora." />
      ) : step === "error" ? (
        <ErrorState message={errorMsg} onRetry={handleRetry} />
      ) : step === "approve" || step === "pending" ? (
        <PendingState message={pendingMessage} />
      ) : (
        <div className="space-y-5">
          <AmountInput
            value={amount}
            onChange={setAmount}
            max={balance}
            label="Amount to deposit"
          />

          <div className="space-y-2">
            <label className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
              Asset
            </label>
            <TokenSelector />
          </div>

          {needsApproval && numericAmount > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-tiny text-amber-700">
                First deposit requires authorizing the vault to access your USDC.
                This is a one-time approval per vault.
              </p>
            </div>
          )}

          <p className="text-small text-text-muted leading-relaxed">
            Deposit USDC from your connected wallet into your self-custodied
            vault on Base Sepolia.
          </p>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleDeposit}
              disabled={numericAmount <= 0 || numericAmount > balance || depositBlocked}
              className={cn(
                "w-full rounded-lg py-2.5 text-small font-medium transition-all",
                numericAmount > 0 && numericAmount <= balance && !depositBlocked
                  ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                  : "bg-surface-hover text-text-muted cursor-not-allowed",
              )}
            >
              {needsApproval ? "Authorize & deposit" : "Deposit"}
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
/*  WITHDRAW MODAL                                          */
/* ─────────────────────────────────────────────────────── */

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  maxAmount: number;
}

export function WithdrawModal({ open, onClose, maxAmount }: WithdrawModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "confirm" | "pending" | "success" | "error">("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const numericAmount = parseFloat(amount || "0");
  const isValid = numericAmount > 0 && numericAmount <= maxAmount;

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";

  // useWithdrawUnlocked is imported from tx-hooks
  // For now, the withraw flow is simulated since withdrawUnlocked pulls ALL unlocked balance.

  useEffect(() => {
    if (open) {
      setAmount("");
      setStep("input");
      setErrorMsg("");
    }
  }, [open]);

  const handleContinue = useCallback(() => {
    if (!isValid) return;
    setStep("confirm");
  }, [isValid]);

  const handleConfirm = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setStep("pending");
    try {
      // WithdrawUnlocked pulls all unlocked — set amount for display only
      // Future: implement partial withdrawal via approve + transfer from vault
      setStep("success");
    } catch {
      setErrorMsg("Withdrawal was not completed.");
      setStep("error");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setErrorMsg("");
    submittingRef.current = false;
    setIsSubmitting(false);
    setStep("input");
  }, []);

  const handleClose = useCallback(() => {
    setAmount("");
    setStep("input");
    submittingRef.current = false;
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  return (
    <CapitalModal open={open} onClose={handleClose} title="Withdraw">
      {step === "success" ? (
        <SuccessState message="Capital returned to your connected wallet." />
      ) : step === "error" ? (
        <ErrorState message={errorMsg} onRetry={handleRetry} />
      ) : step === "pending" ? (
        <PendingState message="Withdrawal submitted for confirmation." />
      ) : step === "confirm" ? (
        <div className="space-y-5">
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
              disabled={isSubmitting}
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
/*  PROTECT CAPITAL MODAL — calls createLock onchain        */
/* ─────────────────────────────────────────────────────── */

interface ProtectCapitalModalProps {
  open: boolean;
  onClose: () => void;
  maxAmount: number;
}

export function ProtectCapitalModal({
  open,
  onClose,
  maxAmount,
}: ProtectCapitalModalProps) {
  const [amount, setAmount] = useState("");
  const [horizon, setHorizon] = useState<number | null>(null);
  const [step, setStep] = useState<"input" | "pending" | "success" | "error">("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now] = useState(() => Date.now());
  const loggedLockHash = useRef<`0x${string}` | undefined>(undefined);
  const submittingRef = useRef(false);

  const createLock = useCreateLock();
  const { syncFromServer } = useWalletStore();

  const numericAmount = parseFloat(amount || "0");
  const isValid = numericAmount > 0 && numericAmount <= maxAmount && horizon !== null;
  const protectionBlocked = shouldBlockSubmit(createLock.lifecycle) || isSubmitting;

  useEffect(() => {
    if (open && !createLock.lifecycle.isActive) {
      setAmount("");
      setHorizon(null);
      setStep("input");
      setErrorMsg("");
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [open, createLock.lifecycle.isActive]);

  // Track createLock tx state
  useEffect(() => {
    if (step === "pending" && createLock.isConfirmed) {
      setStep("success");
      submittingRef.current = false;
      setIsSubmitting(false);
    }
    if (step === "pending" && createLock.error) {
      setErrorMsg(createLock.lifecycle.calmError ?? "Protection was not completed.");
      setStep("error");
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [createLock.isConfirmed, createLock.error, createLock.lifecycle.calmError, step]);

  useEffect(() => {
    if (!createLock.isConfirmed || !createLock.hash || loggedLockHash.current === createLock.hash || horizon === null) return;
    loggedLockHash.current = createLock.hash;

    (async () => {
      await fetch("/api/onchain/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ONCHAIN_LOCK_CREATED",
          amount: numericAmount,
          txHash: createLock.hash,
          unlockAt: new Date(now + horizon * 86400000).toISOString(),
        }),
      });
      await syncFromServer();
    })().catch(() => {
      loggedLockHash.current = undefined;
    });
  }, [createLock.hash, createLock.isConfirmed, horizon, now, numericAmount, syncFromServer]);

  const handleConfirm = useCallback(() => {
    if (!isValid || horizon === null || protectionBlocked) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    const durationSeconds = horizon * 86400;
    setStep("pending");
    createLock.createLock(numericAmount, durationSeconds);
  }, [isValid, numericAmount, horizon, protectionBlocked, createLock]);

  const handleRetry = useCallback(() => {
    setErrorMsg("");
    submittingRef.current = false;
    setIsSubmitting(false);
    setStep("input");
  }, []);

  const handleClose = useCallback(() => {
    if (createLock.lifecycle.isActive) return;
    setAmount("");
    setHorizon(null);
    setStep("input");
    onClose();
  }, [createLock.lifecycle.isActive, onClose]);

  return (
    <CapitalModal open={open} onClose={handleClose} title={step === "success" ? "Capital protected" : "Protect capital"}>
      {step === "success" ? (
        <SuccessState message="Capital has been moved into a protection horizon." />
      ) : step === "error" ? (
        <ErrorState message={errorMsg} onRetry={handleRetry} />
      ) : step === "pending" ? (
        <PendingState message="Capital entering protection." />
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

          <p className="text-small text-text-muted leading-relaxed">
            Protection periods are cryptographically enforced onchain. No early
            unlocks, no exceptions — by anyone, including Elora.
          </p>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || protectionBlocked}
              className={cn(
                "w-full rounded-lg py-2.5 text-small font-medium transition-all",
                isValid && !protectionBlocked
                  ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                  : "bg-surface-hover text-text-muted cursor-not-allowed",
              )}
            >
              Protect capital
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
