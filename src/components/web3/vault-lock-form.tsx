"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateLock, useVaultSummary } from "@/lib/web3/hooks";
import { Shield, Lock, Clock, CheckCircle, Loader2, ExternalLink, AlertTriangle, X } from "lucide-react";
import { CURRENT_CHAIN } from "@/lib/contracts/contracts";

function getExplorerLabel(url: string): string {
  return url.replace("https://", "").replace(".org", "").replace(".com", "");
}

type DurationOption = 7 | 30 | 90;

const DURATION_LABELS: Record<DurationOption, string> = {
  7: "7 days",
  30: "30 days",
  90: "90 days",
};

function getUnlockDate(duration: DurationOption): Date {
  const d = new Date();
  d.setDate(d.getDate() + duration);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Vault Lock Creation Form.
 * Creates an onchain lock on the ProtectedVault contract.
 */
export function VaultLockForm({ className }: { className?: string }) {
  const { isConnected, address } = useAccount();
  const queryClient = useQueryClient();
  const summary = useVaultSummary(address);
  const { createLock, isConfirmed, hash, error } =
    useCreateLock();

  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState<DurationOption>(30);
  const [step, setStep] = useState<"idle" | "signing" | "confirming" | "done">("idle");
  const [showSuccess, setShowSuccess] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const availableBalance = Math.max(
    0,
    summary.totalDeposited - summary.totalLocked - summary.totalWithdrawn,
  );
  const isValid = parsedAmount > 0 && parsedAmount <= availableBalance;

  const unlockDate = useMemo(() => getUnlockDate(duration), [duration]);

  const handleCreateLock = async () => {
    if (!isValid) return;
    setStep("signing");
    try {
      await createLock(parsedAmount, duration * 24 * 60 * 60);
      setStep("confirming");
    } catch {
      setStep("idle");
    }
  };

  // Advance to done + invalidate once confirmed
  if (isConfirmed && step === "confirming") {
    setStep("done");
    setShowSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["vault"] });
  }

  // Reset on error
  if (error && step !== "idle") {
    setStep("idle");
    setShowSuccess(false);
  }

  if (!isConnected) return null;

  return (
    <Card className={cn("border-white/10 bg-black/40 backdrop-blur-xl", className)}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-400" />
          Protect Capital
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Balance */}
        <div className="rounded-lg bg-white/5 p-3 border border-white/5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            Available to Lock
          </p>
          <p className="text-lg font-semibold text-white tabular-nums mt-0.5">
            ${availableBalance.toFixed(2)}
          </p>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">
            Amount to Protect
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              $
            </span>
            <input
              type="number"
              min="0"
              max={availableBalance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={step !== "idle"}
              className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-base pl-7 pr-3
                focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20
                placeholder:text-gray-600 tabular-nums disabled:opacity-50"
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-medium text-gray-400 mb-2 block">
            Lock Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([7, 30, 90] as DurationOption[]).map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                disabled={step !== "idle"}
                className={cn(
                  "h-9 rounded-lg text-xs font-medium border transition-all",
                  duration === d
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                    : "border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400",
                  "disabled:opacity-50",
                )}
              >
                {DURATION_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Unlock date preview */}
        {isValid && step === "idle" && (
          <div className="flex items-center gap-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-3">
            <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-300/70">
              Unlocks {formatDate(unlockDate)}
            </p>
          </div>
        )}

        {/* Submit */}
        {step === "idle" && (
          <Button
            onClick={handleCreateLock}
            disabled={!isValid}
            className={cn(
              "w-full h-10 rounded-lg text-sm font-semibold transition-all",
              isValid
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400"
                : "bg-white/5 text-gray-500 cursor-not-allowed",
            )}
          >
            <Lock className="h-3.5 w-3.5 mr-1.5" />
            Create Lock
          </Button>
        )}

        {step === "signing" && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
            <div>
              <p className="text-xs text-amber-300 font-medium">
                Waiting for wallet signature...
              </p>
              <p className="text-[10px] text-amber-400/60 mt-0.5">
                Check your wallet to confirm the transaction
              </p>
            </div>
          </div>
        )}

        {step === "confirming" && (
          <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
            <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
            <div>
              <p className="text-xs text-indigo-300 font-medium">
                Confirming on Base...
              </p>
              <p className="text-[10px] text-indigo-400/60 mt-0.5">
                Waiting for block confirmation
              </p>
            </div>
          </div>
        )}

        {step === "done" && showSuccess && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300 font-medium">
                Lock created — ${parsedAmount.toFixed(2)} protected until{" "}
                {formatDate(unlockDate)}
              </p>
            </div>
            {hash && (
              <a
                href={`${CURRENT_CHAIN.explorerUrl}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 mt-1"
              >
                View on {getExplorerLabel(CURRENT_CHAIN.explorerUrl)}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-400 font-medium">
                  Transaction failed
                </p>
                <p className="text-[10px] text-red-400/70 mt-0.5 break-words">
                  {error.message?.includes("User rejected")
                    ? "You rejected the transaction in your wallet."
                    : error.message || "An unexpected error occurred. Please try again."}
                </p>
              </div>
              <button
                onClick={() => { setStep("idle"); setShowSuccess(false); }}
                className="shrink-0 text-red-400/50 hover:text-red-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-gray-600 text-center leading-relaxed">
          Locked capital cannot be impulsively withdrawn.
          <br />
          No early unlocks. Discipline compounds quietly.
        </p>
      </CardContent>
    </Card>
  );
}
