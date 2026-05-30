"use client";

import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useVaultLocks,
  useReleaseLock,
  useWithdrawLock,
  useVaultStatus,
} from "@/lib/web3/hooks";
import {
  Lock,
  Unlock,
  Shield,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { CURRENT_CHAIN } from "@/lib/contracts/contracts";
import { useState } from "react";

function getDaysRemaining(unlockAt: number): number {
  const diff = unlockAt - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Track per-lock operation state */
interface LockAction {
  step: "signing" | "confirming" | "done";
  hash?: `0x${string}`;
}

/**
 * Onchain vault locks display.
 * Shows active locks with release/withdraw actions.
 * Each write goes through: signing → confirming → done (with BaseScan link).
 */
export function VaultLocksCard({ className }: { className?: string }) {
  const { isConnected, address } = useAccount();
  const queryClient = useQueryClient();
  const { isDeployed } = useVaultStatus();
  const { locks, isLoading } = useVaultLocks(address);
  const {
    releaseLock,
    isPending: isReleasing,
    isConfirmed: isReleaseConfirmed,
    hash: releaseHash,
  } = useReleaseLock();
  const {
    withdrawLock,
    isPending: isWithdrawing,
    isConfirmed: isWithdrawConfirmed,
    hash: withdrawHash,
  } = useWithdrawLock();
  const [actionLock, setActionLock] = useState<number | null>(null);
  const [lockActions, setLockActions] = useState<Record<number, LockAction>>({});

  if (!isConnected) {
    return null;
  }

  const activeLocks = locks.filter((l) => !l.withdrawn);
  const withdrawnLocks = locks.filter((l) => l.withdrawn);

  const handleRelease = async (lockId: number) => {
    setActionLock(lockId);
    setLockActions((prev) => ({ ...prev, [lockId]: { step: "signing" } }));
    try {
      await releaseLock(lockId);
      setLockActions((prev) => ({
        ...prev,
        [lockId]: { step: "confirming", hash: releaseHash ?? undefined },
      }));
    } catch {
      setLockActions((prev) => {
        const next = { ...prev };
        delete next[lockId];
        return next;
      });
    } finally {
      setActionLock(null);
    }
  };

  const handleWithdraw = async (lockId: number) => {
    setActionLock(lockId);
    setLockActions((prev) => ({ ...prev, [lockId]: { step: "signing" } }));
    try {
      await withdrawLock(lockId);
      setLockActions((prev) => ({
        ...prev,
        [lockId]: { step: "confirming", hash: withdrawHash ?? undefined },
      }));
    } catch {
      setLockActions((prev) => {
        const next = { ...prev };
        delete next[lockId];
        return next;
      });
    } finally {
      setActionLock(null);
    }
  };

  // When tx confirms, mark as done + invalidate cache
  if (isReleaseConfirmed || isWithdrawConfirmed) {
    const targetId = actionLock;
    if (targetId !== null && lockActions[targetId]?.step === "confirming") {
      const hash = isReleaseConfirmed ? releaseHash : withdrawHash;
      setLockActions((prev) => ({
        ...prev,
        [targetId]: { step: "done", hash: hash as `0x${string}` | undefined },
      }));
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }

  const getActionState = (lockId: number) => lockActions[lockId] ?? null;

  return (
    <Card
      className={cn(
        "border-white/10 bg-black/40 backdrop-blur-xl",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-400" />
          Vault Locks
          {!isDeployed && (
            <span className="text-[10px] text-amber-400 ml-auto">
              Contract not deployed
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
          </div>
        ) : locks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-gray-500">
            <Lock className="h-6 w-6 mb-2 opacity-30" />
            <p className="text-xs font-medium">No vault locks yet</p>
            <p className="text-[10px] mt-1 text-center max-w-xs text-gray-600">
              Deposit USDC and create locks to protect your capital.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active locks */}
            {activeLocks.map((lock) => {
              const daysLeft = getDaysRemaining(lock.unlockAt);
              const isExpired = daysLeft === 0;
              const action = getActionState(lock.id);
              const isActionPending =
                actionLock === lock.id && (isReleasing || isWithdrawing);

              return (
                <div
                  key={lock.id}
                  className={cn(
                    "rounded-lg border p-3",
                    isExpired
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-indigo-500/20 bg-indigo-500/5",
                  )}
                >
                  {/* Signing state */}
                  {action?.step === "signing" && (
                    <div className="flex items-center gap-2 mb-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
                      <Loader2 className="h-3 w-3 text-amber-400 animate-spin shrink-0" />
                      <p className="text-[10px] text-amber-300">
                        Signing in your wallet...
                      </p>
                    </div>
                  )}

                  {/* Confirming state */}
                  {action?.step === "confirming" && (
                    <div className="flex items-center gap-2 mb-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-2">
                      <Loader2 className="h-3 w-3 text-indigo-400 animate-spin shrink-0" />
                      <p className="text-[10px] text-indigo-300">
                        Confirming on Base...
                      </p>
                    </div>
                  )}

                  {/* Done state */}
                  {action?.step === "done" && (
                    <div className="flex items-center gap-2 mb-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                      <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                      <p className="text-[10px] text-emerald-300 font-medium">
                        {isExpired ? "Withdrawn" : "Released"}
                      </p>
                      {action.hash && (
                        <a
                          href={`${CURRENT_CHAIN.explorerUrl}/tx/${action.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-[10px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-0.5"
                        >
                          View tx
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Lock header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <Unlock className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Lock className="h-4 w-4 text-indigo-400" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">
                          ${lock.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Created {formatDate(lock.createdAt)}
                        </p>
                      </div>
                    </div>

                    {!action && isExpired && (
                      <Button
                        onClick={() => handleWithdraw(lock.id)}
                        disabled={isActionPending}
                        size="sm"
                        className="h-7 text-[10px] bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/20"
                      >
                        {isActionPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Withdraw"
                        )}
                      </Button>
                    )}
                    {!action && !isExpired && (
                      <Button
                        onClick={() => handleRelease(lock.id)}
                        disabled={isActionPending}
                        size="sm"
                        className="h-7 text-[10px] bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
                      >
                        {isActionPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Release"
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Lock info */}
                  {!isExpired && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <p className="text-[10px] text-gray-500">
                        Unlocks in {daysLeft} day
                        {daysLeft !== 1 ? "s" : ""} —
                        {formatDate(lock.unlockAt)}
                      </p>
                    </div>
                  )}

                  {isExpired && !action && (
                    <p className="text-[10px] text-emerald-400/60 mt-1 italic">
                      Ready to withdraw. Stored today. Available now.
                    </p>
                  )}
                </div>
              );
            })}

            {/* Withdrawn locks */}
            {withdrawnLocks.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                    History
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {withdrawnLocks.map((lock) => (
                  <div
                    key={lock.id}
                    className="rounded-lg border border-gray-500/10 bg-gray-500/5 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Unlock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-semibold text-gray-400">
                          ${lock.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-600">
                          Withdrawn — locked until {formatDate(lock.unlockAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
