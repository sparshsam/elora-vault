"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Lock, Unlock, Shield } from "lucide-react";

interface LockCardProps {
  id: string;
  amount: number;
  createdAt: string;
  unlockAt: string;
  status: "ACTIVE" | "UNLOCKED" | "CANCELLED";
  notes?: string | null;
}

function getDaysRemaining(unlockAt: string): number {
  const now = Date.now();
  const unlock = new Date(unlockAt).getTime();
  const diff = unlock - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LockCard({
  amount,
  createdAt,
  unlockAt,
  status,
  notes,
}: LockCardProps) {
  const daysRemaining = getDaysRemaining(unlockAt);
  const isActive = status === "ACTIVE";
  const isUnlocked = status === "UNLOCKED";

  return (
    <Card
      className={cn(
        "border",
        isActive
          ? "border-indigo-500/20 bg-indigo-500/5"
          : isUnlocked
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-gray-500/10 bg-gray-500/5",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              isActive
                ? "border-indigo-500/20 bg-indigo-600/10"
                : isUnlocked
                  ? "border-emerald-500/20 bg-emerald-600/10"
                  : "border-gray-500/20 bg-gray-500/10",
            )}
          >
            {isActive ? (
              <Lock className="h-4 w-4 text-indigo-400" />
            ) : isUnlocked ? (
              <Unlock className="h-4 w-4 text-emerald-400" />
            ) : (
              <Shield className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                ${amount.toFixed(2)}
              </h3>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5",
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400"
                    : isUnlocked
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-gray-500/10 text-gray-400",
                )}
              >
                {status}
              </span>
            </div>

            {notes && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                {notes}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>Created {formatDate(createdAt)}</span>
              <span className="text-gray-600">·</span>
              <span>
                {isActive
                  ? daysRemaining > 0
                    ? `Unlocks in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`
                    : "Unlocking..."
                  : `Unlocked ${formatDate(unlockAt)}`}
              </span>
            </div>

            {/* Progress bar for active locks */}
            {isActive && (
              <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, (daysRemaining / 90) * 100))}%`,
                  }}
                />
              </div>
            )}

            {/* Countdown for active locks */}
            {isActive && (
              <p className="text-[10px] text-indigo-400/60 mt-1 italic">
                {daysRemaining > 0
                  ? `Stored today. Available ${formatDate(unlockAt)}.`
                  : "Releasing..."}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
