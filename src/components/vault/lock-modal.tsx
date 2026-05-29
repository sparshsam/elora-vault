"use client";

import { useState, useMemo } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Shield, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockModalProps {
  open: boolean;
  onClose: () => void;
  availableVaultBalance: number;
  onSuccess?: () => void;
}

type DurationOption = 7 | 30 | 90 | "custom";

function getUnlockDate(duration: DurationOption, customDate?: string): Date {
  if (duration === "custom" && customDate) {
    return new Date(customDate);
  }
  const d = new Date();
  d.setDate(d.getDate() + (duration as number));
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

export function LockModal({
  open,
  onClose,
  availableVaultBalance,
  onSuccess,
}: LockModalProps) {
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState<DurationOption>(30);
  const [customDate, setCustomDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [minDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  const parsedAmount = parseFloat(amount) || 0;
  const isValid = parsedAmount > 0 && parsedAmount <= availableVaultBalance;

  const unlockDate = useMemo(
    () => getUnlockDate(duration, customDate),
    [duration, customDate],
  );

  const handleProtect = async () => {
    if (!isValid) return;

    setLoading(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        amount: parsedAmount,
      };

      if (duration === "custom") {
        body.customDate = customDate;
      } else {
        body.duration = duration;
      }

      if (notes.trim()) {
        body.notes = notes.trim();
      }

      const res = await fetch("/api/vault/locks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to protect capital");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const amountPresets = [
    availableVaultBalance * 0.1,
    availableVaultBalance * 0.25,
    availableVaultBalance * 0.5,
    availableVaultBalance,
  ];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md mx-auto border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl">
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-600/10">
                    <Shield className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <DialogPrimitive.Title className="text-base font-semibold text-white">
                      Protect Capital
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="text-xs text-gray-500 mt-0.5">
                      Lock savings to prevent impulsive use
                    </DialogPrimitive.Description>
                  </div>
                </div>
                <DialogPrimitive.Close className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </DialogPrimitive.Close>
              </div>

              {/* Available balance */}
              <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                  Available Vault Capital
                </p>
                <p className="text-lg font-semibold text-white tabular-nums mt-0.5">
                  ${availableVaultBalance.toFixed(2)}
                </p>
              </div>

              {/* Amount input */}
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
                    max={availableVaultBalance}
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError("");
                    }}
                    placeholder="0.00"
                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-base pl-7 pr-3
                      focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20
                      placeholder:text-gray-600 tabular-nums"
                  />
                </div>
                {/* Preset buttons */}
                <div className="flex gap-2 mt-2">
                  {amountPresets.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setAmount(preset.toFixed(2))}
                      className={cn(
                        "flex-1 h-7 rounded-md text-[10px] font-medium border transition-all",
                        parsedAmount === preset
                          ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                          : "border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400",
                      )}
                    >
                      {i === 3
                        ? "All"
                        : `${(preset / availableVaultBalance * 100).toFixed(0)}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration selector */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-2 block">
                  Protection Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([7, 30, 90] as DurationOption[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "h-9 rounded-lg text-xs font-medium border transition-all",
                        duration === d
                          ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                          : "border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400",
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                  <button
                    onClick={() => setDuration("custom")}
                    className={cn(
                      "h-9 rounded-lg text-xs font-medium border transition-all",
                      duration === "custom"
                        ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                        : "border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400",
                    )}
                  >
                    Custom
                  </button>
                </div>

                {duration === "custom" && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={minDate}
                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 mt-2
                      focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                  />
                )}
              </div>

              {/* Projected unlock */}
              {isValid && (
                <div className="flex items-center gap-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-3">
                  <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <p className="text-xs text-indigo-300/70">
                    Unlocks {formatDate(unlockDate)}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-2 block">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Emergency fund"
                  maxLength={200}
                  className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3
                    focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20
                    placeholder:text-gray-600"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* CTA */}
              <Button
                onClick={handleProtect}
                disabled={!isValid || loading}
                className={cn(
                  "w-full h-10 rounded-lg text-sm font-semibold transition-all",
                  isValid && !loading
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400"
                    : "bg-white/5 text-gray-500 cursor-not-allowed",
                )}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Protecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    Protect Capital
                  </span>
                )}
              </Button>

              {/* Disclaimer */}
              <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                Locked capital cannot be impulsively reused.
                <br />
                No early unlocks. Discipline compounds quietly.
              </p>
            </div>
          </Card>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
